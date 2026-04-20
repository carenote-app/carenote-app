import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callClaude, parseJsonResponse } from "@/lib/claude";
import {
  WEEKLY_SUMMARY_SYSTEM_PROMPT,
  buildWeeklySummaryUserPrompt,
  type WeeklySummaryOutput,
} from "@/lib/prompts/weekly-summary";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Use service role client for cron (no user session)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date();

  // Fetch all organizations
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, timezone")
    .in("subscription_status", ["trial", "active"]);

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ message: "No active organizations" });
  }

  let generated = 0;

  for (const org of orgs) {
    // Check if it's Sunday 6 PM in the org's timezone
    const zonedNow = toZonedTime(now, org.timezone || "America/Los_Angeles");
    const isSunday = zonedNow.getDay() === 0;
    const hour = zonedNow.getHours();

    // Run between 6 PM and 7 PM Sunday (cron runs hourly)
    if (!isSunday || hour !== 18) continue;

    // Calculate week range (Monday to Sunday)
    const weekEnd = now;
    const weekStart = subDays(startOfWeek(weekEnd, { weekStartsOn: 1 }), 0);
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(endOfWeek(weekEnd, { weekStartsOn: 1 }), "yyyy-MM-dd");

    // Fetch active residents
    const { data: residents } = await supabase
      .from("residents")
      .select("id, first_name, last_name, conditions")
      .eq("organization_id", org.id)
      .eq("status", "active");

    if (!residents) continue;

    for (const resident of residents) {
      // Check if summary already exists for this week
      const { data: existing } = await supabase
        .from("weekly_summaries")
        .select("id")
        .eq("resident_id", resident.id)
        .eq("week_start", weekStartStr)
        .single();

      if (existing) continue;

      // Fetch notes for the week. Exclude sensitive notes — the weekly
      // summary is distributed org-wide and is not an appropriate surface
      // for 42 CFR Part 2 / psychotherapy content. Admins wanting a
      // compliance summary that includes sensitive material should use
      // the clinician share flow with explicit override.
      const { data: notes } = await supabase
        .from("notes")
        .select("id, created_at, structured_output, author_id, shift")
        .eq("resident_id", resident.id)
        .eq("is_structured", true)
        .eq("sensitive_flag", false)
        .gte("created_at", weekStartStr)
        .lte("created_at", weekEndStr + "T23:59:59Z")
        .order("created_at", { ascending: true });

      if (!notes || notes.length === 0) continue;

      // Fetch author names
      const authorIds = [...new Set(notes.map((n) => n.author_id))];
      const { data: authors } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", authorIds);

      const authorMap = new Map(
        (authors ?? []).map((a: { id: string; full_name: string }) => [a.id, a.full_name])
      );

      try {
        const raw = await callClaude({
          systemPrompt: WEEKLY_SUMMARY_SYSTEM_PROMPT,
          userPrompt: buildWeeklySummaryUserPrompt({
            facilityName: org.name,
            residentFirstName: resident.first_name,
            residentLastName: resident.last_name,
            conditions: resident.conditions,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            notes: notes.map((n) => ({
              created_at: n.created_at,
              author_name: authorMap.get(n.author_id) || "Staff",
              shift: n.shift,
              structured_output: n.structured_output,
            })),
          }),
          maxTokens: 1500,
        });

        const summary = parseJsonResponse<WeeklySummaryOutput>(raw);

        await supabase.from("weekly_summaries").insert({
          organization_id: org.id,
          resident_id: resident.id,
          week_start: weekStartStr,
          week_end: weekEndStr,
          summary_text: summary.summary_text,
          key_trends: summary.key_trends,
          concerns: summary.concerns,
          incidents_count: summary.incidents_this_week,
          source_note_ids: notes.map((n) => n.id),
          status: "pending_review",
          metadata: { model_used: "claude-sonnet-4-6" },
        });

        generated++;
      } catch {
        // Log but don't fail the entire cron for one resident
        console.error(
          `Failed to generate summary for resident ${resident.id}`
        );
      }
    }
  }

  return NextResponse.json({
    message: `Generated ${generated} weekly summaries`,
  });
}
