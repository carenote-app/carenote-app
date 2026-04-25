# Kinroster — 30-Day Build Plan

## Overview

This build plan assumes a solo founder working full-time (8–10 hours/day) for 30 days. The plan is structured in weekly sprints with daily tasks. Each week ends with a functional, deployable milestone.

**Tech stack:** Next.js 15 (App Router), Supabase, Claude API (Sonnet 4.6), Resend, Stripe, Vercel.

---

## Prerequisites (Day 0 — Before Starting)

Complete these before Day 1:

- [ ] Node.js 20+ and pnpm installed
- [ ] Supabase account created (free tier)
- [ ] Anthropic API key obtained
- [ ] Resend account created
- [ ] Stripe account created (test mode)
- [ ] Vercel account created
- [ ] GitHub repository created
- [ ] Domain purchased (kinroster.com or similar)
- [ ] Figma or paper sketches of key screens (optional but helpful)

---

## Week 1: Foundation (Days 1–7)

**Goal:** A caregiver can sign in, see residents, and enter raw shift notes.

### Day 1: Project Scaffolding

- [ ] Initialize Next.js 15 project with App Router
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Set up project structure:
  ```
  src/
    app/
      (auth)/          -- Login, signup pages
      (dashboard)/     -- Authenticated app pages
      api/             -- API routes
    components/
      ui/              -- shadcn/ui components
      layout/          -- Shell, navigation
    lib/
      supabase/        -- Client and server helpers
      prompts/         -- Claude prompt templates
      utils/           -- Helpers
    types/             -- TypeScript types
  ```
- [ ] Deploy to Vercel (empty app, verify CI works)
- [ ] Set up Supabase project, connect to local dev

### Day 2: Database Schema (Part 1)

- [ ] Write and run migrations for:
  - `organizations` table + RLS
  - `users` table + RLS
  - `residents` table + RLS
  - `family_contacts` table + RLS
- [ ] Verify RLS policies work correctly
- [ ] Create TypeScript types for all tables

### Day 3: Authentication

- [ ] Implement Supabase Auth integration:
  - Email/password signup
  - Magic link login
  - Session management (JWT refresh)
- [ ] Build auth pages: signup, login, verify email
- [ ] Middleware: redirect unauthenticated users to login
- [ ] On signup: create organization + admin user record
- [ ] Mobile-responsive auth pages

### Day 4: Layout and Navigation

- [ ] Build app shell: header with facility name, bottom navigation
- [ ] Three tabs: Today, Residents, Dashboard
- [ ] Hamburger menu: Settings, Team, Billing, Log Out
- [ ] Mobile-first responsive layout
- [ ] Loading states and page transitions

### Day 5: Resident Management

- [ ] Resident list page (filterable by status)
- [ ] Add resident form (name, DOB, move-in date, room, conditions, preferences, care context)
- [ ] Edit resident form
- [ ] Resident detail page (profile info + placeholder for note timeline)
- [ ] Family contact add/edit on resident profile
- [ ] Empty states with guidance text

### Day 6: Raw Note Input

- [ ] Note input form: select resident, select type, text area
- [ ] Write migration for `notes` table + RLS
- [ ] API route to save notes (raw_input only, no AI yet)
- [ ] Shift log view: chronological feed of raw notes per resident
- [ ] Facility-wide "Today" view showing all today's notes

### Day 7: Polish and Deploy

- [ ] Test complete flow: signup → add resident → add contact → enter note → view in timeline
- [ ] Fix mobile UX issues (test on actual phone)
- [ ] Deploy to staging
- [ ] Commit clean code, write brief README

**Week 1 Deliverable:** Working app where a user can sign up, add residents, enter raw notes, and view them in a timeline.

---

## Week 2: Claude Integration (Days 8–14)

**Goal:** Notes are auto-structured by Claude. Incidents are detected and reported.

### Day 8: Claude API Setup

- [ ] Install Anthropic SDK (`@anthropic-ai/sdk`)
- [ ] Create Claude service module with:
  - API key configuration
  - Rate limiting (client-side)
  - Error handling and retry logic
  - Response parsing (JSON validation)
