export const FAMILY_UPDATE_SYSTEM_PROMPT = `You are writing a brief email update to the family of an elderly resident in a care home. The family member is not a medical professional. They want to know their loved one is safe, cared for, and how they have been doing.

You will be given a set of shift notes from the past several days. Synthesize them into a single, warm, personal update.

RULES:
1. Write in a warm, conversational tone — like a kind, professional caregiver speaking to a concerned family member.
2. Use the resident's first name naturally throughout.
3. NEVER use clinical language, medical abbreviations, or charting terminology.
4. Lead with positive observations and daily-life details. Mention activities, social moments, meals enjoyed, and things the resident said or did that show personality.
5. If there were concerns (appetite changes, mood issues, minor incidents), mention them honestly but calmly. Do NOT minimize real concerns, but do NOT use alarming language.
6. If there was a fall or significant incident, state it factually and describe what was done. Do NOT downplay it.
7. Keep the update to 3 to 5 short paragraphs, approximately 150 to 250 words total.
8. End with a warm closing that invites the family to call or visit with any questions.
9. Sign off with the facility name provided.
10. NEVER include medical opinions, diagnoses, medication names, or treatment details.
11. NEVER invent details not present in the shift notes. If a day has no notes, skip it — do not fabricate activities.
12. NEVER reference other residents by name.

Respond with valid JSON only.

OUTPUT FORMAT:
{
  "subject": "Update on [Resident First Name] — [Facility Name]",
  "body": "<The full email text, with paragraph breaks as \\n\\n>"
}`;

import type { ResidentLocaleContext } from "@/lib/i18n/locale";
import {
  buildCulturalRegisterBlock,
  buildOutputLanguageInstruction,
} from "@/lib/prompts/_shared";

export const FAMILY_UPDATE_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildFamilyUpdateUserPrompt(params: {
  facilityName: string;
  residentFirstName: string;
  residentLastName: string;
  familyContactName: string;
  relationship: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  notes: Array<{
    created_at: string;
    author_name: string;
    structured_output: string;
  }>;
  /** Cultural + linguistic context for the resident. */
  localeContext?: ResidentLocaleContext | null;
  /** Override for the family contact's preferred communication language.
   *  Each family contact gets their own update in their own language —
   *  callers should invoke this builder once per contact. */
  familyLanguage?: string;
}): string {
  const notesText = params.notes
    .map(
      (n) => `[${n.created_at} — ${n.author_name}]\n${n.structured_output}`
    )
    .join("\n---\n");

  const cultural = buildCulturalRegisterBlock(params.localeContext);
  const outputLang =
    params.familyLanguage ||
    (params.localeContext ? params.localeContext.output_language : "");
  const lang = outputLang ? buildOutputLanguageInstruction(outputLang) : "";

  return `Facility: ${params.facilityName}
Resident: ${params.residentFirstName} ${params.residentLastName}
Family member: ${params.familyContactName} (${params.relationship})
Date range: ${params.dateRangeStart} to ${params.dateRangeEnd}${cultural}${lang}

Shift notes from this period:
---
${notesText}
---`;
}

export interface FamilyUpdateOutput {
  subject: string;
  body: string;
}
