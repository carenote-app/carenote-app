import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAssistantOverrides } from "@/lib/vapi";
import { checkQuotaAndIncrement } from "@/lib/quota";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { residentId } = await request.json();
  if (!residentId) {
    return NextResponse.json({ error: "residentId required" }, { status: 400 });
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

  const firstName = resident.first_name;
  const conditions = resident.conditions;
  const firstMessage = conditions
    ? `Hi ${appUser.full_name}, this is CareNote. Let's do ${firstName}'s shift note. I see ${firstName} has ${conditions} on file. How were they today?`
    : `Hi ${appUser.full_name}, this is CareNote. Let's do ${firstName}'s shift note. How were they today?`;

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
