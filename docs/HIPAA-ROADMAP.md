# Kinroster HIPAA Compliance Roadmap

## Why this exists

Kinroster creates, stores, transmits, and routes electronic protected health information (ePHI). Before it can be used with real patient data, the app needs the compliance primitives that HIPAA (treatment/payment/operations rules, minimum-necessary standard, narrower family-sharing rules) and 42 CFR Part 2 (substance-use records) require.

This document is the engineering source of truth for that work. It was written from a comprehensive compliance spec that outlined the full target state, adapted to what Kinroster already has and what it needs to build. Every phase below is scoped as a standalone slice that can ship independently; the order reflects dependency and risk, not feature priority.

The legal analysis behind this roadmap still needs review by qualified healthcare counsel before any org uses the app with real PHI. The code gets you ready; the BAAs and legal review get you live.

## Status at a glance

| Phase | Scope | Status | Dev estimate | Blocking for prod PHI? |
|-------|-------|--------|--------------|-----------------------|
| 1 | Clinician directory + secure sharing | **Shipped** (commit d907d25) | — | Not blocking but highest value |
| 2 | Family authorization & consent | **Shipped** (commit d4b61e7) | — | Yes |
| 3 | Disclosure classification tags | **Shipped** (commit 14f654c) | — | Yes |
| 4 | Sensitive-data segmentation (42 CFR Part 2) | **Shipped** (commit 3b50726) | — | Yes |
| 5 | Audit events | **Shipped** (commit 77a2acc) | — | Yes |
| 6 | Role expansion & minimum-necessary | **Shipped** (commit 31d1cab) | — | No |
| 7 | Session controls & rate limiting | **Shipped** (commit 3c152c9) | — | Yes |
| 8 | Data subject rights (export + deletion) | **Shipped** (commit eb0664d) | — | Yes |
| 9 | Voice & transcript retention | **Shipped** (commit dfb0821) | — | No |
| 10 | Compliance ops (BAAs, runbook, counsel) | Ongoing | Non-code | **Yes** |

Remaining dev time: ~19-28 days. Phase 10 runs in parallel throughout.

## Conventions every phase must follow

Before writing a migration or an API route, know these:

