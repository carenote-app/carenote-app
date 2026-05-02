---
id: voice-sanity
version: 2026-05-02-multilingual-v1
prior_version: 2026-04-01-english-v3
status: active
runtime: claude-api
model: claude-haiku-4-5
languages: [en, zh-TW, vi, id]
variables:
  - transcript
  - source_language
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Cheap safety pass that scans the raw caregiver transcript for off-topic content the caregiver shouldn't have said into a voice note (other residents named, personal/family content, complaints about staff, anything that wasn't about the named resident). Returns `has_concerns`, `categories[]`, and `excerpts[]`. The structuring pipeline runs this in parallel with shift-note structuring; sanity result is informational and never blocks save.

# When to use

`runVoiceSanity` in `src/app/api/voice/webhook/route.ts:59` and the equivalent push-to-talk path. Runs on every voice transcript over a minimum length threshold.

# Variables

TODO(workstream-c).

# Prompt body

TODO(workstream-c): full body. Current English-only prompt in `src/lib/prompts/voice-sanity.ts`. Multilingual rewrite detects off-topic content in the source language regardless of language.

# Output schema

```json
{
  "has_concerns": "boolean",
  "categories": ["other_resident_named", "off_topic_personal", "complaint_about_staff", "suspected_phi_overcapture"],
  "excerpts": ["string (max 160 chars each, max 3)"]
}
```

# Safety guardrails

- Never quote more than 160 chars per excerpt — privacy-by-design.
- On parse error, return null; caller treats null as "no known concerns" (not "clean").

# Test cases

TODO(workstream-c).

# Version history

- **2026-05-02-multilingual-v1**: detects off-topic content in en/zh-TW/vi/id source languages.
- **2026-04-01-english-v3**: English-only detector in `src/lib/prompts/voice-sanity.ts`.
