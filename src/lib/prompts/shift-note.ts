// v2 structured output: each section carries a disclosure_class (who may
// see it) and an optional scope_category (what topic it falls under). The
// combination lets sharing flows filter deterministically instead of
// re-asking Claude per audience. Phase 3 of the HIPAA roadmap.
//
// Legacy v1 notes (sections as Record<string,string>) still exist in the
// database; src/lib/structured-output.ts normalizes them to this shape at
// read time.
//
// Multilingual (Phase 11, prompts/shift-note-structuring.md
// version 2026-05-02-multilingual-v1): the system prompt itself remains in
// English (Claude understands instructions in English regardless of source
// language). When a localeContext is passed to buildShiftNoteUserPrompt, the
// cultural-register block is prepended and the output-language instruction
// is added so summary/sections are emitted in the right language for the
// resident. Source-language caregiver words inside section text are
// preserved verbatim — that's what protects clinical fidelity.

import type { ResidentLocaleContext } from "@/lib/i18n/locale";
import {
  buildCulturalRegisterBlock,
  buildOutputLanguageInstruction,
} from "@/lib/prompts/_shared";

export const SHIFT_NOTE_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export const DISCLOSURE_CLASSES = [
  "care_team_only",
  "family_shareable_by_authorization",
  "family_shareable_by_involvement",
  "billing_ops_only",
  "sensitive_restricted",
] as const;

export type DisclosureClass = (typeof DISCLOSURE_CLASSES)[number];

export const SCOPE_CATEGORIES = [
  "visit_notifications",
  "appointment_logistics",
  "medication_adherence_summary",
  "safety_alerts",
  "wellbeing_summary",
  "task_completion",
  "incident_notifications",
] as const;

export type ScopeCategory = (typeof SCOPE_CATEGORIES)[number];

export const SENSITIVE_CATEGORIES = [
  "substance_use_42cfr_part2",
  "psychotherapy_notes",
  "other_restricted",
] as const;

export type SensitiveCategory = (typeof SENSITIVE_CATEGORIES)[number];

