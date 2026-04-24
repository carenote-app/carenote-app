# Vapi Live Voice Integration — Implementation Status

Integrates live AI voice calls (Vapi + Deepgram + Claude) into kinroster, allowing caregivers to speak to an AI assistant instead of typing shift notes. The call transcript feeds the existing note-structuring pipeline.

Feature originated as a prototype in a separate repo (`caretaker-note`, T3 stack) and was ported into kinroster rather than merging repos.

## Architecture at a Glance

```
Caregiver clicks "Voice Call" on resident page
    │
    ▼
Browser → POST /api/voice/start
    │   (creates voice_sessions row, returns Vapi config with resident context)
    ▼
Browser ──(@vapi-ai/web SDK)──► Vapi cloud
    │   (spoken conversation: Deepgram transcribe + LLM + Deepgram TTS)
    ▼
Vapi cloud ──(call events via server URL)──► /api/voice/webhook
    │   (updates session, inserts transcript turns, creates note)
    ▼
/api/voice/webhook internally runs Claude structuring
    │   (same pipeline as typed notes)
    ▼
Client polls /api/voice/session/[id] → auto-refreshes page when note is ready
    │   (shows "Structuring note..." spinner during wait)
    ▼
Structured note appears in resident's timeline
    │   (incident dialog pops up if flags detected)
```

---

## Phase 1 — Database Schema ✅ DONE

Tables for voice sessions and per-turn transcripts, wired into existing `notes` + `residents` + `organizations` with RLS.

- [x] Migration `supabase/migrations/00003_voice_sessions.sql`
- [x] `voice_sessions` table (call metadata, status, full transcript, link to note)
- [x] `voice_transcripts` table (individual turn-by-turn rows)
- [x] RLS policies: org-scoped reads, caregiver-owned writes, admin override
- [x] Indexes: org+created, resident, caregiver, vapi_call_id, active-calls partial
- [x] `updated_at` trigger on voice_sessions
- [x] Database types regenerated with `VoiceSession` + `VoiceTranscript` exports

---

## Phase 2 — Vapi Dashboard Setup ✅ DONE

Static assistant in Vapi dashboard — one assistant ID used for all calls, with per-call variable overrides for resident context.

- [x] Vapi account created
- [x] Assistant published with:
  - Voice: Deepgram Asteria (Aura)
  - Transcriber: Deepgram Nova-2
  - System prompt for shift-note intake (collects mood, meals, meds, mobility, concerns)
- [x] Assistant ID captured: `4efa24db-55e7-4500-9ff4-97ce1c351001`
- [x] Server URL configured on assistant level with `x-vapi-secret` header
- [x] Webhook verified end-to-end via ngrok

---

## Phase 3 — Backend Integration ✅ DONE

Server-side routes + helpers.

- [x] `src/lib/supabase/admin.ts` — service-role client for webhook (bypasses RLS)
- [x] `src/lib/vapi.ts` — webhook signature verification + assistant-overrides builder
- [x] `src/app/api/voice/start/route.ts` — auth check, creates session row, returns Vapi config
  - Passes `sessionId` in `assistantOverrides.metadata` for webhook lookup
  - Overrides `firstMessage` with resident name + conditions (no "which resident?" prompt)
- [x] `src/app/api/voice/webhook/route.ts` — handles `status-update` + `end-of-call-report`
  - Finds session via `assistantOverrides.metadata.sessionId` (not `vapi_call_id`)
  - On call end: assembles transcript, inserts turn rows, creates `notes` row, links `voice_sessions.note_id`, auto-runs Claude structuring
  - Stores `vapi_call_id` on session for reference
- [x] `src/app/api/voice/session/[id]/route.ts` — lightweight polling endpoint (returns note status + incident flag)
- [x] Fix: Claude default model ID corrected (`claude-sonnet-4-6`, no date suffix)

---

## Phase 4 — Client UI ✅ DONE

Voice call button on resident page with full call lifecycle UX.

- [x] `src/components/notes/voice-call-button.tsx`
  - Start/end call states with visual feedback
  - "Structuring note..." spinner after call ends
  - Auto-polls every 3s for structured note, auto-refreshes page when ready
  - Incident detection dialog (same as typed notes) when flags detected
  - Suppresses false Daily.co "Meeting has ended" error
- [x] Wired into `src/app/(dashboard)/residents/[id]/page.tsx`
- [x] `@vapi-ai/web` + `@vapi-ai/server-sdk` installed
- [x] Old "Hold to speak" Whisper-based voice recorder removed (redundant with Voice Call)