- [ ] Implement shift note system prompt (from 09-PROMPT-ENGINEERING.md)
- [ ] Build user prompt template with resident context injection
- [ ] Test with 10 sample inputs, validate output quality

### Day 9: Note Structuring Flow

- [ ] Update note submission flow:
  1. Caregiver submits raw text
  2. Claude structures it (loading state)
  3. Structured output displayed for review
  4. Caregiver can edit before saving
- [ ] Save both `raw_input` and `structured_output`
- [ ] Track `is_edited` and `edited_output`
- [ ] Extract and save `metadata` (categories, flags)
- [ ] Display structured notes in timeline (not raw)

### Day 10: Voice Transcription

> **BAA Dependency:** Verify OpenAI Whisper BAA availability before shipping voice with real PHI. If BAA is unavailable, voice input should be disabled for production use with real resident data until BAA is signed. Web Speech API (browser-native) can serve as an interim fallback but has lower accuracy. This must be resolved before Day 30 launch.

- [ ] Confirm OpenAI Whisper BAA status (BLOCKER for production voice use)
- [ ] Install and configure OpenAI SDK for Whisper API
- [ ] Build /api/transcribe route:
  - Accept audio blob via multipart form POST
  - Forward to Whisper API (model: whisper-1)
  - Return transcript text
  - Discard audio — never write to storage
- [ ] Add microphone button to note input UI (below text area, mobile-optimised)
- [ ] Implement press-and-hold recording using MediaRecorder API
- [ ] Show recording indicator while button held
- [ ] Show "Transcribing..." state on release
- [ ] Populate transcript into raw input text area on completion
- [ ] Handle errors gracefully: network failure → show message, fall back to text input
- [ ] Validate audio length client-side (minimum 2 seconds)
- [ ] Test on actual iPhone (Safari) and Android (Chrome) — verify MediaRecorder compatibility
- [ ] Verify audio is not persisted anywhere in the request/response cycle

### Day 11: Incident Classification

Note: The full note input stack (text + voice) is now complete before incident detection is built on top of it.

- [ ] Implement incident classification prompt (Haiku)
- [ ] Run classification before full structuring
- [ ] If POSSIBLE_INCIDENT or DEFINITE_INCIDENT:
  - Show prompt to caregiver: "Create incident report?"
  - If yes, proceed to incident report generation
  - If no, save as normal note with `flagged_as_incident = true`

### Day 12: Incident Report Generation

- [ ] Implement incident report system prompt
- [ ] Write migration for `incident_reports` table + RLS
- [ ] Build incident report generation and review UI:
  - Display generated report with editable fields
  - Severity selector (low, medium, high)
  - Save button
- [ ] Link incident report to source note

### Day 13: Incident Management

- [ ] Admin incident list view: filter by status, severity, resident, date
- [ ] Incident detail view for admin:
  - View full report
  - Add manager notes
  - Mark family notified (checkbox)
  - Change status: open → reviewed → closed
  - Set follow-up date
- [ ] Dashboard flag indicator: "X open incidents"

### Day 14: Error Handling and Edge Cases

- [ ] Claude API timeout handling: save raw note, queue for background structuring
- [ ] Empty input validation
- [ ] Long input handling (character limit with counter)
- [ ] Non-English input testing (Claude handles natively)
- [ ] Rate limiting on note submission (prevent accidental double-submit)
- [ ] Sentry error tracking setup

### Day 14: Week 2 Polish

- [ ] Test full flow: enter note → Claude structures → incident detected → report generated → admin reviews
- [ ] Mobile UX testing on phone
- [ ] Performance check: Claude response time < 3 seconds
- [ ] Deploy to staging

**Week 2 Deliverable:** Notes are auto-structured by Claude. Incidents are detected, flagged, and reported with admin oversight.

---

## Week 3: Family Communication + Summaries (Days 15–21)

**Goal:** Family updates can be generated and sent. Weekly summaries auto-generate.

### Day 15: Family Update Generation

