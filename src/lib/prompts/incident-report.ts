export const INCIDENT_REPORT_SYSTEM_PROMPT = `You are generating a structured incident report for an elder-care facility. This report may be reviewed by facility management, families, regulatory surveyors, or legal counsel. Accuracy and objectivity are critical.

RULES:
1. Be factual, specific, and chronological. Report only what the caregiver described.
2. Use objective language. Say "resident was found on the floor" not "resident fell" unless the fall was directly witnessed and described.
3. Do NOT speculate about causes, contributing factors, or liability.
4. Do NOT assign blame to any person.
5. Do NOT make medical diagnoses or clinical assessments.
6. If specific details are missing from the caregiver's note (exact time, witnesses, vitals), mark them as "Not documented" rather than guessing.
7. Clearly separate: what happened, what was done immediately, the resident's current status, and recommended follow-up.
8. Use professional, formal language appropriate for a regulatory document.

Respond with valid JSON only. No markdown, no code fences, no explanation.

OUTPUT FORMAT:
{
  "incident_type": "<fall|near_fall|medication_error|behavioral|injury|elopement|skin_concern|other>",
  "date_and_time": "<Date and time if stated, otherwise 'Time of report: [timestamp]'>",
  "location": "<Location if stated, otherwise 'Not documented'>",
  "description": "<Factual, chronological narrative of the incident>",
  "immediate_actions": ["<Action 1>", "<Action 2>"],
  "injuries_observed": "<Specific injuries described, or 'No visible injuries observed'>",
  "current_resident_status": "<Resident's condition as described in the note>",
  "corrective_actions": ["<Any environmental or procedural changes made>"],
  "follow_up_recommended": ["<Monitoring or actions recommended>"],
  "witnesses": ["<Names if mentioned, otherwise 'Not documented'>"],
  "notifications_needed": {
    "family": true,
    "physician": "<true if injury or health concern, false otherwise>",
    "licensing_agency": "<true if serious injury, elopement, or death, false otherwise>"
  }
}`;

import type { ResidentLocaleContext } from "@/lib/i18n/locale";
import {
  buildCulturalRegisterBlock,
  buildOutputLanguageInstruction,
} from "@/lib/prompts/_shared";

export const INCIDENT_REPORT_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildIncidentReportUserPrompt(params: {
  residentFirstName: string;
  residentLastName: string;
  conditions: string | null;
  timestamp: string;
  caregiverName: string;
  rawInput: string;
  localeContext?: ResidentLocaleContext | null;
  /** For Taiwan orgs (`pdpa_tw`) the report should be emitted in zh-TW so it
   *  can be filed directly under 長照法. Defaults via locale context. */
  outputLanguage?: string;
  /** TODO(workstream-d): when regulatory_region='pdpa_tw', surface 長照法
   *  required fields (currently the same as US RCFE; legal review pending). */
  regulatoryRegion?: string;
}): string {
  const cultural = buildCulturalRegisterBlock(params.localeContext);
  const outputLang =
    params.outputLanguage ||
    (params.localeContext ? params.localeContext.output_language : "");
  const lang = outputLang ? buildOutputLanguageInstruction(outputLang) : "";

  return `Resident: ${params.residentFirstName} ${params.residentLastName}
Known conditions: ${params.conditions || "None documented"}
Date/Time of report: ${params.timestamp}
Reporting caregiver: ${params.caregiverName}${cultural}${lang}

Caregiver's description of the incident:
"""
${params.rawInput}
"""`;
}

export interface IncidentReportOutput {
  incident_type: string;
  date_and_time: string;
  location: string;
  description: string;
  immediate_actions: string[];
  injuries_observed: string;
  current_resident_status: string;
  corrective_actions: string[];
  follow_up_recommended: string[];
  witnesses: string[];
  notifications_needed: {
    family: boolean;
    physician: boolean | string;
    licensing_agency: boolean | string;
  };
}
