---
id: incident-report
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
  - incident_raw_input
  - source_language
  - output_language
  - regulatory_region
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Generate a regulator-grade incident report from a flagged note. Output language follows the org's `regulatory_region`: California RCFE → English; Taiwan 長照 facility → zh-TW. Tone is neutral, factual, no risk-amplifying language.

# When to use

Triggered when the incident-classify pipeline returns DEFINITE_INCIDENT, or when an admin manually flags a note as an incident.

# Variables

TODO(workstream-c).

# Prompt body

TODO(workstream-c): full body. Current English-only prompt in `src/lib/prompts/incident-report.ts`. Multilingual rewrite adds `regulatory_region` awareness so 長照法 fields surface for Taiwan orgs.

# Output schema

TODO(workstream-c).

# Safety guardrails

- Factual only. No causation language ("appears to have been caused by…") unless the source explicitly states cause.
- Preserve dates, times, exact observations.
- Taiwan orgs: include 長照法 required fields (TODO with workstream-d for full field list).

# Test cases

TODO(workstream-c).

# Version history

- **2026-05-02-multilingual-v1**: language and regulatory-region parameterized.
- **2026-04-01-english-v3**: English-only US-RCFE-shaped report in `src/lib/prompts/incident-report.ts`.
