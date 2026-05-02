---
id: shift-note-structuring
version: 2026-05-02-multilingual-v1
prior_version: 2026-04-01-english-v3
status: active
runtime: claude-api
model: claude-sonnet-4-6
languages: [en, zh-TW, vi, id]
variables:
  - resident_first_name
  - resident_last_name
  - resident_language
  - source_language
  - output_language
  - cultural_register
  - care_notes_context
  - conditions
  - timestamp
  - caregiver_name
  - raw_input
owner: ai-team
last_reviewed_by: pouya
last_reviewed_at: 2026-05-02
---

# Purpose

Convert a free-form caregiver transcript into a structured JSON shift note with sections (mood, nutrition, medication, mobility, etc.), flags (fall risk, medication refusal, behavior change), and a top-line summary. Source content stays in the caregiver's source language; the summary and an English `clinical_keywords` field are added for downstream retrieval and translation.

# When to use

Triggered by:
- The Vapi end-of-call webhook (`src/app/api/voice/webhook/route.ts`) after a live voice call completes.
- The Whisper push-to-talk path (`src/app/api/transcribe/route.ts` → `/api/claude/structure`) after a recording is transcribed.

# Variables

TODO(workstream-c): full variables table once language parameterization lands.

# Prompt body

TODO(workstream-c): full body. Current English-only prompt lives in `src/lib/prompts/shift-note.ts`. Multilingual rewrite preserves caregiver words verbatim in source language, adds top-level summary in `output_language`, and emits an English `clinical_keywords` array for retrieval.

# Output schema

TODO(workstream-c): document `StructuredNoteOutput` shape with new `summary_language`, `source_language`, and `clinical_keywords` fields.

# Safety guardrails

- Preserve caregiver's exact words in section bodies; never paraphrase clinical observations.
- No diagnosis, no causal speculation.
- Sensitive content (substance use, psychotherapy notes) MUST be flagged for the existing `notes_sensitive_access` gate.

# Test cases

TODO(workstream-c): 5 test cases covering en/zh-TW/vi/id source + at least one code-switching case.

# Version history

- **2026-05-02-multilingual-v1**: language-parameterized; cultural-register block injected; English `clinical_keywords` added.
- **2026-04-01-english-v3**: prior English-only version in `src/lib/prompts/shift-note.ts`.
