import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVapiWebhook, type VapiWebhookEvent } from "@/lib/vapi";
import { callClaude, parseJsonResponse } from "@/lib/claude";
import { incrementUsage } from "@/lib/quota";
import {
  SHIFT_NOTE_SYSTEM_PROMPT,
  buildShiftNoteUserPrompt,
  type StructuredNoteOutput,
} from "@/lib/prompts/shift-note";

// Look up our voice_sessions row using either metadata.sessionId (preferred)
// or vapi_call_id as fallback.
async function findSession(
  supabase: ReturnType<typeof createAdminClient>,
  event: VapiWebhookEvent
) {
  const sessionId =
    event.call.assistantOverrides?.metadata?.sessionId ??
    event.call.metadata?.sessionId;
  if (sessionId) {
    const { data } = await supabase
      .from("voice_sessions")
      .select("id, organization_id, resident_id, caregiver_id")
      .eq("id", sessionId)
      .single();
    return data as {
      id: string;
      organization_id: string;
      resident_id: string;
      caregiver_id: string;
    } | null;
  }
  // Fallback: lookup by vapi_call_id
  const { data } = await supabase
    .from("voice_sessions")
    .select("id, organization_id, resident_id, caregiver_id")
    .eq("vapi_call_id", event.call.id)
    .single();
  return data as {
    id: string;
    organization_id: string;
    resident_id: string;
    caregiver_id: string;
  } | null;
}

export async function POST(request: NextRequest) {
  if (!verifyVapiWebhook(request)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = (await request.json()) as { message: VapiWebhookEvent };
  const event = payload.message;

  if (!event?.type) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  if (event.type === "status-update") {
    const session = await findSession(supabase, event);
    if (session) {
      const status = event.status === "in-progress" ? "in_progress" : event.status === "ended" ? "completed" : null;
      if (status) {
        await supabase
          .from("voice_sessions")
          .update({
            status,
            vapi_call_id: event.call.id,
            ...(status === "in_progress" ? { started_at: new Date().toISOString() } : {}),
          })
          .eq("id", session.id);
      }
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === "end-of-call-report") {
    const session = await findSession(supabase, event);

    if (!session) {
      return NextResponse.json({ error: "Session not found for call" }, { status: 404 });
    }

    const transcript = event.transcript || (event.messages ?? []).map((m) => `${m.role}: ${m.message ?? ""}`).join("\n");

    await supabase
      .from("voice_sessions")
      .update({
        status: "completed",
        vapi_call_id: event.call.id,
        ended_at: event.endedAt || new Date().toISOString(),
        duration_seconds: event.durationSeconds ?? null,
        full_transcript: transcript,
      })
      .eq("id", session.id);

    if (event.messages?.length) {
      const turns = event.messages
        .filter((m) => m.message && m.role !== "tool")
        .map((m) => ({
          session_id: session.id,
          role: m.role,
          text: m.message!,
          offset_ms: m.secondsFromStart ? Math.round(m.secondsFromStart * 1000) : null,
        }));
      if (turns.length) {
        await supabase.from("voice_transcripts").insert(turns);
      }
    }

    if (!transcript.trim()) {
      return NextResponse.json({ received: true, skipped: "empty transcript" });
    }

    const { data: resident } = await supabase
      .from("residents")
      .select("first_name, last_name, care_notes_context, conditions")
      .eq("id", session.resident_id)
      .single();

    const { data: author } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", session.caregiver_id)
      .single();

    const residentRow = resident as {
      first_name: string;
      last_name: string;
      care_notes_context: string | null;
      conditions: string | null;
    } | null;

    if (!residentRow) {
      return NextResponse.json({ received: true, skipped: "resident missing" });
    }

    const shiftFromHour = (() => {
      const h = new Date().getHours();
      if (h < 12) return "morning";
      if (h < 18) return "afternoon";
      return "night";
    })();

    const { data: noteRow } = await supabase
      .from("notes")
      .insert({
        organization_id: session.organization_id,
        resident_id: session.resident_id,
        author_id: session.caregiver_id,
        note_type: "shift_note",
        raw_input: transcript,
        shift: shiftFromHour,
        metadata: { source: "voice_call", voice_session_id: session.id },
      })
      .select("id, created_at")
      .single();

    const note = noteRow as { id: string; created_at: string } | null;
    if (!note) {
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }

    await supabase
      .from("voice_sessions")
      .update({ note_id: note.id })
      .eq("id", session.id);

    try {
      await supabase
        .from("notes")
        .update({ last_structuring_attempt_at: new Date().toISOString() })
        .eq("id", note.id);

      const raw = await callClaude({
        systemPrompt: SHIFT_NOTE_SYSTEM_PROMPT,
        userPrompt: buildShiftNoteUserPrompt({
          residentFirstName: residentRow.first_name,
          residentLastName: residentRow.last_name,
          careNotesContext: residentRow.care_notes_context,
          conditions: residentRow.conditions,
          timestamp: note.created_at,
          caregiverName: (author as { full_name: string } | null)?.full_name || "Unknown",
          rawInput: transcript,
        }),
      });

      const structured = parseJsonResponse<StructuredNoteOutput>(raw);
      const hasFlags = structured.flags && structured.flags.length > 0;

      // Track AI usage (fire-and-forget)
      incrementUsage(session.organization_id, "ai").catch(() => {});

      await supabase
        .from("notes")
        .update({
          structured_output: JSON.stringify(structured),
          is_structured: true,
          structuring_error: null,
          flagged_as_incident: hasFlags,
          metadata: {
            source: "voice_call",
            voice_session_id: session.id,
            categories: Object.keys(structured.sections || {}),
            flags: structured.flags || [],
            ai_classification: hasFlags ? "possible_incident" : "routine",
            model_used: "claude-sonnet-4-6",
          },
        })
        .eq("id", note.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase
        .from("notes")
        .update({ structuring_error: message, is_structured: false })
        .eq("id", note.id);
    }

    return NextResponse.json({ received: true, noteId: note.id });
  }

  return NextResponse.json({ received: true });
}
