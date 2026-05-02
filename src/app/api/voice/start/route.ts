import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAssistantOverrides } from "@/lib/vapi";
import { checkQuotaAndIncrement } from "@/lib/quota";
import { logAudit } from "@/lib/audit";
import { getCaregiverLocale, getResidentContext } from "@/lib/i18n/locale";

interface NoteSummaryRow {
  created_at: string;
  structured_output: string | null;
  flagged_as_incident: boolean | null;
}

function extractSummary(structuredOutput: string | null): string | null {
  if (!structuredOutput) return null;
  try {
    const parsed = JSON.parse(structuredOutput) as { summary?: unknown };
    return typeof parsed.summary === "string" ? parsed.summary : null;
  } catch {
    return null;
  }
}

function formatRecentNotes(rows: NoteSummaryRow[]): string {
  const lines = rows
    .map((row) => {
      const summary = extractSummary(row.structured_output);
      if (!summary) return null;
      const date = row.created_at.slice(0, 10);
      return `${date}: ${summary}`;
    })
    .filter((s): s is string => s !== null);
  return lines.length === 0 ? "" : lines.join("\n");
}

function formatRecentIncidents(rows: NoteSummaryRow[]): string {
  const lines = rows
    .filter((r) => r.flagged_as_incident)
    .map((row) => {
      const summary = extractSummary(row.structured_output);
      const date = row.created_at.slice(0, 10);
      return summary
        ? `${date}: ${summary}`
        : `${date}: (incident, no summary)`;
    });
  return lines.length === 0 ? "" : lines.join("\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { residentId, recordingConsentAccepted, recordingConsentVersion } =
    await request.json();
  if (!residentId) {
    return NextResponse.json({ error: "residentId required" }, { status: 400 });
  }

  // Recording consent gate. The voice call captures the caregiver's speech
  // and transcribes it as part of the care record, which under some state
  // laws (CA CIPA, IL BIPA) touches two-party-consent and biometric
  // information requirements. The client persists the acknowledgment in
  // localStorage; the server enforces the gate and records the consent on
  // the audit log so we can show it was captured if ever asked.
  if (!recordingConsentAccepted) {
    return NextResponse.json(
      {
        error:
          "Recording consent required. Please acknowledge the consent disclosure to start a voice call.",
        consent_required: true,
      },
      { status: 400 }
    );
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id, full_name, organization_id")
    .eq("id", authUser.id)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const quota = await checkQuotaAndIncrement(appUser.organization_id, "voice");
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason }, { status: 429 });
  }

  const { data: resident } = await supabase
    .from("residents")
    .select(
      "id, first_name, last_name, conditions, care_notes_context, organization_id, given_name, family_name"
    )
    .eq("id", residentId)
    .eq("organization_id", appUser.organization_id)
    .single();

  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const { data: session, error: insertError } = await supabase
    .from("voice_sessions")
    .insert({
      organization_id: appUser.organization_id,
      resident_id: resident.id,
      caregiver_id: appUser.id,
      call_type: "caregiver_intake",
      status: "initiated",
    })
    .select()
    .single();

  if (insertError || !session) {
    return NextResponse.json(
      { error: "Failed to create voice session", details: insertError?.message },
      { status: 500 }
    );
  }

  const sessionId = (session as { id: string }).id;

  await logAudit({
    organizationId: appUser.organization_id,
    userId: appUser.id,
    eventType: "permission_change",
    objectType: "user",
    objectId: appUser.id,
    request,
    metadata: {
      action: "voice_recording_consent",
      consent_version:
        typeof recordingConsentVersion === "string"
          ? recordingConsentVersion
          : "v1",
      voice_session_id: sessionId,
      resident_id: resident.id,
    },
  });

  // Locale + cultural context for prompt phrasing.
  const [caregiverLanguage, residentContext] = await Promise.all([
    getCaregiverLocale(appUser.id),
    getResidentContext(resident.id),
  ]);

  // Recent grounding: last 5 notes' summaries + last 14 days' incidents.
  // Both fetches are constrained to this resident in the caller's org.
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  ).toISOString();
  const [recentNotesRes, recentIncidentsRes] = await Promise.all([
    supabase
      .from("notes")
      .select("created_at, structured_output, flagged_as_incident")
      .eq("resident_id", resident.id)
      .eq("organization_id", appUser.organization_id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notes")
      .select("created_at, structured_output, flagged_as_incident")
      .eq("resident_id", resident.id)
      .eq("organization_id", appUser.organization_id)
      .eq("flagged_as_incident", true)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const recentNotes = (recentNotesRes.data ?? []) as NoteSummaryRow[];
  const recentIncidents = (recentIncidentsRes.data ?? []) as NoteSummaryRow[];

  // Per-call keyterms boost Deepgram recognition for resident name + meds.
  // Conditions are a free-text comma/space-delimited string today; split and
  // keep short tokens that look like names rather than narratives.
  const conditionTokens = (resident.conditions ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 32);

  const keyterms = [
    resident.given_name || resident.first_name,
    resident.family_name || resident.last_name,
    ...conditionTokens,
  ].filter((s): s is string => Boolean(s));

  // The Vapi assistant generates its own greeting from the system prompt +
  // variables — we no longer hardcode an English firstMessage here.
  const assistantOverrides = {
    ...buildAssistantOverrides({
      caregiverName: appUser.full_name,
      caregiverLanguage,
      residentFirstName: resident.given_name || resident.first_name,
      residentLastName: resident.family_name || resident.last_name,
      residentLanguage: residentContext.preferred_language || caregiverLanguage,
      outputLanguage: residentContext.output_language,
      honorificPreference: residentContext.honorific_preference,
      culturalRegister: residentContext.cultural_register,
      conditions: resident.conditions,
      careNotesContext: resident.care_notes_context,
      recentNotesSummary: formatRecentNotes(recentNotes),
      recentIncidents: formatRecentIncidents(recentIncidents),
      keyterms,
    }),
    metadata: { sessionId },
  };

  return NextResponse.json({
    sessionId,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    assistantOverrides,
  });
}
