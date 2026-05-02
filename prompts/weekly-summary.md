---
id: weekly-summary
version: 2026-05-02-multilingual-v1
prior_version: 2026-04-01-english-v3
status: active
runtime: claude-api
model: claude-sonnet-4-6
languages: [en, zh-TW]
variables:
  - facility_name
  - resident_first_name
  - conditions
  - care_notes_context
  - week_range
  - shift_notes
  - output_language
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Admin-facing weekly synthesis of all shift notes for one resident: status, nutrition, mood, mobility, sleep, incidents. Quantifies patterns ("ate full meal 6/7 days") and flags week-over-week deltas. Output language defaults to the org's `default_output_language`.

# When to use

Inngest weekly-summary cron (`packages/jobs/src/weekly-summaries.ts` if monorepo, else equivalent) runs every Monday at 06:00 in the org's timezone.

# Variables

TODO(workstream-c).

# Prompt body

TODO(workstream-c): full body. Current English-only prompt in `src/lib/prompts/weekly-summary.ts`.

# Output schema

TODO(workstream-c).

# Safety guardrails

- Factual language; avoid risk-amplifying phrasing without evidence.
- No incident speculation. If notes flagged an incident, reference it; do not characterize cause.

# Test cases

TODO(workstream-c).

# Version history

- **2026-05-02-multilingual-v1**: language-parameterized via `output_language`.
- **2026-04-01-english-v3**: prior English-only version in `src/lib/prompts/weekly-summary.ts`.
