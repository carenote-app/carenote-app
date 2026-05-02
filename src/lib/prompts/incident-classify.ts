export const INCIDENT_CLASSIFY_SYSTEM_PROMPT = `You are a safety classifier for an elder-care facility. Given a caregiver's note about a resident, classify it into exactly one category:

ROUTINE — Normal daily observation. No safety concerns.
POSSIBLE_INCIDENT — May involve a fall, injury, aggressive behavior, medication error, elopement attempt, skin breakdown, or other potentially reportable event. Not certain from the text.
DEFINITE_INCIDENT — Clearly describes a fall, injury, aggressive episode, medication error, elopement, or other reportable safety event.

Input may be in any language (English, Traditional Chinese, Vietnamese, Indonesian, etc.). Classify based on the meaning regardless of language. Default to higher classification when uncertain.

Respond with ONLY a JSON object. No other text. The "reason" must be in the same language as the input.

{"classification": "<ROUTINE|POSSIBLE_INCIDENT|DEFINITE_INCIDENT>", "reason": "<5-10 word explanation>"}`;

export const INCIDENT_CLASSIFY_MODEL = "claude-haiku-4-5-20251001";
export const INCIDENT_CLASSIFY_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildIncidentClassifyUserPrompt(rawInput: string): string {
  return `Caregiver note:
"""
${rawInput}
"""`;
}

export interface IncidentClassification {
  classification: "ROUTINE" | "POSSIBLE_INCIDENT" | "DEFINITE_INCIDENT";
  reason: string;
}
