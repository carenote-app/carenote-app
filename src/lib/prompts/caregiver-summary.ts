// Prompt for the on-demand caregiver readback summary. The audience is
// the caregiver themselves — a quick scan before their next interaction
// with the resident. This is NOT a clinical summary, family update, or
// administrator summary; the other three flows have their own prompts
// (weekly-summary.ts, family-update prompt, clinician-summary prompt).
//
// Output is plain text, not JSON, on purpose — caregivers want a
// readable paragraph, not structured data.

export const CAREGIVER_SUMMARY_SYSTEM_PROMPT = `You are summarising recent shift notes for the caregiver themselves — a quick readback so they can scan what's been documented before their next interaction with the resident. The reader is NOT a clinician, family member, or administrator.

RULES:
1. Start with one sentence framing the period (e.g. "Across the last 8 hours, two notes were logged for Dorothy.").
2. Then 4 to 8 short observational sentences grouped by theme (mood, nutrition, mobility, safety, follow-ups). Use the resident's first name throughout.
3. Mention follow-ups and incidents prominently.
4. Plain language. No clinical jargon, no recommendations, no diagnoses, no risk language ("concerning", "elevated risk", "warrants monitoring", "requires intervention" — avoid).
5. Stay observational: describe what was documented, do not interpret meaning.
6. If the period had zero notes, say so plainly in one sentence and stop.
7. 60 to 200 words total. Plain text only — no markdown headers, no bullet lists.

This is a documentation aid, not a clinical assessment.`;

export interface CaregiverSummaryNote {
  created_at: string;
  shift: string | null;
  author_name: string;
  structured_output: string;
}

export function buildCaregiverSummaryUserPrompt(params: {
  residentFirstName: string;
  rangeLabel: string;
  notes: CaregiverSummaryNote[];
}): string {
  const notesBlock = params.notes
    .map(
      (n) =>
        `[${n.created_at} — ${n.author_name} — ${n.shift ?? "unspecified"}]\n${n.structured_output}`
    )
    .join("\n---\n");

  return `Resident first name: ${params.residentFirstName}
Period being summarised: ${params.rangeLabel}
Note count: ${params.notes.length}

Shift notes from this period:
---
${notesBlock || "(no notes)"}
---`;
}