- [ ] Write migration for `family_communications` table + RLS
- [ ] Implement family update system prompt
- [ ] Build "Generate Family Update" flow:
  - Admin selects resident
  - Date range picker (default: since last update)
  - Fetch notes in range
  - Send to Claude for family-friendly email generation
  - Display draft in editor

### Day 16: Family Update Review and Edit

- [ ] Editable draft view with source notes collapsed below
- [ ] Family contact selector (which contact to send to)
- [ ] Subject line editing
- [ ] Save as draft option
- [ ] "Last update sent" indicator on resident profile

### Day 17: Email Delivery

- [ ] Set up Resend integration
- [ ] Configure from-name and reply-to from organization settings
- [ ] Build email template (clean, mobile-friendly HTML)
- [ ] Send email on "Send" button click (with confirmation dialog)
- [ ] Handle send failures (retry once, then mark as failed)
- [ ] Save sent status and timestamp

### Day 18: Organization Settings

- [ ] Settings page:
  - Facility name
  - Timezone
  - Email from-name
  - Reply-to email address
- [ ] These settings are used in family update emails and weekly summaries

### Day 19: Weekly Summary Generation

- [ ] Write migration for `weekly_summaries` table + RLS
- [ ] Implement weekly summary system prompt
- [ ] Set up Vercel Cron job:
  - Run hourly, check each org's timezone against 6 PM Sunday
  - For orgs where it is 6 PM Sunday: generate summaries
- [ ] Cron handler:
  - For each active resident with notes this week
  - Fetch all notes from past 7 days
  - Send to Claude for summary generation
  - Save to `weekly_summaries` table with status "pending_review"

### Day 20: Summary Review UI + Dashboard

- [ ] Admin dashboard:
  - Notes entered today (count)
  - Residents without notes today (list)
  - Open incidents (count + list)
  - Pending weekly summaries (count)
  - Residents without family update in 7+ days
- [ ] Weekly summary review flow:
  - List of pending summaries
  - Review each: approve, edit, or regenerate
  - Approved summaries saved to resident timeline

### Day 21: Week 3 Polish

- [ ] Test full family update flow: generate → edit → send → email received
- [ ] Test weekly summary cron (trigger manually)
- [ ] Mobile UX testing
- [ ] Communication log: view history of sent updates per resident
- [ ] Deploy to staging

**Week 3 Deliverable:** Family updates generate from notes and send via email. Weekly summaries auto-generate for admin review.

---

## Week 4: Production Readiness (Days 22–30)

**Goal:** Production-ready for design partners. Billing active. Onboarding works.

### Day 22: Caregiver Invitation Flow

- [ ] Admin team management page
- [ ] "Invite Caregiver" form (enter email)
- [ ] Invitation email sent via Resend
- [ ] Invite link → account creation with auto-assignment to organization + caregiver role
- [ ] Team list showing all users with role and active status
- [ ] Deactivate caregiver option (preserve notes)

### Day 23: Role-Based UI

- [ ] Caregiver sees: Today view, Residents (read-only profiles), own notes
- [ ] Admin sees: everything + Dashboard, Settings, Team, Billing
- [ ] Hide admin-only features from caregiver navigation
- [ ] Caregiver can only edit own notes (within 1 hour of creation)

### Day 24: Onboarding Wizard

- [ ] First-time admin flow after signup:
  1. Enter facility name, type, timezone
  2. Add first resident (guided form)
  3. Enter first note (with example placeholder)
  4. See structured output — "You're all set!"
- [ ] Empty states throughout the app with helpful CTAs
- [ ] Quick-start guide accessible from settings

### Day 25: Stripe Billing

- [ ] Create Stripe products and prices ($149/month)
- [ ] Implement trial logic: 14-day free trial on signup
- [ ] Trial countdown indicator in the app
- [ ] Stripe Checkout session for subscribing
- [ ] Stripe Customer Portal for managing subscription
- [ ] Webhook handler:
  - `checkout.session.completed` → activate subscription
  - `invoice.payment_failed` → mark as past_due
  - `customer.subscription.deleted` → mark as canceled