---

## Phase 5 — Local Testing ✅ DONE

End-to-end verified.

- [x] Local Supabase running + migration applied
- [x] ngrok tunnel set up (`ngrok.yml` in repo)
- [x] `.env.local.example` updated with Vapi vars
- [x] First successful end-to-end call: start → converse → end → structured note appears
- [x] Webhook receives events, finds session via metadata, creates + structures note
- [x] Auto-refresh shows note without manual page reload
- [x] Incident flags detected and stored (confusion, appetite changes confirmed)
- [ ] **Rotate leaked Vapi private key** (the first one was pasted in chat — must regenerate)
- [ ] Verify `voice_transcripts` rows are correctly ordered by `offset_ms`

---

## Phase 5.5 — UI & Theme ✅ DONE

Landing page integration and dark/light mode.

- [x] V0-designed landing page integrated (header, hero, role selection, features, consult modal, footer)
- [x] `next-themes` ThemeProvider wired up with system preference default
- [x] Sun/moon toggle on dashboard header + landing page header
- [x] Light theme updated with teal healthcare accents (matches landing page)
- [x] Dark theme uses deep slate + bright teal from V0 design
- [x] Resident page layout tightened (max-w-2xl, compact form, smaller headings)
- [x] Conditions block uses bordered card instead of flat muted background
- [x] `suppressHydrationWarning` on relative timestamps
- [x] Next.js dev error overlay disabled (Daily.co noise)

---

## Phase 6 — Voice Session History UI ⏳ PENDING

Let caregivers and admins review past voice calls.

- [ ] `/voice-sessions` page listing recent calls (org-scoped)
- [ ] Per-session detail view: playback of turn-by-turn transcript, linked structured note, call duration
- [ ] Filter by resident, caregiver, date range
- [ ] Show call status badges (completed / failed / in-progress)

---

## Phase 7 — Production Deployment ⏳ PENDING

- [ ] Migrate `00003_voice_sessions.sql` to production Supabase (currently local only)
- [ ] Add Vapi env vars to Vercel (or wherever kinroster deploys)
- [ ] Replace ngrok webhook URL with production URL in Vapi org settings
- [ ] Enable HIPAA add-on in Vapi (currently disabled — see dashboard Compliance section)
- [ ] Configure Vapi PII redaction rules for transcripts containing medical details
- [ ] Set up Vapi billing / credit alerts

---

## Phase 8 — Polish & Scale ⏳ PENDING (future)

- [ ] Dynamic per-call assistant creation (inject resident-specific medical context into system prompt) — currently using static assistant + variable substitution
- [ ] Voice call for family updates (reverse direction — AI calls family members)
- [ ] Integration with phone numbers (Vapi Phone Numbers feature) for inbound calls
- [ ] Call summary comparison: voice-structured vs typed-structured quality analysis
- [ ] Cost tracking per call (duration × Vapi rate + downstream Claude tokens)

---

## Key Design Decisions

**Why Vapi over Twilio + custom STT/TTS?** Vapi bundles telephony, STT, LLM, and TTS with interruption handling and barge-in. Building this from primitives adds weeks of work for no material gain over Vapi's quality.

**Why static assistant?** Easier to iterate prompts in Vapi's UI than deploying code changes. Resident-specific context passes via `variableValues` overrides at call start. The `firstMessage` is overridden per-call to greet with the resident's name and conditions.

**Why service-role client in webhook?** Vapi webhooks are unauthenticated to Supabase — no user session exists. Service role bypasses RLS so the webhook can update `voice_sessions`, insert `voice_transcripts`, and create `notes` rows on behalf of the caregiver recorded on the session.

**Why auto-trigger structuring?** The existing note-review UI (`note-input-form.tsx` review step) still gates the final output for typed notes. Voice notes auto-structure and auto-refresh — the caregiver sees the result immediately and can flag incidents via the dialog prompt.

**Why port the feature instead of merging repos?** The prototype repo (`caretaker-note`) was on a different stack (tRPC + Prisma + Gemini). Merging would have required rewriting 80+ API handlers and a schema migration. Porting just the Vapi-specific code took a few focused PRs.

**Why metadata-based session lookup?** Vapi places custom metadata at `call.assistantOverrides.metadata`, not `call.metadata`. The webhook extracts `sessionId` from there to find the correct voice_sessions row, with a fallback to `vapi_call_id` for robustness.
