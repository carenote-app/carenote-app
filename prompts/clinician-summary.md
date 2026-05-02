---
id: clinician-summary
version: 2026-05-02-multilingual-v1
prior_version: 2026-04-01-english-v3
status: active
runtime: claude-api
model: claude-sonnet-4-6
languages: [en, zh-TW]
variables:
  - facility_name
  - resident_first_name
  - resident_last_name
  - resident_dob
  - clinician_name
  - clinician_relationship
  - conditions
  - care_notes_context
  - structured_notes
  - source_language
  - clinical_language
  - cultural_register
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Generate the diagnosis-ready clinical summary the surgeon reads on the magic-link portal. Designed for at-scale review across many patients per day. Output is structured, not narrative-only:

1. **at_a_glance** (clinical_language) — trend arrows, red flags, change-since-last-visit. The surgeon reads only this for triage; full narrative is below.
2. **clinical_narrative** (clinical_language) — formal medical-register prose, 150–300 words.
3. **source_excerpts** — caregiver's original-language quotes, each with a clinical-language gloss; surgeon can verify nothing was lost in translation.
4. **confidence_notes** — uncertainty surfaced inline (e.g., "translation of '阿嬤跌一下' uncertain — could mean fall or near-fall"); never hidden behind a tab.

# When to use

Triggered when an admin creates a clinician share link in `src/app/api/share/clinician/route.ts`. The summary is rendered once at share creation and stored as a stable snapshot in `clinician_share_links.rendered_summary`.

# Variables

TODO(workstream-c): full variables table.

# Prompt body

TODO(workstream-c): full body. Current English-only prompt in `src/lib/prompts/clinician-summary.ts`. Multilingual rewrite emits `clinical_language=zh-TW` by default for Taiwan orgs.

# Output schema

```json
{
  "at_a_glance": {
    "headline": "string (clinical_language)",
    "red_flags": ["string"],
    "trends": [
      { "metric": "pain | sleep | appetite | mobility | mood", "direction": "up | down | flat", "since": "string" }
    ],
    "change_since_last_visit": "string"
  },
  "clinical_narrative": "string (clinical_language, 150-300 words, formal medical register)",
  "source_excerpts": [
    { "source_language": "string", "source_quote": "string", "gloss": "string (clinical_language)" }
  ],
  "confidence_notes": [
    { "field": "string", "concern": "string" }
  ]
}
```

# Safety guardrails

- No diagnosis, no recommended treatment.
- If translation confidence is low, surface in `confidence_notes` rather than dropping the observation.
- Sensitive content (substance use, psychotherapy notes) MUST respect the existing `disclosure_class` filtering in `src/app/api/share/clinician/route.ts:215-240` — drop unless `includeSensitive=true`.

# Test cases

TODO(workstream-c): 4 test cases covering Vietnamese caregiver / Taiwanese resident, Indonesian caregiver / Indonesian resident, English caregiver / Taiwanese resident, low-confidence translation case.

# Version history

- **2026-05-02-multilingual-v1**: redesigned around at_a_glance + source_excerpts + confidence_notes; clinical output defaults to zh-TW; preserves caregiver source quotes for surgeon verification.
- **2026-04-01-english-v3**: prior English-only narrative summary in `src/lib/prompts/clinician-summary.ts`.
