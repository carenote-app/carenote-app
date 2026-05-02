# Prompts changelog

Cross-prompt release log. Per-prompt history lives in each spec file's **Version history** section.

## 2026-05-02 — multilingual-v1

First multilingual release. Adds support for caregivers in Taiwan working with Vietnamese / Indonesian / Mandarin source languages and elderly Taiwanese / Vietnamese / Indonesian residents. Surgeon-facing clinical output defaults to Traditional Chinese (zh-TW). All prompts now language-parameterized via `{{caregiver_language}}` / `{{output_language}}` variables and inject a cultural-register block (honorific preference, religion-specific phrasing rules, family-vs-clinical register).

- `vapi-intake-assistant`: `2026-04-01-english-v3` → `2026-05-02-multilingual-v1`. Replaces hardcoded English greetings/wrap-ups with language-parameterized phrasing. Adds grounding variables `recent_notes_summary` and `recent_incidents` to anchor follow-up questions and reduce hallucinated baselines.
- `shift-note-structuring`: source-language preserved verbatim; English `clinical_keywords` field added for downstream retrieval. Cultural-register block injected.
- `clinician-summary`: redesigned. Output now leads with `at_a_glance` (zh-TW, trend arrows + red flags + change-since-last-visit), then `clinical_narrative` (zh-TW formal medical register), then `source_excerpts` (caregiver's original-language quotes with zh-TW gloss), then `confidence_notes` (uncertainty surfaced inline).
- `family-update`: fans out one update per family contact in their `preferred_communication_language`. Cultural register adapts (indirect for Taiwanese/Vietnamese/Indonesian; direct for Western).
- `weekly-summary`, `voice-sanity`, `incident-classify`, `incident-report`: language-parameterized; output language defaults to org's `default_output_language`.