- [ ] Access restriction for past_due/canceled (read-only mode)

### Day 26: Security Hardening

- [ ] Review all RLS policies (test with different roles)
- [ ] Input sanitization on all API routes
- [ ] Rate limiting on Claude API calls and auth endpoints
- [ ] CORS configuration (production domain only)
- [ ] Verify environment variables are not exposed client-side
- [ ] Test for common vulnerabilities (XSS, SQL injection via user input)

### Day 27: Legal and Compliance Documents

- [ ] Privacy policy page (use template, customize for healthcare)
- [ ] Terms of service page
- [ ] Data handling disclosure for facilities
- [ ] Cookie policy (minimal — no tracking cookies in V1)
- [ ] Links in footer and signup flow

### Day 28: Monitoring and Observability

- [ ] Sentry error tracking configured for production
- [ ] Vercel Analytics enabled
- [ ] Claude API usage tracking (tokens per facility per day)
- [ ] Email delivery monitoring (Resend dashboard)
- [ ] Set up alerts for: API errors > 5/hour, Claude failures, email bounces

### Day 29: Bug Fixes and Testing

- [ ] End-to-end testing of all flows on mobile and desktop:
  - Signup → onboarding → add resident → enter note → see structured output
  - Incident detection → report → admin review
  - Family update generation → edit → send → email received
  - Weekly summary → review → approve
  - Invite caregiver → caregiver signs up → enters notes
  - Billing: trial → subscribe → manage subscription
- [ ] Fix all bugs found
- [ ] Performance testing: page loads, Claude response times

### Day 30: Launch to Design Partners

- [ ] Production deploy to Vercel
- [ ] DNS configuration for custom domain
- [ ] Create accounts for 3–5 design partner facilities
- [ ] Send onboarding email to each partner with:
  - Login link
  - Quick-start guide
  - Feedback channel (email, text, or scheduled weekly call)
- [ ] Monitor first notes coming in
- [ ] Celebrate shipping

**Week 4 Deliverable:** Production app with billing, onboarding, role-based access, and 3–5 active design partner facilities.

---

## Post-Launch Priorities (Days 31–60)

| Priority | Task | Trigger |
|----------|------|---------|
| 1 | Sign Anthropic and Supabase BAAs | **BLOCKER** — before first paying customer |
| 1a | Sign OpenAI BAA for Whisper API | **BLOCKER** — before voice feature goes live with real PHI |
| 1b | Resolve Vercel BAA gap (Enterprise, Railway, or self-host) | **BLOCKER** — decision needed by month 2, resolved by month 3 |
| 2 | Fix top 3 usability issues from pilot feedback | Week 1 feedback calls |
| 3 | Add audit logging (`audit_log` table per doc 10) | Before scaling beyond pilots |
| 4 | Iterate on voice input based on pilot feedback | If pilot caregivers report transcription issues |
| 5 | Create 3 case studies from pilot partners | Before Synkwise outreach (month 6) |
| 6 | Test $99/month entry tier | If trial conversion < 30% at month 3 |
| 7 | SMS delivery for family updates (Twilio) | If families request it |
| 8 | Print/export view for survey preparation | If pilots flag survey prep as a use case |
| 9 | Multi-language input documentation | If pilots have multilingual staff |

---

## Risk Mitigation During Build

| Risk | Mitigation |
|------|-----------|
| Week 1 takes longer than expected | Cut onboarding wizard (Day 24) — add it post-launch |
| Claude quality insufficient | Test with real-world examples early (Day 8). Switch prompts aggressively. |
| Stripe integration complications | Use Stripe Checkout (minimal code) instead of custom billing UI |
| Scope creep | Refer to this plan daily. If it's not on this list, it waits for post-launch. |
| Burnout (solo founder, 30-day sprint) | Take Sunday afternoons off. Ship imperfect over skipping sleep. |
| Voice transcription quality in noisy environments | Use Whisper API (not Web Speech API) from day one; Whisper handles care home noise and accented English significantly better |
