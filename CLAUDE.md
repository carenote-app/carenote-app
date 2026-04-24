# Kinroster

AI-powered documentation tool for small elder-care providers (6-20 bed residential care homes).

## Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (PostgreSQL + Auth + RLS)
- Claude API (Sonnet 4.6 for structuring, Haiku 4.5 for classification)
- OpenAI Whisper API (voice transcription)
- Resend (email), Stripe (billing), Vercel (hosting)
- Package manager: pnpm

## Key Architecture
- All data is org-scoped via Supabase RLS. Every query filters by organization_id.
- Two user roles: admin (full access) and caregiver (limited access).
- Claude prompts are in `src/lib/prompts/`. Each prompt has a system template and user template.
- Voice: MediaRecorder -> Whisper API -> transcript. Audio is NEVER stored.
- Notes store both `raw_input` (source of truth) and `structured_output` (Claude-generated).
- The `is_structured` flag on notes enables retry for failed Claude calls.

## Commands
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — run ESLint

## Important Rules
- PHI must never be logged or stored outside the encrypted database.
- Claude is a scribe, never a clinician. Never diagnose or recommend treatment.
- Always preserve the caregiver's factual observations exactly.
- RLS must be enabled on every table with user data.

## Spec Documents
Full product spec is in the sibling `kinroster-docs/` repo. Key references:
- PRD: `05-PRODUCT-REQUIREMENTS.md` (features F1-F10)
- Data Model: `08-DATA-MODEL.md`
- Prompts: `09-PROMPT-ENGINEERING.md`
- Compliance: `10-COMPLIANCE-AND-SECURITY.md`
- Build Plan: `11-BUILD-PLAN.md`

## Implementation Roadmap
- **HIPAA compliance roadmap:** `docs/HIPAA-ROADMAP.md` — 10-phase plan to make the app ready for real PHI. Phase 1 (clinician directory + secure sharing) is shipped. Read this before starting any phase, and before changing migrations, RLS, prompts, or sharing flows.
