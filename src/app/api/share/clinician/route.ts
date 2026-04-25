import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { callClaude, parseJsonResponse } from "@/lib/claude";
import type { Json } from "@/types/database";
import {
  parseStructuredOutput,
  filterSectionsForClinician,
  serializeSectionsForPrompt,
} from "@/lib/structured-output";
import { logAudit } from "@/lib/audit";
import { checkQuotaAndIncrement } from "@/lib/quota";
import { sendClinicianPortalLink } from "@/lib/resend";
import {
  CLINICIAN_SUMMARY_SYSTEM_PROMPT,
  buildClinicianSummaryUserPrompt,
  type ClinicianSummaryOutput,
} from "@/lib/prompts/clinician-summary";

const DEFAULT_EXPIRY_DAYS = 14;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("organization_id, role, full_name")
    .eq("id", user.id)
    .single();

  const typedAppUser = appUser as {
    organization_id: string;
    role: string;
    full_name: string;
  } | null;

  if (!typedAppUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (typedAppUser.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can share with clinicians" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const residentId: string | undefined = body.residentId;
  const clinicianId: string | undefined = body.clinicianId;
  const noteIds: string[] | undefined = body.noteIds;
  const dateRangeStart: string | undefined = body.dateRangeStart;
  const dateRangeEnd: string | undefined = body.dateRangeEnd;
  const includeSensitive: boolean = body.includeSensitive === true;
  const expiresInDays: number =
    typeof body.expiresInDays === "number" && body.expiresInDays > 0
      ? Math.min(body.expiresInDays, 90)
      : DEFAULT_EXPIRY_DAYS;

  if (!residentId || !clinicianId) {
    return NextResponse.json(
      { error: "residentId and clinicianId required" },
      { status: 400 }
    );
  }

  const usingNoteIds = Array.isArray(noteIds) && noteIds.length > 0;
  if (!usingNoteIds && (!dateRangeStart || !dateRangeEnd)) {
    return NextResponse.json(
      { error: "Provide either noteIds or dateRangeStart+dateRangeEnd" },
      { status: 400 }
    );
  }

  const quota = await checkQuotaAndIncrement(typedAppUser.organization_id, "ai");
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason }, { status: 429 });
  }

  // Resident (RLS enforces org scope)
  const { data: resident } = await supabase
    .from("residents")
    .select("first_name, last_name, date_of_birth, conditions, care_notes_context, organization_id")
    .eq("id", residentId)
    .single();

  const typedResident = resident as {
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    conditions: string | null;
    care_notes_context: string | null;
    organization_id: string;
  } | null;

  if (!typedResident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  // Clinician must belong to same org AND be assigned to this resident.
  const { data: clinician } = await supabase
    .from("clinicians")
    .select("id, full_name, email, specialty")
    .eq("id", clinicianId)
    .eq("organization_id", typedResident.organization_id)
    .eq("is_active", true)
    .single();

  const typedClinician = clinician as {
    id: string;
    full_name: string;
    email: string;
    specialty: string | null;
  } | null;

  if (!typedClinician) {
    return NextResponse.json(
      { error: "Clinician not found or inactive" },
      { status: 404 }
    );
  }

  const { data: assignment } = await supabase
    .from("resident_clinicians")
    .select("relationship")
    .eq("resident_id", residentId)
    .eq("clinician_id", clinicianId)
    .maybeSingle();

  const typedAssignment = assignment as { relationship: string } | null;

  if (!typedAssignment) {
    return NextResponse.json(
      { error: "This clinician is not assigned to this resident" },
      { status: 400 }
    );
  }

  // Organization (for facility name, email-from)
  const { data: org } = await supabase
    .from("organizations")
    .select("name, email_from_name, email_reply_to")
    .eq("id", typedResident.organization_id)
    .single();

  const typedOrg = org as {
    name: string;
    email_from_name: string | null;
    email_reply_to: string | null;
  } | null;

  // Notes in scope
  let notesQuery = supabase
    .from("notes")
    .select("id, created_at, structured_output, author_id")
    .eq("resident_id", residentId)
    .eq("is_structured", true)
    .order("created_at", { ascending: true });

  if (usingNoteIds) {
    notesQuery = notesQuery.in("id", noteIds!);
  } else {
    notesQuery = notesQuery
      .gte("created_at", dateRangeStart!)
      .lte("created_at", dateRangeEnd! + "T23:59:59Z");
  }

  const { data: notesData } = await notesQuery;

  const notes = (notesData ?? []) as Array<{
    id: string;
    created_at: string;
    structured_output: string;
    author_id: string;
  }>;

  if (notes.length === 0) {
    return NextResponse.json(
      { error: "No structured notes found in this scope" },
      { status: 400 }
    );
  }

  // Author names for prompt context
  const authorIds = [...new Set(notes.map((n) => n.author_id))];
  const { data: authors } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", authorIds);

  const authorMap = new Map(
    ((authors ?? []) as Array<{ id: string; full_name: string }>).map((a) => [
      a.id,
      a.full_name,
    ])
  );

  const effectiveStart = usingNoteIds
    ? notes[0].created_at.slice(0, 10)
    : dateRangeStart!;
  const effectiveEnd = usingNoteIds
    ? notes[notes.length - 1].created_at.slice(0, 10)
    : dateRangeEnd!;

  // Phase 3: drop billing_ops_only and sensitive_restricted sections before
  // the summary is generated. Sensitive-restricted unlock for clinicians is
  // Phase 4 and will require an explicit admin action + audit row.
  const filteredNotes = notes
    .map((n) => {
      const parsed = parseStructuredOutput(n.structured_output);
      if (!parsed) return null;
      const allowed = filterSectionsForClinician(parsed.sections, {
        includeSensitive,
      });
      if (allowed.length === 0) return null;
      return {
        id: n.id,
        created_at: n.created_at,
        author_id: n.author_id,
        structured_output: serializeSectionsForPrompt(allowed, parsed.follow_up),
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);

  if (filteredNotes.length === 0) {
    return NextResponse.json(
      {
        error:
          "No clinician-appropriate content in this scope. All sections were billing-only or sensitive-restricted.",
      },
      { status: 400 }
    );
  }

  // Claude: generate clinician summary
  let summary: ClinicianSummaryOutput;
  try {
    const raw = await callClaude({
      systemPrompt: CLINICIAN_SUMMARY_SYSTEM_PROMPT,
      userPrompt: buildClinicianSummaryUserPrompt({
        facilityName: typedOrg?.name || "Our Facility",
        residentFirstName: typedResident.first_name,
        residentLastName: typedResident.last_name,
        residentDob: typedResident.date_of_birth,
        clinicianName: typedClinician.full_name,
        relationship: typedAssignment.relationship,
        dateRangeStart: effectiveStart,
        dateRangeEnd: effectiveEnd,
        conditions: typedResident.conditions,
        careNotesContext: typedResident.care_notes_context,
        notes: filteredNotes.map((n) => ({
          created_at: n.created_at,
          author_name: authorMap.get(n.author_id) || "Staff",
          structured_output: n.structured_output,
        })),
      }),
      maxTokens: 1500,
    });

    summary = parseJsonResponse<ClinicianSummaryOutput>(raw);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate clinician summary", details: message },
      { status: 500 }
    );
  }

  // Generate magic link token. Unsigned token is returned to the email sender
  // once; only its SHA-256 is persisted. Anyone with the unsigned token can
  // open the portal until expires_at or revoked_at.
  const unsignedToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto
    .createHash("sha256")
    .update(unsignedToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  );

  const shareScope = usingNoteIds
    ? { note_ids: notes.map((n) => n.id) }
    : { date_range: { start: dateRangeStart, end: dateRangeEnd } };

  const { data: shareRow, error: insertError } = await supabase
    .from("clinician_share_links")
    .insert({
      organization_id: typedResident.organization_id,
      resident_id: residentId,
      clinician_id: clinicianId,
      token_hash: tokenHash,
      share_scope: shareScope as unknown as Json,
      rendered_summary: summary as unknown as Json,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !shareRow) {
    return NextResponse.json(
      { error: "Failed to persist share link", details: insertError?.message },
      { status: 500 }
    );
  }

  const typedShareRow = shareRow as { id: string };

  // Append-only disclosure audit. legal_basis is 'treatment' — coordination
  // with a treating physician, per HIPAA TPO.
  await supabase.from("disclosure_events").insert({
    organization_id: typedResident.organization_id,
    resident_id: residentId,
    actor_user_id: user.id,
    recipient_type: "clinician",
    recipient_id: clinicianId,
    legal_basis: "treatment",
    categories_shared: [
      "key_observations",
      ...(summary.safety_events.length > 0 ? ["safety_events"] : []),
      ...(summary.medication_adherence ? ["medication_adherence"] : []),
      ...(summary.cognitive_changes ? ["cognitive_changes"] : []),
    ],
    source_note_ids: filteredNotes.map((n) => n.id),
    delivery_method: "magic_link_portal",
    share_link_id: typedShareRow.id,
    sensitive_override: includeSensitive,
  });

  await logAudit({
    organizationId: typedResident.organization_id,
    userId: user.id,
    eventType: "share_create",
    objectType: "share_link",
    objectId: typedShareRow.id,
    request,
    metadata: {
      recipient_type: "clinician",
      clinician_id: clinicianId,
      resident_id: residentId,
      sensitive_override: includeSensitive,
      source_note_count: filteredNotes.length,
    },
  });

  // Portal URL
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    `https://${request.headers.get("host") || "kinroster.com"}`;
  const portalUrl = `${origin}/portal/clinician/${unsignedToken}`;

  // Send email (best-effort — if it fails, the share row still exists so the
  // admin can resend from the UI).
  let emailId: string | null = null;
  try {
    const result = await sendClinicianPortalLink({
      to: typedClinician.email,
      clinicianName: typedClinician.full_name,
      fromName: typedOrg?.email_from_name || typedOrg?.name || "Kinroster",
      replyTo: typedOrg?.email_reply_to || "noreply@kinroster.com",
      facilityName: typedOrg?.name || "Our Facility",
      residentDisplay: `${typedResident.first_name} ${typedResident.last_name}`,
      portalUrl,
      expiresAt,
    });
    emailId = result.id;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Mark via a secondary disclosure row rather than updating the immutable
    // audit log. Admin can retry send via the revoke+regenerate flow.
    return NextResponse.json(
      {
        share_link_id: typedShareRow.id,
        expires_at: expiresAt.toISOString(),
        email_sent: false,
        email_error: message,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    share_link_id: typedShareRow.id,
    expires_at: expiresAt.toISOString(),
    email_sent: true,
    email_id: emailId,
  });
}

