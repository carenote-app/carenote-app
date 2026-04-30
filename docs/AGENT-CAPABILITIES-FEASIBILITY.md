# Agent capabilities — feasibility & sequencing

A first-pass assessment of seven proposed agent behaviours. Each is rated on how much of it the codebase already does, what's new, rough effort, and the main risks. Recommendation at the bottom groups them into phases.

The aim of this doc is to give the team a shared picture of effort/risk so we can argue about *order*, not whether each item is technically possible — they all are.

> **How to keep this current**: when an item changes status, update its `Status` cell below and refresh the "Last updated" line. Statuses: 🟢 Done, 🟡 In progress, 🔵 Up next, ⚪ Not started.

| # | Capability | Status | Already in codebase? | New work | Effort (eng-weeks) | Tier |
|---|---|---|---|---|---|---|
| 1 | Tag new notes with timestamp + category | ⚪ Not started | **~80%** | Surface existing data | <0.5 | Quick win |
| 5 | Void / delete an entry | ⚪ Not started | **~30%** | Add `voided_*` columns, UI, render rules | 0.5–1 | Quick win |
| 6 | Confirm before any write/update/delete | ⚪ Not started | **UX pattern** | Integrate into 3/4/5 | (folded in) | Quick win |
| 7 | Summarise a time window on demand | 🟡 In progress | **~70%** | New `/today summary` UI + reuse existing summariser | 0.5 | Quick win |
| 2 | Semantic search over notes | ⚪ Not started | **0%** | New: embeddings pipeline + pgvector + retrieval API | 1.5–2 | Foundation |
| 4 | Detect contradictions on ingest | ⚪ Not started | **0%** (helpers exist) | Claude classifier on top of #2 | 0.5–1 | Phase 2 |
| 3 | Update vague entries (agentic edit) | ⚪ Not started | **persistence yes; reasoning no** | Retrieval + Claude proposal + diff UI | 1–1.5 | Phase 3 |

_Last updated: 2026-04-30 — Item 7 marked in progress (PR for caregiver on-demand summary in flight)._

Total if we ship all seven: **~5–7 engineer-weeks**. The critical path is item 2 — the search foundation — because items 3 and 4 are weak without it.

---

## 1. Auto-tag with timestamp + category

**Already done**: every note has `created_at TIMESTAMPTZ` and a `metadata` JSONB plus a `structured_output` JSON. The Claude shift-note prompt (`src/lib/prompts/shift-note.ts`) already extracts:
- Section names from a fixed list (Mood & Behavior, Nutrition, Hydration, Mobility, Personal Care / Hygiene, Medication Compliance, Social Activity, Sleep, Comfort, Family Communication, Safety, Other)
- A `scope_category` per section (`wellbeing_summary`, `medication_adherence_summary`, `safety_alerts`, …)
- A `flags` array (pain, falls/near-falls, missed meds, behaviour change, skin, appetite, confusion)

**What's actually new**: not much. We can either (a) leave categories in the JSON and add a couple of indexes / view helpers for filtering, or (b) denormalise the top categories onto a new `notes.categories TEXT[]` column for fast filter queries. Both are small.

**Risks / unknowns**: low. The category taxonomy is already settled via the prompt; we just need to expose it.

**Recommendation**: ship as a small enhancement alongside the next note-related PR. Not worth a dedicated week.

---

## 2. Semantic search retrieval

**Already done**: nothing. The codebase has no embeddings, no vector store, no retrieval system. Searches today are SQL `eq` / `ilike` / date-range filters.

**What's actually new** (this is the big one):
- Embeddings provider — Voyage, OpenAI, or Anthropic. Provider choice matters for HIPAA — a BAA is required to send PHI to any embeddings API. Voyage and OpenAI both offer BAAs; we already have OpenAI for Whisper, so reusing it is fastest path.
- A `note_embeddings` table with `pgvector` extension (`vector(1536)` for OpenAI ada-002 or `vector(1024)` for Voyage). Postgres on Supabase supports pgvector natively.
- An embedding job: when a note is structured, compute and store its embedding. Backfill job for existing notes.
- A retrieval API: takes a free-text query, embeds it, runs cosine-similarity search scoped by `organization_id` and `resident_id`, returns top-K notes.
- A retrieval UI affordance: probably a search bar on the resident detail page.

