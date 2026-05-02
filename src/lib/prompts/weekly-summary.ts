export const WEEKLY_SUMMARY_SYSTEM_PROMPT = `You are generating a weekly care summary for a resident of an elder-care facility. This summary is for the facility manager and may also be shared with family or filed for regulatory compliance.

You will be given all shift notes from the past 7 days. Synthesize them into a structured weekly overview.

RULES:
1. Organize the summary into these sections (skip any section with no relevant data):
   - Overall Status (2-3 sentence summary of the week)
   - Nutrition & Appetite
   - Mood & Behavior Trends
   - Activities & Social Engagement
   - Mobility & Physical Function
   - Sleep Patterns
   - Incidents (if any occurred)
   - Follow-up Items
2. Identify trends and patterns across the week, not just individual events.
3. Use professional language appropriate for a care record.
4. ONLY include information present in the shift notes. Do not fabricate or infer.
5. Note any concerning patterns that warrant continued monitoring.
6. Keep the total summary to 200 to 400 words.
7. Do NOT make medical diagnoses or treatment recommendations.

Respond with valid JSON only.

OUTPUT FORMAT:
{
  "summary_text": "<Full formatted summary with section headers>",
  "key_trends": ["<Trend 1>", "<Trend 2>"],
  "concerns": ["<Concern requiring follow-up, if any>"],
  "incidents_this_week": <number>
}`;

import type { ResidentLocaleContext } from "@/lib/i18n/locale";
import {
  buildCulturalRegisterBlock,
  buildOutputLanguageInstruction,
} from "@/lib/prompts/_shared";

export const WEEKLY_SUMMARY_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildWeeklySummaryUserPrompt(params: {
  facilityName: string;
  residentFirstName: string;
  residentLastName: string;
  conditions: string | null;
  weekStart: string;
  weekEnd: string;
  notes: Array<{
    created_at: string;
    author_name: string;
    shift: string | null;
    structured_output: string;
  }>;
  localeContext?: ResidentLocaleContext | null;
  outputLanguage?: string;
}): string {
  const notesText = params.notes
    .map(
      (n) =>
        `[${n.created_at} — ${n.author_name} — ${n.shift || "unspecified"}]\n${n.structured_output}`
    )
    .join("\n---\n");

  const cultural = buildCulturalRegisterBlock(params.localeContext);
  const outputLang =
    params.outputLanguage ||
    (params.localeContext ? params.localeContext.output_language : "");
  const lang = outputLang ? buildOutputLanguageInstruction(outputLang) : "";

  return `Facility: ${params.facilityName}
Resident: ${params.residentFirstName} ${params.residentLastName}
Known conditions: ${params.conditions || "None documented"}
Week: ${params.weekStart} to ${params.weekEnd}${cultural}${lang}

Shift notes from this week:
---
${notesText}
---`;
}

export interface WeeklySummaryOutput {
  summary_text: string;
  key_trends: string[];
  concerns: string[];
  incidents_this_week: number;
}
