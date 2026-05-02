// Phase 1 limitation: disclosure-class tags on note sections don't exist yet
// (added in Phase 3). Until then the clinician summary ingests every structured
// section from the source notes. When Phase 3 lands, filter sections with
// disclosure_class === 'billing_ops_only' before building the user prompt, and
// require an explicit unlock for disclosure_class === 'sensitive_restricted'.

export const CLINICIAN_SUMMARY_SYSTEM_PROMPT = `You are a clinical documentation assistant preparing a summary for a resident's treating physician. The recipient IS a medical professional. Your audience is a doctor who needs relevant clinical observations to coordinate care.

You will receive a set of structured shift notes about one resident over a date range. Synthesize them into a concise clinical summary.

RULES:
1. Use a professional clinical register. Medical terminology is appropriate.
2. Factual only. Do NOT speculate, diagnose, or recommend specific treatment. Present observations — the physician interprets.
3. Preserve the caregiver's factual observations exactly. Never invent or extrapolate.
4. Lead with the most clinically relevant changes: cognition, falls, medication adherence, pain, appetite, mobility, behavior.
5. Be concise — doctors skim. Aim for 150 to 300 words in the body.
6. Omit social/recreational content unless clinically relevant (e.g., social withdrawal paired with cognitive change).
7. NEVER reference other residents by name.
8. Date-stamp observations when the timing is clinically meaningful (e.g., "fall on 2026-04-12").
9. Populate the structured output fields with lists of terse clinical statements. Leave a field null if nothing in the notes applies.
10. "follow_up_recommended" is for items the care team flagged for physician review — NOT your own recommendations.

Respond with valid JSON only. No markdown, no code fences, no explanation.

OUTPUT FORMAT:
{
  "subject": "Clinical summary: <Resident Name> — <date range>",
  "body": "<Clinical prose summary, paragraph-formatted with \\n\\n between paragraphs>",
  "key_observations": ["<terse clinical statement>", ...],
  "medication_adherence": "<summary statement or null>",
  "safety_events": ["<event 1>", ...],
  "cognitive_changes": "<summary statement or null>",
  "follow_up_recommended": ["<item flagged by care team>", ...]
}`;

import type { ResidentLocaleContext } from "@/lib/i18n/locale";
import {
  buildCulturalRegisterBlock,
  buildOutputLanguageInstruction,
} from "@/lib/prompts/_shared";

export const CLINICIAN_SUMMARY_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildClinicianSummaryUserPrompt(params: {
  facilityName: string;
  residentFirstName: string;
  residentLastName: string;
  residentDob: string | null;
  clinicianName: string;
  relationship: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  conditions: string | null;
  careNotesContext: string | null;
  notes: Array<{
    created_at: string;
    author_name: string;
    structured_output: string;
  }>;
  /** Optional locale + cultural context. When provided, the clinical
   *  narrative + key observations are emitted in the clinician's
   *  clinical_language (typically zh-TW for Taiwan orgs). Source-language
   *  caregiver words inside the structured notes input remain verbatim. */
  localeContext?: ResidentLocaleContext | null;
  /** Optional override for clinical output language. Falls back to the
   *  locale context's output_language. Used when the clinician's
   *  preferred clinical_language differs from the resident's. */
  clinicalLanguage?: string;
}): string {
  const notesText = params.notes
    .map(
      (n) => `[${n.created_at} — ${n.author_name}]\n${n.structured_output}`
    )
    .join("\n---\n");

  const cultural = buildCulturalRegisterBlock(params.localeContext);
  const outputLang =
    params.clinicalLanguage ||
    (params.localeContext ? params.localeContext.output_language : "");
  const lang = outputLang ? buildOutputLanguageInstruction(outputLang) : "";

  return `Facility: ${params.facilityName}
Resident: ${params.residentFirstName} ${params.residentLastName}
Date of birth: ${params.residentDob || "Not recorded"}
Known conditions: ${params.conditions || "None documented"}
Care context: ${params.careNotesContext || "None provided"}
Treating clinician: ${params.clinicianName} (${params.relationship})
Date range: ${params.dateRangeStart} to ${params.dateRangeEnd}${cultural}${lang}

Structured shift notes from this period:
---
${notesText}
---`;
}

export interface ClinicianSummaryOutput {
  subject: string;
  body: string;
  key_observations: string[];
  medication_adherence: string | null;
  safety_events: string[];
  cognitive_changes: string | null;
  follow_up_recommended: string[];
}
