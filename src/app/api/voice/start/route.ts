import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAssistantOverrides } from "@/lib/vapi";
import { checkQuotaAndIncrement } from "@/lib/quota";
import { logAudit } from "@/lib/audit";

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
    .select("id, first_name, last_name, conditions, care_notes_context, organization_id")
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

  const firstName = resident.first_name;
  const conditions = resident.conditions;
  const firstMessage = conditions
    ? `Hi ${appUser.full_name}, this is Kinroster. Let's do ${firstName}'s shift note. I see ${firstName} has ${conditions} on file. How were they today?`
    : `Hi ${appUser.full_name}, this is Kinroster. Let's do ${firstName}'s shift note. How were they today?`;

  const assistantOverrides = {
    ...buildAssistantOverrides({
      caregiverName: appUser.full_name,
      residentFirstName: resident.first_name,
      residentLastName: resident.last_name,
      conditions: resident.conditions,
      careNotesContext: resident.care_notes_context,
    }),
    firstMessage,
    metadata: { sessionId },
  };

  return NextResponse.json({
    sessionId,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    assistantOverrides,
  });
}
