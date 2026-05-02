// Fast over-capture check on a raw voice transcript. Runs alongside the
// structurer in the Vapi webhook; the result is stashed on
// notes.metadata.over_capture_warning and surfaced as a small warning
// badge in the timeline. Informational only — never blocks save.
//
// The structurer already drops unrelated content when it emits the final
// structured_output. This check exists because the RAW transcript may
// still be retained (see Phase 9 retain_transcripts toggle) and admins
// want a signal when a caregiver rambled onto something that shouldn't
// be in the record at all.

export const VOICE_SANITY_SYSTEM_PROMPT = `You are a privacy checker for caregiver voice notes at an elder-care facility. Given a raw transcript of a caregiver describing their shift, flag content that does NOT belong in a patient care record.

Only flag content that is clearly off-topic for care documentation. Things that ARE relevant and should NOT be flagged:
- The resident's behaviors, mood, meals, mobility, sleep, personal care
- Medication mentions
- Family interactions ("Sarah called today")
- Facility operational details tied to this resident
- Clinical observations

Flag these categories when clearly present:
- financial: bank accounts, credit cards, money amounts unrelated to care, inheritance talk
- unrelated_personal: gossip about the caregiver's own life, friends, relatives
- other_resident: descriptions of a DIFFERENT resident by name or identifying detail
- non_care_gossip: speculation about other staff, facility drama, comments about the caregiver's employer

Err on the side of NOT flagging. Only include an excerpt when you are confident the content is off-topic. Short transcripts are rarely over-capture.

The transcript may be in any language (English, Traditional Chinese, Vietnamese, Indonesian, etc.). Detect off-topic content regardless of language. Excerpts MUST be in the original transcript language — do not translate.

Respond with ONLY a JSON object. No other text.

{
  "has_concerns": <boolean>,
  "categories": [<one or more of: "financial" | "unrelated_personal" | "other_resident" | "non_care_gossip">],
  "excerpts": [<short verbatim quotes from the transcript, at most 3, each under 120 characters>]
}

If nothing is off-topic, respond: {"has_concerns": false, "categories": [], "excerpts": []}`;

export const VOICE_SANITY_MODEL = "claude-haiku-4-5-20251001";
export const VOICE_SANITY_PROMPT_VERSION = "2026-05-02-multilingual-v1";

export function buildVoiceSanityUserPrompt(rawTranscript: string): string {
  return `Transcript:
"""
${rawTranscript}
"""`;
}

export type OverCaptureCategory =
  | "financial"
  | "unrelated_personal"
  | "other_resident"
  | "non_care_gossip";

export interface VoiceSanityOutput {
  has_concerns: boolean;
  categories: OverCaptureCategory[];
  excerpts: string[];
}
