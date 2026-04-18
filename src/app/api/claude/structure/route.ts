import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude, parseJsonResponse } from "@/lib/claude";
import { checkQuotaAndIncrement } from "@/lib/quota";
import {
  SHIFT_NOTE_SYSTEM_PROMPT,
  buildShiftNoteUserPrompt,
  type StructuredNoteOutput,
} from "@/lib/prompts/shift-note";

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
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (appUser) {
    const quota = await checkQuotaAndIncrement(appUser.organization_id, "ai");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }
  }

  const { noteId } = await request.json();
  if (!noteId) {
    return NextResponse.json({ error: "noteId required" }, { status: 400 });
  }

  // Fetch note with resident details
  const { data: note } = await supabase
    .from("notes")
    .select("*, residents(first_name, last_name, care_notes_context, conditions)")
    .eq("id", noteId)
    .single();

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Fetch author name
  const { data: author } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", note.author_id)
    .single();

  const resident = note.residents as {
    first_name: string;
    last_name: string;
    care_notes_context: string | null;
    conditions: string | null;
  } | null;

  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  try {
    // Update attempt timestamp
    await supabase
      .from("notes")
      .update({ last_structuring_attempt_at: new Date().toISOString() })
      .eq("id", noteId);

    const raw = await callClaude({
      systemPrompt: SHIFT_NOTE_SYSTEM_PROMPT,
      userPrompt: buildShiftNoteUserPrompt({
        residentFirstName: resident.first_name,
        residentLastName: resident.last_name,
        careNotesContext: resident.care_notes_context,
        conditions: resident.conditions,
        timestamp: note.created_at,
        caregiverName: (author as { full_name: string } | null)?.full_name || "Unknown",
        rawInput: note.raw_input,
      }),
    });

    const structured = parseJsonResponse<StructuredNoteOutput>(raw);

    // Determine classification from flags
    const hasFlags = structured.flags && structured.flags.length > 0;
    const aiClassification = hasFlags ? "possible_incident" : "routine";

    // Build metadata
    const metadata = {
      categories: Object.keys(structured.sections || {}),
      flags: structured.flags || [],
      ai_classification: aiClassification,
      model_used: "claude-sonnet-4-6",
      tokens_used: { input: 0, output: 0 }, // Anthropic SDK doesn't expose this easily in v1
    };

    // Update note with structured output
    await supabase
      .from("notes")
      .update({
        structured_output: JSON.stringify(structured),
        is_structured: true,
        structuring_error: null,
        metadata,
        flagged_as_incident: hasFlags,
      })
      .eq("id", noteId);

    return NextResponse.json({ structured, metadata });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Save error for retry
    await supabase
      .from("notes")
      .update({
        structuring_error: message,
        is_structured: false,
      })
      .eq("id", noteId);

    return NextResponse.json(
      { error: "Failed to structure note", details: message },
      { status: 500 }
    );
  }
}
