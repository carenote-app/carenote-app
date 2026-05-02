# Prompts

Canonical specs for every LLM prompt used by Kinroster — Vapi assistants, Claude API calls, Whisper hints. The `.md` file is the **source of truth** for the prompt body. Runtime files in `src/lib/prompts/*.ts` reference these specs.

## Why a separate `prompts/` directory

Some prompts (the Vapi intake assistant) live in a vendor dashboard, not in code. Without a versioned spec in the repo, prompt drift between dashboard and intent goes invisible. The markdown files give every prompt a single owner, a version, a changelog, and a place to record the test cases that justify behavior changes.

## Per-prompt file structure

Every spec MUST start with YAML frontmatter and contain the eight body sections below.

### Frontmatter

```yaml
---
id: <kebab-case-id>            # stable identifier across versions
version: <yyyy-mm-dd-name>     # current version
prior_version: <yyyy-mm-dd-name|null>  # previous version, for traceability
status: active                 # active | deprecated | draft
runtime: vapi-dashboard        # vapi-dashboard | claude-api | whisper-api
model: gpt-4o-mini             # actual model the runtime uses
languages: [en, zh-TW, vi, id] # BCP-47 locales the prompt supports
variables:                     # template variables the runtime injects
  - caregiver_name
  - caregiver_language
owner: ai-team
last_reviewed_by: <name>
last_reviewed_at: <yyyy-mm-dd>
---
```

### Body sections (all required)

1. **Purpose** — one paragraph: audience, desired output, cost/quality target.
2. **When to use** — what triggers this prompt at runtime.
3. **Variables** — table of variable name, type, source, example value.
4. **Prompt body** — the actual prompt in a fenced code block. Source of truth for the runtime.
5. **Output schema** — JSON Schema or shape of expected output. For conversational assistants, write `N/A — conversational` and explain.
6. **Safety guardrails** — what the prompt MUST avoid (e.g., diagnosis, medication advice, off-topic capture). Each guardrail should map to a test case.
7. **Test cases** — list of `input → expected behavior` pairs. Minimum 3 cases. For multilingual prompts, include at least one case per supported language.
8. **Version history** — bullet list `version: yyyy-mm-dd-name — what changed and why`. Append-only; do not rewrite history.

## How to ship a prompt change

1. Edit the `.md` spec. Bump `version` (date-prefixed). Move the previous version into the **Version history** section.
2. If the runtime is `claude-api`, update the corresponding `.ts` file in `src/lib/prompts/` to match. The `.ts` file MUST export a `PROMPT_VERSION` constant matching the spec's version.
3. If the runtime is `vapi-dashboard`, paste the **Prompt body** into the Vapi assistant's system prompt field. Until the `pnpm prompts:sync-vapi` script lands (future TODO), this is a manual step — record the date you pasted it in the Version history line.
4. Add an entry to `CHANGELOG.md` summarizing the cross-prompt release.

## Prompts in this directory

| Spec | Runtime | Model |
|---|---|---|
| `vapi-intake-assistant.md` | vapi-dashboard | gpt-4o-mini |
| `shift-note-structuring.md` | claude-api | claude-sonnet-4-6 |
| `clinician-summary.md` | claude-api | claude-sonnet-4-6 |
| `family-update.md` | claude-api | claude-sonnet-4-6 |
| `weekly-summary.md` | claude-api | claude-sonnet-4-6 |
| `voice-sanity.md` | claude-api | claude-haiku-4-5 |
| `incident-classify.md` | claude-api | claude-haiku-4-5 |
| `incident-report.md` | claude-api | claude-sonnet-4-6 |