**Risks / unknowns**:
- **PHI in embeddings**. Embeddings can sometimes leak training data — but more importantly, the act of sending a chunk of PHI to an embeddings API is a disclosure that needs a BAA and a `disclosure_events` row.
- **Cost**. ~$0.0001 per note embedded; trivial. Query embeddings are also ~free.
- **Quality**. Off-the-shelf embeddings work fine for "find similar notes" but are weaker on temporal/relational questions ("what happened *before* the fall?"). For MVP this is acceptable; we'd revisit if the search feels dumb.
- **Index size & RLS**. Need to confirm pgvector ANN indexes (HNSW or IVFFlat) play well with our row-level org scoping. They do, but worth a spike.

**Recommendation**: this is the foundation — do it as a focused 1.5–2 week effort. Treat it as Phase 2 (after the quick wins land). Items 3 and 4 should not be attempted before this is solid.

---

## 3. Update vague entries with agent reasoning

**Already done**: persistence side is solved — `notes.is_edited` and `notes.edited_output` already exist; the retry-on-failure flow uses them. So we don't need a new DB shape for edits.

**What's actually new**:
- Retrieval layer (depends on #2) — given a vague correction, find candidate notes
- Claude reasoning prompt — given the user's correction text + a small set of candidate notes, propose which one to edit and what the diff should be
- Diff/preview UI — show before/after so the user can approve
- Audit trail — edits already write to `audit_events` via the trigger on `notes`, so this is covered

**Risks / unknowns**:
- **Hallucinated edits**. The model might confidently propose a wrong edit. Mitigation: always show a confirm dialog (item 6), and keep `raw_input` immutable so the original observation is recoverable.
- **Identifying the right note**. "John was more agitated this morning" needs to disambiguate which morning, which John, etc. Strong dependency on retrieval quality (#2).
- **Multi-note edits**. What if the correction applies to two entries? MVP should refuse (one-edit-at-a-time) and ask the user to clarify.

**Recommendation**: Phase 3, after #2 ships. ~1–1.5 weeks. High user value but the failure mode (silently wrong edits) is bad — gate hard on item 6.

---

## 4. Detect contradictions on ingest

**Already done**: not directly, but the structured output already has a `flags` field that the shift-note prompt populates. We can ride that channel.

**What's actually new**:
- On note ingest, retrieve recent notes for the same resident in the same date range (cheap SQL — doesn't strictly require #2, but #2 gives better recall)
- Run a Claude Haiku classifier: given the new note + recent notes, is there a factual contradiction? If so, what?
- Surface as a banner / dialog before commit; user can proceed, correct, or discard.
- This becomes a new `flag.type = "contradiction"` value the structured output emits.

**Risks / unknowns**:
- **False positives**. Caregivers shouldn't be interrupted by spurious contradictions. Tune the classifier conservatively; only flag high-confidence conflicts.
- **Latency**. Adding a second Claude call to the ingest flow doubles the time-to-save. Run async-after-save with a "we noticed a possible conflict" prompt rather than blocking submission.

**Recommendation**: Phase 2, can ship roughly in parallel with #2. ~0.5–1 week.

---

## 5. Delete / void an entry

**Already done**: residents have a soft-delete pattern (`ResidentDeleteControls`, `status: deleted_pending`). Notes do **not** currently have a void column.

**What's actually new**:
- Migration adding `notes.voided_at TIMESTAMPTZ`, `voided_by UUID`, `voided_reason TEXT`
- UI affordance per note (caregiver-accessible)
- Render rules: voided notes hidden from the timeline by default, surfaced in admin/audit view with a "voided" badge
- All export / share / family-update / weekly-summary flows must filter `voided_at IS NULL`
- Audit event `event_type = 'void'` (new, or reuse `'permission_change'`)

**Risks / unknowns**:
- **HIPAA: cannot hard-delete PHI silently**. The void approach is correct — we mark unread, never `DELETE FROM notes`. The original `raw_input` stays for forensic / regulatory recovery.
- **Voided notes leaking into PDF export**. The PDF export PR #31 doesn't filter voided notes (they don't exist yet). The migration that adds the column needs a follow-up to update exports.

**Recommendation**: quick-win bucket, ship before the agentic features. ~0.5–1 week.

---

## 6. Confirm before any write/update/delete

This isn't a feature — it's a UX invariant. Today the codebase already does this for high-stakes operations (delete resident, share with clinician, send family update). The standard is a `<Dialog>` with a clear "what's about to happen" preview and an explicit confirm button.

**What's actually new**: nothing on its own. We just have to make sure items 3, 4, and 5 each integrate one. Folded into their cost estimates.

**Recommendation**: not a separately-scoped item. It's a definition-of-done check on every agentic flow.

---

## 7. Summarise entries in a time window on demand

**Already done**:
- The weekly-summaries cron (`src/lib/jobs/weekly-summaries.ts`) generates date-ranged summaries via Claude.
- The clinician-share flow (`src/app/api/share/clinician/route.ts`) generates a date-ranged clinician summary on demand.
- The family-update flow (`src/app/api/claude/family-update/route.ts`) also does date-ranged summarisation.

The infrastructure (`parseStructuredOutput`, `serializeSectionsForPrompt`, `filterSectionsForClinician`, etc.) is all reusable.

**What's actually new**:
- A "Summarise" button on `/today` and on the resident detail page (so the caregiver can hit it ad-hoc).
- A new lightweight prompt — neither clinician-formal nor family-friendly; just a quick caregiver readback ("here's what happened today: …").
- A new endpoint that wraps the existing summariser with the new prompt.

**Risks / unknowns**:
- **Cost / latency**. A short summary over today's notes is well under a second on Claude Haiku and cents per call. Negligible.
- **Empty days**. Need a sensible "nothing to summarise yet" state.

**Recommendation**: quick-win bucket. ~0.5 week.

---

## Suggested phased rollout

**Phase 1 — Quick wins** (~1.5 weeks total)
- Item 1 (better-surfaced categories)
- Item 5 (void)
- Item 7 (on-demand summary)
- Item 6 standard for any new write flow

These ship independently with no dependency on a vector store. Each is its own small PR.

**Phase 2 — Search foundation** (~2 weeks)
- Item 2 (embeddings + retrieval)
- Item 4 (contradiction detection — can ride alongside since the retrieval helper is shared)

This is the heaviest phase but unlocks everything else. Worth doing as a single coherent project rather than dribbling features in.

**Phase 3 — Agentic edits** (~1–1.5 weeks)
- Item 3 (vague-correction reasoning + confirm)

Last because it has the highest "silently wrong" risk and depends on the search quality being good enough that the proposed edit is usually defensible.

---

## Open questions for the team

1. **Embeddings provider**: OpenAI (already integrated for Whisper, BAA in place if we're paying for it) vs. Voyage (better quality on domain text, separate BAA needed). Pick before we start Phase 2.
2. **Search UX**: standalone search page, or inline filter on the resident note timeline? Affects scope of #2.
3. **Voiced of void**: caregivers self-serve, or admin-only? My instinct: caregivers can void their own notes within ~24h; after that, admin-only. Easier to loosen than to tighten.
4. **Confirmation copy**: should we follow the same "X is about to happen, do you want to proceed?" pattern across all three agentic flows, or vary per action? Worth designing once and reusing.
5. **Latency budget for contradiction detection**: block submit, or async banner? My recommendation is async banner for caregiver speed.

---

## What's *not* in this list (worth flagging)

A handful of things our colleagues didn't mention but will probably come up:

- **Voice input for the agent**. Caregivers already capture voice notes; routing the same Whisper stream into the agent for queries 3, 4, 7 is a small win.
- **Per-resident timeline view of the agent's own actions**. If the agent edits notes on the user's behalf (item 3), there should be a way to see "what did the agent do?" — this is just rendering the existing audit trail nicely.
- **Sensitive-content boundary**. The retrieval and contradiction detectors must respect the same `sensitive_flag` exclusion the export and share flows do. Easy to forget; called out so we don't.