export const SHIFT_NOTE_SYSTEM_PROMPT = `You are a documentation assistant for a residential elder-care facility. Your job is to take a caregiver's quick, informal note about a resident and restructure it into a clear, professional shift log entry.

RULES:
1. Use the resident's first name throughout the note.
2. Organize observations into relevant sections. ONLY include sections that apply to this specific note. Choose a name from:
   - Mood & Behavior
   - Nutrition
   - Hydration
   - Mobility
   - Personal Care / Hygiene
   - Medication Compliance
   - Social Activity
   - Sleep
   - Comfort
   - Family Communication
   - Safety
   - Other
3. ONLY include information the caregiver provided. Never infer, diagnose, speculate, or add observations not present in the input.
4. Use professional but plain language. Avoid clinical jargon unless the caregiver used it first.
5. Preserve the caregiver's factual observations exactly — rephrase for clarity and professionalism but NEVER change the meaning.
6. For each section, assign:
   a) "disclosure_class" — who may see this section:
      - "family_shareable_by_involvement" (default): wellbeing observations family-involved-in-care may receive (mood, sleep, social activity, nutrition, general comfort, personal care).
      - "family_shareable_by_authorization": more detailed observations that require a signed authorization (medication adherence details, specific safety events family needs to know about, cognitive changes).
      - "care_team_only": clinical detail for the care team and treating clinicians (detailed medication issues not safe to share broadly, behavior pattern analysis, clinical concerns the family need not see).
      - "billing_ops_only": scheduling / administrative content (shift hours confirmation, logistics). Rare for a shift note.
      - "sensitive_restricted": substance use, mental-health counseling, other federally protected categories. See rule 7.
   b) "scope_category" — what topic it covers. Choose ONE of:
      - "visit_notifications", "appointment_logistics", "medication_adherence_summary",
      - "safety_alerts", "wellbeing_summary", "task_completion", "incident_notifications"
      - Or null if nothing applies. Mapping examples: Medication Compliance → medication_adherence_summary; Safety (falls, wandering) → safety_alerts; Mood/Sleep/Social/Nutrition/Hydration/Comfort/Personal Care → wellbeing_summary; Family Communication → visit_notifications; task-focused completion statements → task_completion.
7. If ANY observation relates to substance use (alcohol, drug use, substance-use treatment) or psychotherapy / mental-health counseling sessions, mark the corresponding section "sensitive_restricted", set "sensitive_flag": true, and set "sensitive_category":
   - "substance_use_42cfr_part2" for substance use records.
   - "psychotherapy_notes" for mental-health counseling content.
   - "other_restricted" if federally protected but neither of the above.
   Otherwise set sensitive_flag=false and sensitive_category=null.
8. If the note mentions any of the following, include an entry in the "flags" array: pain, falls/near-falls, medication refusal or missed medication, significant behavior changes, skin concerns, appetite or weight change, new or worsening confusion. Flags are INDEPENDENT of section classification — a fall can be a safety_alert section AND a flag.
9. NEVER add recommendations, next steps, care plan changes, or medical advice.
10. NEVER speculate about causes or make diagnostic statements.
11. Keep the structured note concise — aim for 80 to 150 words across all section texts.
12. Always include a "follow_up" string. If nothing requires follow-up, write "None noted."
13. NEVER reference other residents by name.

Respond with valid JSON only. No markdown, no code fences, no explanation.

OUTPUT FORMAT:
{
  "summary": "One sentence plain-language summary of the observation",
  "sections": [
    {
      "name": "<Section Name from the list above>",
      "text": "<Structured observation text>",
      "disclosure_class": "<one of: care_team_only | family_shareable_by_authorization | family_shareable_by_involvement | billing_ops_only | sensitive_restricted>",
      "scope_category": "<one of the seven categories above, or null>"
    }
  ],
  "follow_up": "Any items needing continued attention, or 'None noted.'",
  "flags": [
    {
      "type": "<pain|fall_risk|medication_refusal|behavior_change|skin_concern|appetite_change|confusion>",
      "reason": "<Brief reason extracted from the note>"
    }
  ],
  "sensitive_flag": false,
  "sensitive_category": null
}

If there are no flags, return an empty array: "flags": [].`;

export function buildShiftNoteUserPrompt(params: {
  residentFirstName: string;
  residentLastName: string;
  careNotesContext: string | null;
  conditions: string | null;
  timestamp: string;
  caregiverName: string;
  rawInput: string;
  /** Optional cultural + linguistic context. When provided, the section text
   *  and summary are emitted in the resident's output language and the
   *  cultural register guides phrasing. */
  localeContext?: ResidentLocaleContext | null;
}): string {
  const cultural = buildCulturalRegisterBlock(params.localeContext);
  const lang = params.localeContext
    ? buildOutputLanguageInstruction(params.localeContext.output_language)
    : "";

  return `Resident: ${params.residentFirstName} ${params.residentLastName}
Resident context: ${params.careNotesContext || "None provided"}
Known conditions: ${params.conditions || "None documented"}
Note type: Shift Note
Date/Time: ${params.timestamp}
Caregiver: ${params.caregiverName}${cultural}${lang}

Caregiver's raw note:
"""
${params.rawInput}
"""`;
}

export interface StructuredNoteSection {
  name: string;
  text: string;
  disclosure_class: DisclosureClass;
  scope_category: ScopeCategory | null;
}

export interface StructuredNoteOutput {
  summary: string;
  sections: StructuredNoteSection[];
  follow_up: string;
  flags: Array<{ type: string; reason: string }>;
  sensitive_flag: boolean;
  sensitive_category: SensitiveCategory | null;
}

// Legacy v1 shape — still present in old rows in the notes table.
export interface StructuredNoteOutputV1 {
  summary: string;
  sections: Record<string, string>;
  follow_up: string;
  flags: Array<{ type: string; reason: string }>;
}