1. **Migrations** are numbered and immutable. Next migration is `supabase/migrations/00006_*.sql`. Never modify a prior migration.
2. **RLS before policies.** `CREATE TABLE ...` → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` → policies. Enabling RLS after policy creation leaves a window where rows are readable.
3. **All DB functions** pin `SET search_path = public` (or `''`). See `supabase/migrations/00002_secure_functions.sql` for the canonical pattern.
4. **Org-scoped reads + admin-only writes** is the default RLS pattern. Helpers: `get_user_org_id()`, `is_admin()`. See `supabase/migrations/00001_initial_schema.sql:215-224`.
5. **Service-role client** (`src/lib/supabase/admin.ts`) bypasses RLS. Use ONLY in webhooks, crons, and unauthenticated portal endpoints. Never import from client code.
6. **Append-only tables** (audit, disclosure, authorization changes) get INSERT + SELECT policies but no UPDATE/DELETE policies. RLS blocks by default.
7. **Types** live in `src/types/database.ts` (generated). After a migration: apply it (`supabase db reset`), then `supabase gen types typescript --local > src/types/database.ts`. If Docker is unavailable, augment the file manually with the same shape the generator produces — the next regen overwrites without semantic drift.
8. **Prompts** live in `src/lib/prompts/<name>.ts` with three exports: `SYSTEM_PROMPT` constant, `buildUserPrompt()` function, `Output` interface.
9. **Claude calls** go through `callClaude()` in `src/lib/claude.ts` which handles retry, timeout, and parse. Use `parseJsonResponse<T>()` to strip markdown fences.
10. **UI components** use shadcn via `src/components/ui/*`. Dialog trigger uses `render={<Button />}` pattern (the `@base-ui/react` library — no `asChild`).
11. **Role gating.** Server pages: `await requireAdmin()` from `src/lib/auth.ts`. API routes: check `appUser.role !== 'admin'` explicitly if needed. RLS enforces at the DB layer regardless.

---

## Phase 1 — Clinician directory + secure clinician sharing ✅

**Shipped in commit d907d25.** Admins can now share a clinician-formatted summary of one resident's notes with that resident's treating physician via a magic-link portal. Every disclosure is logged.

### What was built

**Migration — `supabase/migrations/00005_clinicians.sql`**
- `clinicians` — org-level directory (full_name, email, phone, specialty, npi, notes, is_active)
- `resident_clinicians` — many-to-many assignment with relationship type (primary_care | specialist | hospice | psychiatric | other) and is_primary flag
- `clinician_share_links` — magic-link tokens: token_hash (SHA-256), share_scope (JSONB), rendered_summary (JSONB snapshot), expires_at, revoked_at, first_opened_at, last_opened_at, open_count, created_by. The unsigned token value is never stored.
- `disclosure_events` — append-only audit: recipient_type, legal_basis, categories_shared, source_note_ids, delivery_method, share_link_id. No UPDATE/DELETE policies.

**Claude prompt — `src/lib/prompts/clinician-summary.ts`**
Clinical register. Outputs `{ subject, body, key_observations[], medication_adherence, safety_events[], cognitive_changes, follow_up_recommended[] }`. Sonnet 4.6 via `callClaude()`.

**API routes**
- `POST /api/share/clinician` — renders summary, generates unsigned token, stores SHA-256 hash + frozen summary snapshot on the share link row, inserts `disclosure_events` (legal_basis=`treatment`, delivery_method=`magic_link_portal`), sends Resend email containing link only.
- `GET /api/portal/clinician/[token]` — unauthenticated, service-role lookup, records open event, returns frozen summary. 410 on revoked/expired.
- `POST /api/share/clinician/[id]/revoke` — admin revoke.

**UI**
- `/clinicians` — admin directory page.
- Treating-clinicians section on `/residents/[id]` with assign/unassign + per-clinician "Share" button.
- Share dialog: scope (date range) → preview (what the clinician will see) → confirm → receipt.
- `/portal/clinician/[token]` — public read-only summary view outside the `(dashboard)` group.
- "Clinicians" link in the admin nav.

**Other touches**
- `src/lib/resend.ts` — added `sendClinicianPortalLink()` (link-only, no PHI in email body).
- `src/lib/supabase/middleware.ts` — `/portal/*` added to public route list.
- `src/types/database.ts` — manually augmented with the four new tables because Docker wasn't running for type regen.

### Known limitations to carry forward

- **Admin-only sharing.** The migration restricts `clinician_share_links` insert to admins. Phase 6 can loosen this to nurse_reviewer once roles expand — caregivers in a 6-20 bed home typically aren't the right actor for clinician disclosures.
- **No segment filtering yet.** The prompt ingests every section of every note in scope. Phase 3 adds `disclosure_class` tags so the clinician summary can exclude `billing_ops_only` and gate `sensitive_restricted` behind an explicit unlock.
- **Email delivery is best-effort.** If Resend fails, the share row still exists (returns 200 with `email_sent: false`) so the admin sees the error. A resend-from-UI action isn't built yet; the admin would revoke + recreate. Add a proper resend endpoint when Phase 5's audit layer lands.
- **No rate limiting.** The portal endpoint accepts unlimited token guesses. Token is 256 bits of entropy so this is mostly academic, but Phase 7 adds per-IP rate limiting to close the gap.
- **Audit events not yet in place.** Phase 1 writes `disclosure_events` on share creation but does not log portal opens to `audit_events` (that table doesn't exist yet). Phase 5 adds that. When Phase 5 lands, revisit `/api/portal/clinician/[token]/route.ts` to insert an audit row on every open.

### How to verify (once Docker is running)

```bash
supabase start
supabase db reset        # applies 00001-00005
pnpm dev
```

Then, as an admin:
1. `/clinicians` → add a clinician with a real email you control.
2. `/residents/[id]` → assign that clinician.
3. Click "Share" → pick a date range that includes at least one structured note → Preview → Confirm.
4. Check the email inbox → open the link → portal renders summary.
5. In the Supabase dashboard (`http://localhost:54323`), verify:
   - `clinician_share_links.open_count` incremented.
   - `disclosure_events` has a row with `legal_basis='treatment'`.
6. From the share row, set `revoked_at=now()` → open the link again → 410.

Cross-org isolation check: log in as a different org's admin → `SELECT * FROM clinicians` returns 0 rows; opening the other org's portal token still works (correct — portal bypasses RLS intentionally).

---

## Phase 2 — Family authorization & consent model ✅

**Shipped.** Family contacts now carry explicit legal-basis tracking (involved in care / personal representative / signed authorization), a scope array of what categories they may receive, communication channel preferences, start/end dates, and a reason-required revoke flow. Enforcement is gated per-org by a new `settings.family_auth_required` toggle so legacy flows keep working until an org opts in.

### What was built

**Migration — `supabase/migrations/00006_family_authorizations.sql`**
Extends `family_contacts` with ten new columns: `involved_in_care`, `personal_representative`, `authorization_on_file`, `authorization_scope` (text array), `communication_channels` (text array, defaults `{email}`), `authorization_start_date`, `authorization_end_date`, `revoked_at`, `revocation_reason`, `confidential_communication_notes`. Permissive backfill: any existing contact with `receives_updates=true` is auto-marked `involved_in_care=true` so the legacy flow keeps working without admin review on day one.

**API — `src/app/api/family/send/route.ts`**
- Reads `organizations.settings.family_auth_required`. When true, rejects sends if the contact lacks any legal basis, is revoked, or has an expired authorization (403).
- Always writes a `disclosure_events` row on successful send. Legal basis derived in priority order: `personal_representative` → `patient_authorization` → `patient_agreement`. `categories_shared` uses the contact's `authorization_scope`, or `['wellbeing_summary']` as fallback for legacy contacts.

**UI**
- `src/components/residents/family-contact-form.tsx` (new) — shared add/edit form with legal-basis checkboxes, scope multi-select, channel toggles, start/end dates (shown only when authorization_on_file=true), and special instructions text.
- `src/components/residents/family-contact-list.tsx` — rewritten with auth-status badges per card (Authorized / Personal rep / Involved in care / Expired / Revoked / No basis), an Edit dialog, and a Revoke dialog that requires a reason.
- `src/components/family/family-update-editor.tsx` — adds a preview header on the editing step showing recipient, legal basis, approved scopes, and auth expiry. Warns that content-level filtering arrives in Phase 3 and asks the admin to manually trim the body in the meantime.
- `/settings` — new "Compliance" section with a Switch to toggle `family_auth_required`.

**Types**
- `src/types/database.ts` — augmented `family_contacts` Row/Insert/Update with the ten new fields.
- `src/test/fixtures.ts` — updated `mockFamilyContact` to include the new fields (keeps unit tests compiling).

### Known limitations to carry forward

- **Channels are stored but not enforced.** `communication_channels` is saved on each contact but nothing downstream checks it yet — email is still the only implemented channel. Revisit when SMS or phone delivery lands.
- **Scope is not content-filtered yet.** The family-update prompt still ingests all structured sections. Phase 3 adds `disclosure_class` tags so the prompt can filter sections by scope. Until then, admins trim the body manually during the preview step.
- **Legacy orgs remain on permissive mode.** `family_auth_required` defaults to false. Orgs stay on legacy behavior until an admin flips it in `/settings`. Consider an in-product nudge once Phase 5 audit-log exists so admins see "unauthorized disclosures may be flagged in future."
- **Disclosure logging already runs in legacy mode.** Every family send writes a `disclosure_events` row even when enforcement is off. Good for compliance accounting, but means legacy orgs accumulate `patient_agreement` rows for contacts that may not actually have agreed — admins should review during opt-in.
- **No automatic legal-basis downgrade on expiry.** If `authorization_end_date` passes, the "expired" badge appears but the contact still reads as having `authorization_on_file=true`. The send gate blocks correctly; the in-list display does too. No cron needs to run.

### How to verify (once Docker is running)

```bash
supabase db reset        # applies 00001-00006
pnpm dev
```

Then, as an admin:
1. `/residents/[id]` → edit a family contact → toggle legal bases, set scope checkboxes, set auth dates → Save. Verify the card shows the right badge.
2. Revoke a contact → required reason prompt → badge flips to "Revoked". Click "Restore" → returns to prior state.
3. `/settings` → flip "Require documented legal basis" on → Save.
4. Try to send a family update to a revoked contact → 403.
5. Try to send to a contact with expired `authorization_end_date` → 403.
6. Send to a valid contact → success. In Supabase Studio: `SELECT * FROM disclosure_events ORDER BY created_at DESC` → row with `recipient_type='family_contact'` and correct `legal_basis`.
7. Flip the flag off → previously-blocked sends now succeed (legacy mode still writes disclosure rows with `legal_basis='patient_agreement'`).

---

## Phase 3 — Disclosure classification tags on note segments ✅

**Shipped.** Structured notes now carry a per-section `disclosure_class` (who may see it) and a `scope_category` (what topic it covers). Family and clinician share flows filter on these tags deterministically — no more asking Claude to re-judge per audience. Sensitive content (substance use, psychotherapy) is marked at both the section level and on the notes row.

### Design calls that deviate from the original plan

The original plan gated the v1→v2 output shape behind an `organizations.settings.structured_output_version` flag. I dropped that flag. There's no scenario where an org would want to opt out of v2, and the v1/v2 branching added complexity without benefit. Instead, a single `parseStructuredOutput()` util normalizes both shapes at read time — v1 sections are treated as `family_shareable_by_involvement` with no scope_category (the permissive default), so old notes keep rendering and keep being share-eligible, just without topic-level filtering until they're re-structured. New notes are always v2.

A second call: the roadmap originally conflated `disclosure_class` and `authorization_scope` as the same axis. They're orthogonal — class = WHO (care team / family / billing / sensitive), scope = WHAT TOPIC (medications, safety, wellbeing, etc.). Phase 3 emits both per section; family filtering requires both gates to pass.

### What was built

**Prompt — `src/lib/prompts/shift-note.ts`**
Output shape is now `sections: Array<{ name, text, disclosure_class, scope_category }>` plus top-level `sensitive_flag` + `sensitive_category`. Classification rules live in the system prompt:
- Default class is `family_shareable_by_involvement`.
- Clinical detail (detailed medication issues, behavior analysis) → `care_team_only`.
- More substantive family-relevant detail that needs a signed auth → `family_shareable_by_authorization`.
- Substance use mentions → `sensitive_restricted` + `sensitive_category: "substance_use_42cfr_part2"`.
- Psychotherapy → `sensitive_restricted` + `sensitive_category: "psychotherapy_notes"`.
- scope_category is deterministic: Safety → `safety_alerts`; Medication Compliance → `medication_adherence_summary`; Mood/Sleep/Nutrition/etc. → `wellbeing_summary`; Family Communication → `visit_notifications`; task-focused statements → `task_completion`.

Exported types: `DisclosureClass`, `ScopeCategory`, `SensitiveCategory`, `StructuredNoteSection`, `StructuredNoteOutput`, and a legacy `StructuredNoteOutputV1`.

**Migration — `supabase/migrations/00007_note_sensitive_flags.sql`**
Adds `notes.sensitive_flag BOOLEAN DEFAULT false` + `notes.sensitive_category TEXT`. Partial index on `(organization_id, resident_id) WHERE sensitive_flag = true` to keep Phase 4's sensitive-access RLS fast. Types augmented in `src/types/database.ts`.

**Shared util — `src/lib/structured-output.ts`**
Central parser + filter layer so every consumer sees v2 uniformly:
- `parseStructuredOutput(raw)` — parses JSON, returns a v2-shape object. v1 rows normalize with permissive defaults.
- `filterSectionsForClinician(sections)` — drops `billing_ops_only` and `sensitive_restricted`.
- `filterSectionsForFamily(sections, auth)` — drops sensitive, enforces class based on contact's legal basis (`involved_in_care` → baseline only; `authorization_on_file` or `personal_representative` → both family classes), then requires `scope_category ∈ authorization_scope` unless scope is empty (legacy mode).
- `serializeSectionsForPrompt(sections, followUp)` — renders filtered sections back to plain text for the existing summarizer prompts, which stayed unchanged.

**API changes**
- `/api/claude/structure` now persists `sensitive_flag` + `sensitive_category` columns alongside the v2 JSON, and stamps `structured_output_version: "v2"` into metadata.
- `/api/claude/family-update` reads the contact's authorization fields, filters each source note through `filterSectionsForFamily`, and returns 400 if no note has any shareable content left. Source note ids returned reflect the filtered set.
- `/api/share/clinician` filters each source note through `filterSectionsForClinician` before the summary prompt. `disclosure_events.source_note_ids` reflects the filtered set.

**UI — `src/components/notes/note-timeline.tsx`**
Each section renders with a compact class badge next to its name (Care team / Family (involved) / Family (auth) / Ops / Sensitive). Cards for sensitive notes get an amber border + a ShieldAlert icon and a "Sensitive — restricted from routine sharing" subtitle. v1 notes render the same but without badges (no class data available). Uses the shared `parseStructuredOutput`.

**Test fixture** — `mockNote` in `src/test/fixtures.ts` updated with the two new columns.

### Known limitations to carry forward

- **No automatic unlock path for sensitive content.** Clinician shares silently drop sensitive sections even when the clinician legitimately needs them. Phase 4 adds the explicit-unlock UX and writes an audit row when a sensitive section is released.
- **v1 notes keep unfiltered scope behavior.** Old notes normalize with `scope_category: null`, and the family filter rejects null scopes UNLESS the contact's `authorization_scope` is empty (legacy mode). Enabling `family_auth_required` and setting a contact's scope means old v1 notes stop being shareable with that contact. Mitigation: leave scope empty for legacy contacts, or re-structure old notes.
- **Scope mapping is Claude-judged, not rule-enforced.** Claude picks `scope_category` based on the system prompt; there's no post-hoc validator. Phase 5's audit log will surface anomalies; a deterministic post-pass validator is a candidate for a later phase if Claude drift becomes a problem.
- **`categories_shared` in disclosure events is coarse.** Clinician disclosures populate it with `["key_observations", ...]` from the summary; family disclosures use the contact's full `authorization_scope`. Neither reflects the actual filtered section names. Tighten during Phase 5.
- **Re-structuring old notes is manual.** No "v1 → v2 upgrade" batch job. If an org wants historical ranges to carry class/scope tags, admin has to re-trigger structuring per note. Candidate for a future cron.

### How to verify

```bash
supabase db reset        # applies 00001-00007
pnpm dev
```

1. Create a note with a fall event → structured_output has a Safety section with `scope_category: "safety_alerts"`. Timeline shows the class badge.
2. Create a note mentioning alcohol → the note row has `sensitive_flag=true`, `sensitive_category='substance_use_42cfr_part2'`. Timeline card gets an amber border + ShieldAlert.
3. Set a family contact's `authorization_scope` to `['wellbeing_summary']`. Try to send a family update covering a fall note → the Safety section filters out; if all sections filter out, send returns 400.
4. Flip `family_auth_required` off → legacy general-update mode returns; scope no longer filters, but sensitive still blocks.
5. Share with a clinician → sensitive sections are silently omitted. `disclosure_events.source_note_ids` reflects the filtered set.

---

## Phase 4 — Sensitive-data segmentation (42 CFR Part 2 + psychotherapy) ✅

**Shipped.** Sensitive notes (substance-use + psychotherapy content, set by the Phase 3 structurer) are now hidden from the general org view via RLS. Only the note author, admins, and users with an explicit per-resident grant can read them. Clinician shares stay sensitive-free by default but can be unlocked with an explicit override that's recorded on the disclosure audit.

### What was built

**Migration — `supabase/migrations/00008_sensitive_access_grants.sql`**
- `notes_sensitive_access` — per-user-per-resident grant rows (`user_id`, `resident_id`, `granted_by`, `granted_at`, `expires_at`, `reason`). UNIQUE on (user_id, resident_id). Indexes on both the join key and the "active grants" partial set.
- Drops the existing `"Users can view org notes"` SELECT policy and replaces it: org-scoped AND (not sensitive OR author OR admin OR has-active-grant).
- Adds `disclosure_events.sensitive_override BOOLEAN DEFAULT false` so the audit row captures clinician-share overrides.
- `count_hidden_sensitive_notes(p_resident_id)` RPC — `SECURITY DEFINER` with pinned search_path, returns the number of sensitive notes the caller can't see. Used by the timeline for the placeholder.

Policies on `notes_sensitive_access`: users see their own grants (required by the notes RLS EXISTS subquery); admins see and manage grants for residents in their org.

**Admin UI — `/sensitive-access`**
New top-level admin page listing all grants for the org, with an "Access" nav entry in the hamburger. Form to create a grant: pick user (non-admin, active), pick resident (active), optional expiry, required reason. Expired grants fade; revoke is a single click.

**Clinician share unlock — `share-with-clinician-dialog.tsx`**
On entering the preview step, the dialog client-side queries sensitive notes in scope (admins can see them via RLS). If any exist, an amber "Sensitive content detected" card appears with categories listed and an explicit checkbox: "Include sensitive sections in this share (explicit override)". Checking it sends `includeSensitive: true` to `/api/share/clinician`.

The API: `filterSectionsForClinician` grows an `{ includeSensitive }` option — default behavior still drops sensitive_restricted; override keeps them. `disclosure_events.sensitive_override` is set accordingly.

**Timeline placeholder — `note-timeline.tsx`**
Accepts a new `hiddenSensitiveCount` prop. When > 0, renders an amber placeholder card at the top of the timeline: "N sensitive notes hidden — contact an admin". The resident page calls the RPC server-side and passes the count down.

**Weekly summary cron**
`/api/cron/weekly-summaries` now filters `sensitive_flag=false`. The weekly summary is distributed org-wide to a pending-review queue and isn't an appropriate surface for 42 CFR Part 2 content. Admins who want a compliance-admin summary that includes sensitive material can use the clinician-share flow with override.

**Types** — augmented `database.ts` with `notes_sensitive_access`, `disclosure_events.sensitive_override`, and the new RPC signature.

### Known limitations to carry forward

- **Incident reports still leak sensitive content.** If a sensitive note triggers an incident, the `incident_reports.report_text` is org-readable through the existing incident RLS. Not touched in this phase to keep scope tight. Fix in Phase 4.5 or fold into Phase 5 (audit) — either tighten incident RLS parallel to notes, or prompt the incident generator to redact sensitive observations.
- **Grants are resident-scoped, not note-scoped.** Once granted, a user sees every sensitive note on that resident including future ones. If per-note granularity is ever needed, add a `note_id` column to `notes_sensitive_access`. Not expected to be necessary.
- **Portal shares of sensitive content aren't re-labeled.** When `includeSensitive=true`, the clinician's portal view doesn't visually distinguish sensitive sections from routine ones. Phase 5's audit log will surface every override; a cleaner UX treatment (e.g., marking sensitive paragraphs in the portal) is deferred.
- **Family-share has no unlock path.** Intentional. Sensitive content can never reach the family flow; there's no UI to override. Family members who legitimately need sensitive information should receive it through a dedicated process, not this product.
- **Admin bypass is blanket, not audited.** Admins see every sensitive note without leaving a trail. Phase 5 will add per-access audit events that capture even admin reads.

### How to verify

```bash
supabase db reset        # applies 00001-00008
pnpm dev
```

1. As a caregiver who didn't author the note: `/residents/[id]` — sensitive notes are absent from the list, amber placeholder appears at the top with the count.
2. As admin: `/sensitive-access` → Grant Access → pick that caregiver, pick that resident → submit. Reload the resident page as the caregiver → the sensitive notes now appear with the Phase 3 amber ShieldAlert styling.
3. Revoke the grant → sensitive notes disappear again, placeholder returns.
4. As admin: Share with a clinician on a resident who has sensitive notes in the date range → dialog shows the "Sensitive content detected" card with categories → leave unchecked → Confirm → `disclosure_events.sensitive_override=false`, sensitive sections excluded from the rendered summary.
5. Redo with checkbox ticked → `sensitive_override=true`, sensitive sections included.
6. Run the weekly-summary cron (manually against a resident with sensitive notes) → summary_text contains no sensitive content; `source_note_ids` excludes sensitive notes.
7. Try to INSERT into `notes_sensitive_access` as a caregiver → RLS denies.

---

## Phase 5 — Audit events ✅

**Shipped.** An append-only `audit_events` table now captures security-relevant actions: logins, note create/update/delete, clinician-share creation and portal opens, share revokes, family sends, and sensitive-access grants/revokes. Admins read the log at `/audit-log` with filters and CSV export. This complements `disclosure_events` (patient-centric "who received PHI") with actor-centric "who did what in the system".

### Design calls that trimmed the original plan

The roadmap called for triggers on every PHI table, a wrapped typed client for SELECT auditing, and middleware-level failed-access tracking. Phase 5 does a narrower slice on purpose:

- **Triggers on `notes` and `notes_sensitive_access` only.** These are the highest-volume PHI tables and cover the create/update/delete events compliance reviewers actually ask about. Other PHI tables (residents, family_contacts, clinicians, etc.) log only the high-value actions from the API layer.
- **No SELECT audit.** A wrapped typed client that logs every read would be a firehose of noise for small-home deployments. Defer until a compliance reviewer explicitly asks. If it's needed later, a targeted trigger on a `note_reads` staging table or a ClickHouse sink is cleaner than instrumenting every query path.
- **No `login_failure` or middleware-level `failed_access`.** Supabase auth UI handles failed logins client-side; hooking the failures would require custom webhook plumbing. Middleware 401/403s rarely represent interesting events (most are unauth users hitting protected routes). Real cross-org attempts get blocked by RLS and return empty results without a clear signal. Skipping both and relying on `logout` + positive events is a defensible simplification.

### What was built

**Migration — `supabase/migrations/00009_audit_events.sql`**
- `audit_events` table with `organization_id`, `user_id` (nullable — portal opens are unauth), `event_type` (text; app-level enum in TypeScript), `object_type`/`object_id`, `result` (`success | denied | error`), `ip_address`, `user_agent`, `metadata JSONB`, `created_at`. Four indexes: `(org, created_at DESC)`, `(org, event_type, created_at DESC)`, `(org, user_id, created_at DESC)`, `(object_type, object_id)`.
- RLS: admin `SELECT` within org. No INSERT / UPDATE / DELETE policies — service-role is the only insert path and the table is effectively append-only.
- `log_notes_audit()` trigger function + `AFTER INSERT/UPDATE/DELETE` trigger on `notes`. Records note_create/update/delete with useful metadata (note_type, sensitive_flag, is_edited).
- `log_sensitive_access_audit()` trigger function + `AFTER INSERT/DELETE` trigger on `notes_sensitive_access`. Records grant/revoke with grantee and reason.
- Both triggers are `SECURITY DEFINER SET search_path = ''` per project convention.

**Helper — `src/lib/audit.ts`**
- `logAudit()` — service-role write. Takes `organizationId`, `userId`, `eventType`, `objectType`/`objectId`, `result`, `metadata`, and an optional `request` for IP + user-agent extraction. Fire-and-forget: errors log to console and never block the caller.
- Union type `AuditEventType` constrains event strings at the TS layer so typos don't silently diverge.
- IP extraction reads `x-forwarded-for` (first hop) or `x-real-ip`. Both Vercel and standard reverse proxies populate these.

**Retrofits into existing routes**
- `/auth/callback` — logs `login_success` after successful `verifyOtp` / `exchangeCodeForSession`.
- `/api/share/clinician` (POST) — logs `share_create` with metadata `{ recipient_type, clinician_id, resident_id, sensitive_override, source_note_count }`.
- `/api/portal/clinician/[token]` (GET) — logs `share_open` with `user_id=null`, metadata `{ clinician_id, resident_id, open_count_after, first_open }`.
- `/api/share/clinician/[id]/revoke` (POST) — logs `share_revoke`.
- `/api/family/send` (POST) — logs `family_send` with metadata `{ resident_id, communication_id, legal_basis, enforcement_on }`.

Sensitive-access grants/revokes are covered by the DB trigger, not API-layer calls. Note create/update/delete same — the trigger runs regardless of who wrote the row.

**UI — `/audit-log`**
- Admin-only page listing the most recent 100 events. Filters: event type (dropdown of common types), user (dropdown of org users), date range. Filters are URL params so they persist and are shareable.
- Each event card shows event_type, object_type badge, result badge if non-success, actor display (name + email, or "unauthenticated" for portal opens), IP, timestamp, and a collapsible metadata JSON block.
- "Export CSV" button → `/api/audit-log/export` which applies the same filters server-side and streams a CSV capped at 10k rows. Admin-only; non-admin callers get 403.
- Added to the admin nav in the hamburger.

**Types** — augmented `database.ts` with the `audit_events` shape.

### Known limitations to carry forward

- **No SELECT audit.** Reads aren't logged anywhere. A compliance reviewer who asks "who accessed resident X's chart on date Y" can only infer from write events. If this comes up, add a targeted log on the resident page and note detail page via the same `logAudit()` helper — don't build the full wrapped client.
- **No `login_failure` or unauth-middleware tracking.** Supabase auth UI owns the failure surface. If a client asks for login-failure tracking, use a Supabase database webhook on `auth.audit_log_entries`.
- **Admin reads of sensitive content still aren't audited.** Phase 4 noted this; still open. The fix is either (a) a SELECT audit on the notes table gated on `sensitive_flag=true`, or (b) log-on-API for specific routes that return sensitive content. Leaning toward (b) when it's needed.
- **CSV export is capped at 10k rows.** Per-query cap, not per-org-lifetime. Orgs that exceed this size need a date-filtered export or a paginated approach. Not expected for 6-20 bed homes.
- **Audit writes happen fire-and-forget.** If the service-role INSERT fails (e.g., transient Supabase error), the event is lost. Acceptable for Phase 5; Phase 10 compliance ops could add a retry queue if availability becomes a compliance concern.
- **No built-in retention / deletion of old audit events.** HIPAA asks for 6 years minimum retention. Default Postgres retains indefinitely, which is fine; if storage becomes an issue, a cron that archives rows older than 7 years is straightforward.

### How to verify

```bash
supabase db reset        # applies 00001-00009
pnpm dev
```

1. Log in as admin → a `login_success` row appears in `/audit-log` with correct IP + user-agent.
2. Create a note → `note_create` row with metadata including note_type and resident_id.
3. Edit the note within the 1-hour window → `note_update` row with `is_structured` / `sensitive_flag` in metadata.
4. Share with a clinician → `share_create` row; open the magic link in an incognito tab → `share_open` with `user_id=null`.
5. Revoke the share → `share_revoke` row.
6. Send a family update → `family_send` row with `legal_basis` + `enforcement_on`.
7. Grant sensitive access via `/sensitive-access` → `sensitive_access_grant` row (from the DB trigger, not the API call). Revoke → `sensitive_access_revoke`.
8. Filter by event_type in the UI → list narrows. Click Export CSV → downloads a file matching the filter.
9. Try `UPDATE audit_events SET result='success' WHERE id=...` as admin in SQL → 0 rows affected (RLS blocks). Same for DELETE.

---

## Phase 6 — Role expansion & minimum-necessary gating ✅

**Shipped.** Three new roles (nurse_reviewer, ops_staff, billing_staff) plus a reserved compliance_admin role now exist alongside admin + caregiver. ops_staff and billing_staff are blocked from clinical content at both the RLS layer and the navigation layer. The invite flow lets admins pick the right role up-front.

### Design calls that trimmed the original plan

The roadmap's Phase 6 scope was ambitious — rename admin to compliance_admin, migrate every `is_admin()` callsite to a role-aware check, and enforce caregiver_assignments via RLS. The shipped phase intentionally narrower on three axes:

1. **Did NOT rename admin → compliance_admin.** Cascading through every callsite and RLS policy is risky and offers no immediate benefit. `admin` stays as the catch-all top tier. `compliance_admin` is reserved as a valid role value; callsites that check admin already accept both.
2. **caregiver_assignments table exists but is NOT RLS-enforced.** A 6-20 bed home usually has caregivers rotating across all residents. Defaulting on per-assignment visibility would break the existing flow. The table is ready so admins can start populating assignments; a future sub-phase adds the opt-in enforcement behind a settings flag.
3. **Only clinical tables tightened, not a full per-role matrix.** notes, voice_sessions, incident_reports, and weekly_summaries now block ops_staff and billing_staff. Other tables (residents demographics, family_contacts operational data) stay readable because those are legitimately needed by ops and billing. Column-level redaction for clinical columns on residents (conditions, care_notes_context) is a future hardening if reviewers ask.

### What was built

**Migration — `supabase/migrations/00010_expanded_roles.sql`**
- Relaxes the `users.role` CHECK constraint to include: `admin | caregiver | nurse_reviewer | ops_staff | billing_staff | compliance_admin`.
- Adds `has_role(p_role TEXT)` helper — SECURITY DEFINER with pinned search_path, returns true iff the calling user's role matches exactly. Doesn't imply admin; callsites compose `is_admin() OR has_role(...)`.
- Creates `caregiver_assignments` table with unique(caregiver_id, resident_id), indexes for caregiver and resident lookups plus an "active" partial index, and admin-only write policies.
- Drops and recreates the SELECT policies on `notes`, `incident_reports`, `weekly_summaries`, and `voice_sessions` to add `AND NOT has_role('ops_staff') AND NOT has_role('billing_staff')`. The Phase 4 sensitive-content logic on notes is preserved unchanged.

**Auth helpers — `src/lib/auth.ts`**
- `Role` union type covering all six roles.
- `requireAdmin()` now accepts either `admin` or `compliance_admin` so the reserved role works transparently.
- `requireRole(roles, { allowAdmin })` — server-page guard that admits the listed roles (plus admin by default).
- `NON_CLINICAL_ROLES` constant + `isClinicalRole(role)` helper for UI-layer gating that mirrors the RLS decisions.

**Navigation — `src/components/layout/app-shell.tsx`**
- Bottom nav items carry an optional `visibleTo(role)` predicate. Today / Calls are hidden from ops + billing (they'd hit empty-state or RLS denials). Incidents and Dashboard remain admin-only. Residents is visible to everyone (demographics only).
- Hamburger menu shows admin-only links (Team, Clinicians, Assignments, Sensitive Access, Audit Log, Settings) unchanged. Billing now also shows for billing_staff — ops and caregiver still don't see it. Role label under the user name is humanized via `formatRole()`.

**Invite flow — `/api/team/invite` and `InviteCaregiverForm`**
- Invite payload now accepts a `role` field; API validates against the four invitable roles (caregiver, nurse_reviewer, ops_staff, billing_staff) and defaults to caregiver on anything else. Admin cannot invite another admin through this flow (intentional — admin creation stays tied to signup).
- Form now includes a role dropdown with short descriptions per role.

**Assignments admin — `/assignments`**
- Admin-only page listing all caregiver assignments in the org. Form to create a new assignment (pick caregiver or nurse_reviewer, pick resident, pick start date). "End assignment" sets end_date to today. Active vs ended shown via badge + opacity.
- Linked from the admin nav with a ClipboardList icon.

**Types** — augmented `database.ts` with `caregiver_assignments` and the `has_role` RPC signature.

### Known limitations to carry forward

- **Caregiver assignments aren't enforced.** The table exists; the RLS gate doesn't. Every caregiver still sees every resident's notes in their org. When you're ready to flip this on, add a settings flag `caregiver_assignments_required` and a small RLS tightening that ANDs an EXISTS check on active assignments. Don't flip on without admin populating assignments first.
- **admin and compliance_admin are behaviorally identical.** The latter is a reserved name for when/if a separate compliance-only tier is needed (e.g., audit access without signup authority). Until then, `requireAdmin()` accepts either.
- **No role-change UI.** Admins can invite with a role but can't change an existing user's role from the Team page yet. Workaround is a direct SQL update. Add a dropdown on the Team page when a customer asks.
- **residents table still exposes clinical columns.** `conditions` and `care_notes_context` are readable by ops_staff / billing_staff via the residents table (row-level RLS is org-wide). Column-level security in Postgres is awkward; a view + revoke + recreate is the cleanest fix. Defer until needed.
- **Existing admin-authored code paths still use `requireAdmin()`, not `requireRole()`.** `requireAdmin()` now correctly admits compliance_admin, so no existing page breaks. Migrating individual admin pages to the more precise `requireRole()` can happen as those pages are touched; it's not required.

### How to verify

```bash
supabase db reset        # applies 00001-00010
pnpm dev
```

1. Sign in as admin → invite a caregiver, nurse_reviewer, ops_staff, and billing_staff (four test invites).
2. Log in as ops_staff → bottom nav shows Residents only (no Today, no Calls, no Incidents). Visit `/today` directly → rendering shows empty state because RLS returns 0 notes. Visit `/residents/[id]` → demographics render but note timeline is empty.
3. Log in as billing_staff → same as ops + has a Billing link in the hamburger.
4. Log in as nurse_reviewer → sees clinical pages like a caregiver; can share with clinician; can't see admin pages.
5. As admin: `/assignments` → assign a caregiver to a resident → row appears; end the assignment → strikethrough.
6. `SELECT * FROM notes` as ops_staff via Supabase client → 0 rows (RLS enforced). Same for incident_reports, weekly_summaries, voice_sessions.
7. `SELECT * FROM residents` as ops_staff → rows visible (no clinical tightening on this table).

---

## Phase 7 — Session controls & rate limiting ✅

**Shipped.** Authenticated dashboard sessions now auto-expire after 15 minutes of idle activity. The magic-link clinician portal is protected by per-token (10/min) and per-IP (60/min) rate limits. The login page surfaces a clear "signed out due to inactivity" notice when the user returns.

### Design calls that trimmed the original plan

1. **Skipped the reauth modal.** The plan wanted explicit reauth for sharing, sensitive grants, role changes, and revocations. Session timeout covers the main "walked away from the laptop" threat model, and reauth requires modal UI across four product surfaces plus a credential-re-exchange flow. For Phase 7 this wasn't the highest-value work. Documented as Phase 7.5 — implement if a reviewer specifically asks.
2. **Per-org `session_idle_minutes` override skipped.** Per-request would require a DB call in middleware; 15 minutes is a defensible default. Add when customers ask.
3. **Login rate limiting delegated to Supabase.** Supabase Auth already rate-limits password attempts per IP and per email. Adding our own on top would be duplicate enforcement. Covered.
4. **No `session_expired` audit event.** Middleware runs in the edge runtime and the `logAudit()` helper uses the service-role client, which can be brittle in edge. Login_success on next sign-in is already logged — good enough. If reviewers ask for explicit session-expired tracking, emit it from the login page server action when `?reason=timeout` is present.

### What was built

**Middleware session timeout — `src/lib/supabase/middleware.ts`**
- Tracks `cn_last_seen` via an HTTP-only cookie. On every request to a non-public, non-auth-page, authed user hits the path:
  - If `last_seen` is more than 15 minutes old → `supabase.auth.signOut()` clears the Supabase auth cookies, redirect to `/login?reason=timeout`, `cn_last_seen` is cleared.
  - Otherwise the cookie is bumped to `now`.
- Public routes (`/portal/...`, `/privacy`, marketing pages) and the `/login` / `/signup` flow do NOT count as activity — visiting them doesn't reset the idle clock, and arriving there via the timeout redirect doesn't loop.

**Rate limiter — `src/lib/rate-limit.ts`**
- `checkRate(key, max, windowMs)` sliding-window limiter backed by an in-memory `Map`. Returns `{ allowed, remaining, retryAfterMs }`.
- Lazy pruning on each call keeps memory bounded without a sweeper. A crude LRU-style eviction kicks in at 10k keys to prevent pathological cases (legitimate traffic will never hit this).
- Single-Next-instance only. If we ever need multi-region, swap the backing `Map` for Upstash Redis behind the same interface — the call sites don't change.

**Portal rate limits — `/api/portal/clinician/[token]`**
- Per-token: 10 opens / minute. Legitimate clinician behavior (open once, refresh a few times) sits far below.
- Per-IP: 60 opens / minute. Blocks a bot sweeping random token strings. Tokens are 256 bits so brute force is mostly academic, but the per-IP cap also caps credential-stuffing attempts.
- Both checks run before any DB work. Returns 429 with `Retry-After` header.

**Login banner — `/login?reason=timeout`**
- Inline amber notice above the login form explaining why they were signed out. Shown only when the query string matches, so first-time visitors and magic-link confirmations don't see it.

### Known limitations to carry forward

- **No reauth for sensitive actions.** Phase 7.5 candidate. The session timeout is the primary mitigation; reauth would tighten the window further for admins doing share creation or sensitive grants. If it ships, model it as a `requireRecentAuth(minutesAgo)` helper that returns a structured 401 (`{ reauth_required: true }`) and a modal password prompt that re-exchanges the session.
- **Session timeout is hard-coded at 15 minutes.** No per-org override. Add a `organizations.settings.session_idle_minutes` flag when a customer asks; middleware would need to look up the org on each request, which is a measurable overhead that should be cached.
- **Rate limits are per-instance.** A horizontally scaled deployment (multiple Next.js servers) would have per-server buckets. For a single Vercel deployment this is fine; for multi-region, swap to Upstash Redis.
- **Login attempts rely on Supabase's built-in rate limiting.** If customers ever self-host Postgres + gotrue with relaxed limits, we'd need our own layer. Flag in the deploy checklist.
- **Timeout cleanup is best-effort.** If `supabase.auth.signOut()` fails in middleware (network blip), the user gets redirected but the Supabase auth cookies may linger. The next request will re-run the timeout check and redirect again until cookies eventually clear or the user logs back in. Not a security issue — they can't access anything without passing middleware.

### How to verify

```bash
pnpm dev
```

1. Log in as admin. Observe that `cn_last_seen` cookie is set (browser devtools → Application → Cookies).
2. Leave the tab idle for 15 minutes. Click any nav link. You're redirected to `/login?reason=timeout` and see the inactivity banner.
3. Hammer the clinician portal: `for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/portal/clinician/somerandomtoken123456; done` — first 10 responses 404, next 5 return 429 with `Retry-After` header.
4. Wait 60 seconds; requests succeed again (sliding window has moved).
5. Visit `/portal/clinician/<validtoken>` as an unauthed user — works, doesn't count as activity, doesn't affect your dashboard session elsewhere.

---

## Phase 8 — Data subject rights (export + deletion) ✅

**Shipped.** Admins can now export a resident's full record as a synchronous JSON download and run a two-step deletion flow (soft-delete → manual purge) with an append-only tombstone ledger. Every operation is logged on both `audit_events` and `disclosure_events`.

### Design calls that trimmed the original plan

1. **Export is synchronous JSON, not background ZIP+PDF.** The plan wanted a ZIP with PDF renderings delivered via signed URL email. That's a background queue + PDF renderer + Storage bucket — days of infra. For a 6-20 bed home's occasional portability request, a JSON download is pragmatically equivalent: the admin clicks, the browser saves the file, they forward it. A future enhancement can wrap the JSON + a PDF render when there's demand.
2. **No 30-day automatic purge cron.** The plan proposed soft-delete then auto-purge after 30 days. Crons that silently delete data are exactly the class of infra bug that causes HIPAA breaches. Phase 8 ships manual purge with an explicit reason — the admin does the second step when they're ready. Gives the same outcome without a silent-deletion failure mode.
3. **No user export / user deletion this phase.** The Phase 5 audit log CSV already covers "user's own activity"; hard-deleting users requires preserving audit trails via hashed user_id which is real complexity. Deactivate-via-Team already exists. Defer both.

### What was built

**Migration — `supabase/migrations/00011_deletion_rights.sql`**
- Adds `deleted_pending` to the `residents.status` CHECK enum.
- Creates `deletion_ledger` (`id`, `organization_id`, nullable `resident_id`, `resident_name_hash`, `previous_status`, `deleted_at`, `deleted_by`, `reason`). Admin-read within org; no INSERT/UPDATE/DELETE policies so the ledger is append-only from the service-role path.
- Indexes on (org, created_at DESC) for the ledger list, and on name_hash for future "has this person been purged before" lookups.

**APIs**
- `GET /api/residents/[id]/export` — synchronous JSON bundle: resident profile, family contacts, treating clinicians, notes, incidents, weekly summaries, family communications, disclosure events, audit events, voice sessions + transcripts. Served with `Content-Disposition: attachment` so the browser downloads. Logs an `export` audit event and an `agency_internal` / `operations` disclosure event.
- `DELETE /api/residents/[id]` — soft-delete. Updates `status=deleted_pending` only if the current status is something else. 404s on re-delete.
- `POST /api/residents/[id]/restore` — reverts to `active`. Only acts on rows currently in `deleted_pending`.
- `POST /api/residents/[id]/purge` — hard-delete guarded by `status=deleted_pending` so a single admin click can't destroy a live chart. Requires a reason (≥5 chars). Writes the deletion_ledger row BEFORE the cascade delete so the audit survives even if the cascade fails.

**UI**
- `/data-requests` admin page: list of residents in `deleted_pending` with per-row Restore / Purge / Export actions, plus a read-only purge ledger showing name hashes, reasons, and actors.
- Resident detail page: a Delete button in the admin header (when status != deleted_pending), or an amber banner with Restore / Purge / Export when status == deleted_pending.
- Admin nav gains a "Data Requests" link.

**Types** — augmented `database.ts` with `deletion_ledger`.

### Known limitations to carry forward

- **No PDF rendering.** JSON-only export. For human-readable output an admin copies the JSON into Word or a rendering tool. Future work if a customer asks.
- **No background job + email.** Exports are synchronous; a very large resident chart could stress a single request, though in practice 6-20 bed homes won't come close to the limit.
- **Cascade destroys disclosure_events tied to the resident.** The roadmap design notes this: a purge means we lose the external-disclosure accounting for that resident. The deletion_ledger records that a purge happened but not the historical disclosures. Acceptable trade-off for a purge that's intended to fully destroy the record (e.g., wrong-resident creation); use `discharged` / `deceased` statuses for residents whose records you want to retain.
- **No retention / archival tier.** Purged data is gone; there's no "legal hold" escape hatch for pending litigation. Add via the purge dialog if a customer ever asks — block purge when a hold tag exists.
- **User export and user deletion are still missing.** See design calls above. Covered workflows today: Phase 5 CSV export for user activity; deactivation via `/team` for user removal.
- **Export bundle does NOT include role-expanded filtering.** If a compliance_admin wants a "what would this ops_staff user have seen" synthesis, it's not available. Phase 6's minimum-necessary matrix is enforcement-only.

### How to verify

```bash
supabase db reset        # applies 00001-00011
pnpm dev
```

1. As admin, open a resident's page → click Delete → confirm in the dialog. Status flips to "deleted pending" and the resident disappears from `/residents`.
2. Visit `/data-requests` → see the resident in Pending deletion with Restore / Purge / Export buttons. Click Export → a JSON file downloads containing every record about the resident.
3. Click Restore → the resident reappears on `/residents`. The soft-delete and restore both show up in `/audit-log` as `permission_change` events.
4. Delete again → click Purge → type a reason → confirm. The resident is gone; the ledger row shows a name hash, the reason, and the actor. Notes, incidents, family contacts, voice sessions all cascaded.
5. As a non-admin user, hit `DELETE /api/residents/...` via curl → 403. Hit the export endpoint → 403.
6. Try to purge an `active` resident via the API (without going through soft-delete first) → 400 "Resident must be in deleted_pending state before purging".

---

## Phase 9 — Voice & transcript retention controls ✅

**Shipped.** Orgs can opt out of transcript retention via a new settings toggle; the Vapi webhook cleans up `voice_transcripts` rows and nulls `voice_sessions.full_transcript` after structuring. A Haiku-backed sanity check runs alongside the structurer and stashes any over-capture warnings on the note metadata so the timeline can surface them as informational banners.

This is the last code phase. Phase 10 (BAAs + counsel + NPP) is non-code and runs in parallel with customer conversations.

### What was built

**New prompt — `src/lib/prompts/voice-sanity.ts`**
Haiku 4.5 classifier that flags clearly off-topic content in a raw transcript. Categories: `financial`, `unrelated_personal`, `other_resident`, `non_care_gossip`. Returns `{ has_concerns, categories[], excerpts[] }`. Prompt instructs conservative flagging — err on NOT flagging for ambiguous content so the warning stays high-signal.

**Voice webhook — `src/app/api/voice/webhook/route.ts`**
- Structuring and voice-sanity now run in parallel via `Promise.allSettled`. Sanity failure never blocks the note; structuring failure still produces an unstructured row as before.
- Sanity result (when `has_concerns=true`) is persisted to `notes.metadata.over_capture_warning`.
- After successful structuring, reads `organizations.settings.retain_transcripts`. If explicitly `false`, deletes rows from `voice_transcripts` for this session and nulls `voice_sessions.full_transcript`. The note's `raw_input` (source of truth) is preserved regardless.
- Opportunistically brought the voice webhook's metadata population in line with the Phase 3 v2 structured-output shape that the `/api/claude/structure` route already used. Voice-created notes now correctly carry `sensitive_flag`, `sensitive_category`, and category names derived from the v2 sections array (they were previously empty / incorrect for voice-originated notes).

**Settings — `/settings`**
Added a new Switch for "Retain voice call transcripts" in the Compliance section. Defaults to `true` (legacy behavior). Help copy explains what flipping it off does and that the setting applies only to new calls.

**Timeline — `note-timeline.tsx`**
When a note carries `metadata.over_capture_warning.has_concerns === true`, the card renders an amber informational banner with the flagged category badges and up to three verbatim excerpts. Informational only — nothing blocks the note's display or sharing.

### Known limitations to carry forward

- **No historical cleanup.** Flipping `retain_transcripts` to `false` does NOT retroactively delete transcripts from prior calls. A one-time backfill cron or a SQL script can handle that when a customer asks; not shipped here to avoid accidental mass deletion on a misconfigured rollout.
- **Voice-only scope for the sanity check.** Text-mode notes (`NoteInputForm`) go straight to the shift-note structurer which already filters unrelated content — no secondary sanity pass. If voice-specific over-capture stays high, extend `voice-sanity` to text input.
- **Sanity is Claude-judged, not rule-enforced.** False positives and false negatives are possible. The warning is informational so the cost of either is low, but don't rely on it for compliance gating.
- **Cekura AI not integrated.** The Phase 9 sanity check is our own implementation. If Cekura is adopted later (see the dedicated section below), retire `voice-sanity.ts` and point timeline rendering at whatever Cekura delivers via its webhook.
- **Metadata shape is free-form JSON.** `over_capture_warning` lives inside `notes.metadata`; there's no dedicated column or CHECK constraint. A future phase that indexes or queries warnings at scale would want to promote it to a typed column.
- **The Phase 3 structured-output version fix in the voice path is a catch-up** — voice notes between Phase 3 landing and this commit carry broken `metadata.categories` (indices rather than section names). A one-time re-structure cron can repair them if anyone cares; they still render correctly on the timeline because the timeline reads `structured_output` directly, not `metadata.categories`.

### How to verify

```bash
pnpm dev
```

1. As admin, flip `/settings → Retain voice call transcripts` to off. Save.
2. Trigger a voice call via a resident's Voice Call Button → let it end → wait for the webhook to land.
3. In Supabase Studio: `SELECT * FROM voice_transcripts WHERE session_id = '<session>'` → 0 rows. `SELECT full_transcript FROM voice_sessions WHERE id = '<session>'` → null. `SELECT raw_input FROM notes WHERE id = '<note>'` → transcript still present.
4. Record a voice call where the caregiver mentions something clearly off-topic (e.g. "I need to call my bank", "Margaret in Room 5 was complaining"). The resulting note card in the timeline carries an amber "Possible over-capture in transcript" banner with categories + excerpts.
5. Normal-content voice calls produce no warning banner (`metadata.over_capture_warning` is absent).
6. Flip the toggle back to on → new calls retain transcripts.

---

## Phase 10 — Compliance ops (non-code, ongoing)

**Not implementation — but cannot ship real PHI without this.**

- Sign BAAs with: Supabase, Anthropic, OpenAI, Vapi, Resend, Stripe, Vercel. (Plus Cekura if adopted.)
- Enable HIPAA-eligible tier on Supabase (dedicated instance or HIPAA add-on).
- Enable Vapi HIPAA add-on.
- Draft + publish content: Notice of Privacy Practices, Privacy Policy update, Terms update. Pages exist at `/privacy`, `/terms`, `/hipaa` — content update, not new routes.
- Incident response runbook (HIPAA requires breach notification within 60 days).
- Annual risk assessment document.
- Employee HIPAA training tracking: add `users.hipaa_training_completed_at`. Block access if > 12 months since training.
- **Engage qualified healthcare counsel** before turning on real PHI.

---

## Cekura AI — third-party integration timing

Cekura is an automated QA + observability platform for conversational AI agents. It integrates with Vapi (the voice provider Kinroster already uses), detects hallucinations, runs simulated test conversations, and evaluates calls for compliance violations. Advertises HIPAA, SOC, GDPR.

### What it addresses

- **Vapi voice agent quality** — today testing is manual; Cekura runs thousands of simulated scenarios.
- **Hallucination detection** in the transcript → structured-note pipeline. Directly addresses Kinroster's core safety promise ("never invent observations").
- **Over-capture detection** — replaces the Haiku voice-sanity prompt planned in Phase 9.
- **Production observability** — latency, sentiment, interruption, gibberish detection. Kinroster has none today.
- **Compliance verification** — checks that the Vapi assistant doesn't diagnose, recommend treatment, or reference other residents on every call.

### What it doesn't address

- Nothing in Phases 2-5, 6-8 (data model, permissions, audit, consent, roles, session controls, data rights). Orthogonal.
- Text-only notes via `NoteInputForm` — those never touch Vapi.

### Recommendation

**Don't integrate before Phase 5.** Phases 2-5 close the blockers for real PHI; Cekura doesn't help with any of them. Integrating earlier spends vendor-integration time that doesn't buy compliance.

**Integrate during Phase 9 (or just before).** At that point:
1. You have voice call volume to justify the cost.
2. It cleanly replaces the Phase 9 voice-sanity prompt (save ~1 day of dev + the ongoing cost of maintaining that evaluator).
3. The rest of the compliance infrastructure is in place, so testing the voice layer becomes the remaining risk.

**When you do integrate:**
- Add Cekura to the Phase 10 BAA list.
- Configure Cekura webhook to ingest Vapi call events (both products already speak this API).
- Point Cekura's evaluation prompts at the structured-output shape from Phase 3.
- Add Cekura's real-time alerts to the ops notification path.
- Revisit Phase 9 plan — remove the voice-sanity prompt scope.

Rough integration effort: 1-2 days of wiring + ongoing prompt/eval tuning.

---

## Open decisions / things the owner should eventually weigh in on

These are flagged-but-not-blocked items. A future session can proceed without them, but they'll need an answer before production.

1. **Caregiver vs admin sharing.** Phase 1 restricts clinician sharing to admins. Decide in Phase 6 whether to extend to nurse_reviewer (probably yes) and/or caregiver (probably no — caregivers in a 6-20 bed home shouldn't own physician-facing disclosures).
2. **Structured output v1 → v2 migration cutover.** Phase 3 introduces the breaking shape change. Decide whether to backfill-reprocess existing notes (costs Claude credits) or leave them on v1 forever (timeline renderer has to keep both code paths).
3. **Magic link expiry default.** Phase 1 defaults to 14 days. Compliance counsel may want shorter (7 days) or org-configurable.
4. **Soft-delete retention window.** Phase 8 defaults to 30 days before hard-delete. Some state regs require longer (CA CMIA: 7 years for med records). Confirm before shipping deletion.
5. **Break-glass access** — for emergencies where a caregiver on a non-assigned resident has to document something urgent. Not in the roadmap. Decide whether to add to Phase 6.
6. **BAA with Cekura** if adopted in Phase 9. Would add one more vendor to the Phase 10 list.

## Pointers for any future Claude session picking this up

- The original Perplexity spec that drove this roadmap lives in your Messages attachments (you shared it once as `caregiver-app-update-spec.md`). If you need the full spec for edge cases, ask the user to re-share or point to where they saved it.
- The detailed Phase 1 implementation plan is at `/Users/pouyajavadi/.claude/plans/i-have-recently-talked-vast-clarke.md` (the user's personal plans folder, not in the repo).
- The CLAUDE.md at the repo root describes Kinroster's architecture and conventions — read that first.
- Each phase's migration is one file, numbered sequentially. Starting point for Phase 2: `supabase/migrations/00006_family_authorizations.sql`.
