---
id: incident-classify
version: 2026-05-02-multilingual-v1
prior_version: 2026-04-01-english-v3
status: active
runtime: claude-api
model: claude-haiku-4-5
languages: [en, zh-TW, vi, id]
variables:
  - raw_input
  - source_language
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Cheap classifier that bins a raw caregiver note into `ROUTINE | POSSIBLE_INCIDENT | DEFINITE_INCIDENT` with a 5–10 word explanation. Output is language-agnostic (the labels are fixed strings); the explanation is in the source language.

# When to use

Called from the structuring pipeline alongside `shift-note` to decide whether the note triggers the incident-report flow.

# Variables

TODO(workstream-c).

# Prompt body

TODO(workstream-c): full body. Current English-only prompt in `src/lib/prompts/incident-classify.ts`.

# Output schema

```json
{
  "classification": "ROUTINE | POSSIBLE_INCIDENT | DEFINITE_INCIDENT",
  "explanation": "string (5-10 words, source_language)"
}
```

# Safety guardrails

- Default to higher classification when uncertain (POSSIBLE_INCIDENT > ROUTINE).
- Falls, injuries, medication errors, aggression, missing meds, medical emergencies → DEFINITE_INCIDENT.

# Test cases

TODO(workstream-c).

# Version history

- **2026-05-02-multilingual-v1**: input/output language-aware (labels remain English).
- **2026-04-01-english-v3**: English-only classifier.
