import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/claude";
import {
  CAREGIVER_SUMMARY_SYSTEM_PROMPT,
  buildCaregiverSummaryUserPrompt,
} from "@/lib/prompts/caregiver-summary";
import {
  presetToRange,
  SUMMARY_PRESETS,
  type SummaryPreset,
} from "@/lib/summary/preset-range";

// On-demand "summarise the last 8 hours / today / this week" for the
// caregiver themselves. NOT a disclosure surface: the data is
// already-readable-via-RLS notes for residents in the caller's org, and
// the summary is rendered back to the same caller in-app. Therefore we
// do NOT write disclosure_events or audit_events rows. The PHI sent to
// Claude is processed under the existing Anthropic BAA, mirroring how
// weekly-summaries / clinician-share / family-update already operate.
//
// Requires Node runtime — uses the Anthropic SDK.
export const runtime = "nodejs";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SUMMARY_MAX_TOKENS = 700;

interface PostBody {
  preset?: unknown;
  dateRangeStart?: unknown;
  dateRangeEnd?: unknown;
}

function isPreset(v: unknown): v is SummaryPreset {
  return typeof v === "string" && (SUMMARY_PRESETS as string[]).includes(v);
}

interface ParsedRequest {
  preset?: SummaryPreset;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
}

function parseBody(raw: PostBody): ParsedRequest | { error: string } {
  if (raw.preset !== undefined) {
    if (!isPreset(raw.preset)) {
      return {
        error: `preset must be one of ${SUMMARY_PRESETS.join(", ")}`,
      };
    }
    return { preset: raw.preset };
  }

  if (
    typeof raw.dateRangeStart !== "string" ||
    typeof raw.dateRangeEnd !== "string"
  ) {
    return {
      error: "Either `preset` or both `dateRangeStart` and `dateRangeEnd` are required",
    };
  }
  const start = new Date(raw.dateRangeStart);
  const end = new Date(raw.dateRangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid date range" };
  }
  if (start.getTime() > end.getTime()) {
    return { error: "dateRangeStart must be on or before dateRangeEnd" };
  }
  return { dateRangeStart: start, dateRangeEnd: end };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Resident — RLS gates org membership. Pull org timezone alongside so
  // we can resolve the "today" preset in the facility's local time.
  const { data: residentRow } = await supabase
    .from("residents")
    .select(
      "id, organization_id, first_name, last_name, organizations(timezone)"
    )
    .eq("id", id)
    .single();

  const resident = residentRow as
    | {
        id: string;
        organization_id: string;
        first_name: string;
        last_name: string;
        organizations: { timezone: string } | null;
      }
    | null;
  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const timezone = resident.organizations?.timezone ?? "America/Los_Angeles";

  // Resolve the date range
  let start: Date;
  let end: Date;
  let rangeLabel: string;
  if (parsed.preset) {
    const range = presetToRange(parsed.preset, new Date(), timezone);
    start = range.start;
    end = range.end;
    rangeLabel = range.rangeLabel;
  } else {
    start = parsed.dateRangeStart!;
    end = parsed.dateRangeEnd!;
    rangeLabel = `${start.toISOString().slice(0, 10)} – ${end.toISOString().slice(0, 10)}`;
  }

  // Pull notes in range, excluding sensitive-flagged content. Defence-
  // in-depth: SQL filter here + helper-level filter would happen if we
  // ever post-process, mirroring the PDF export's pattern.
  const { data: rawNotes } = await supabase
    .from("notes")
    .select(
      "id, created_at, shift, structured_output, edited_output, sensitive_flag, users:author_id(full_name)"
    )
    .eq("resident_id", id)
    .eq("sensitive_flag", false)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  const notes = (rawNotes ?? []) as Array<{
    id: string;
    created_at: string;
    shift: string | null;
    structured_output: string | null;
    edited_output: string | null;
    sensitive_flag: boolean;
    users: { full_name: string } | null;
  }>;

  // Count sensitive notes excluded so the dialog can surface them
  // subtly. This is a separate cheap query so we don't have to fetch
  // sensitive note bodies.
  const { count: excludedSensitiveCountRaw } = await supabase
    .from("notes")
    .select("id", { count: "exact", head: true })
    .eq("resident_id", id)
    .eq("sensitive_flag", true)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const excludedSensitiveCount = excludedSensitiveCountRaw ?? 0;

  // Empty short-circuit — don't burn a Claude call on a quiet shift.
  if (notes.length === 0) {
    return NextResponse.json({
      summary: `No notes were logged for ${resident.first_name} in ${rangeLabel}.`,
      noteCount: 0,
      excludedSensitiveCount,
      rangeLabel,
    });
  }

  const userPrompt = buildCaregiverSummaryUserPrompt({
    residentFirstName: resident.first_name,
    rangeLabel,
    notes: notes
      .filter((n) => n.structured_output || n.edited_output)
      .map((n) => ({
        created_at: n.created_at,
        shift: n.shift,
        author_name: n.users?.full_name ?? "Unknown",
        structured_output: n.edited_output || n.structured_output || "",
      })),
  });

  let summary: string;
  try {
    summary = await callClaude({
      model: HAIKU_MODEL,
      systemPrompt: CAREGIVER_SUMMARY_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: SUMMARY_MAX_TOKENS,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Summary generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    summary: summary.trim(),
    noteCount: notes.length,
    excludedSensitiveCount,
    rangeLabel,
  });
}
