# CareNote — Compliance Action Tracker

**Status Key:** NOT STARTED | IN PROGRESS | DONE | BLOCKED
**Last Updated:** April 2026

---

## Pre-Launch (Before First Design Partner)

These items must be completed before any real resident data enters the system.

| # | Action | Owner | Status | Target Date | Notes |
|---|--------|-------|--------|-------------|-------|
| 1 | **Sign Anthropic BAA** | Founder | NOT STARTED | Before pilot | Request via Anthropic dashboard or sales contact. Required before any PHI is sent to Claude API. |
| 2 | **Sign Supabase BAA** | Founder | NOT STARTED | Before pilot | Available on Pro plan ($25/mo). Enable HIPAA project settings in Supabase dashboard after signing. |
| 3 | **Verify OpenAI Whisper BAA** | Founder | NOT STARTED | Before pilot | Check if BAA is available on current OpenAI plan. If not available: disable voice input for real PHI and use Web Speech API (browser-native) as fallback. |
| 4 | **Upgrade Supabase to Pro plan** | Founder | NOT STARTED | Before pilot | Required for BAA, daily backups, and HIPAA project settings. |
| 5 | **Enable Supabase HIPAA project settings** | Founder | NOT STARTED | After #4 | Supabase dashboard → Project Settings → Enable HIPAA mode. |
| 6 | **Finalize Data Handling Disclosure** | Founder | NOT STARTED | Before pilot | Draft exists (doc 13). Fill in contact info, legal entity name, have a lawyer review. |
| 7 | **Finalize Pilot Partner Agreement** | Founder | NOT STARTED | Before pilot | Draft exists (doc 14). Fill in legal entity info, have a lawyer review. |
| 8 | **Create Resident Notification Template** | Founder | NOT STARTED | Before pilot | Template exists (doc 15). Share with pilot partners for customization. |
| 9 | **Implement RLS on all tables** | Founder | NOT STARTED | Build Week 1 | Row Level Security policies per doc 08. Test with both admin and caregiver roles. |
| 10 | **Implement role-based access control** | Founder | NOT STARTED | Build Week 4 | API middleware enforcing admin vs. caregiver permissions. |
| 11 | **Set up encrypted environment variables** | Founder | NOT STARTED | Build Week 1 | All API keys and secrets in Vercel environment variables. Never in code. |
| 12 | **Verify HTTPS on all endpoints** | Founder | NOT STARTED | Build Week 1 | Vercel defaults to HTTPS. Verify no mixed content. |
| 13 | **Confirm audio is never stored** | Founder | NOT STARTED | Build Week 2 | Test voice transcription flow end-to-end. Verify no audio in DB, storage, temp files, or logs. |

---

## At Launch (When Design Partners Start Using the App)

| # | Action | Owner | Status | Target Date | Notes |
|---|--------|-------|--------|-------------|-------|
| 14 | **Sign Pilot Partner Agreement with each facility** | Founder | NOT STARTED | Day 30 | One signed copy per facility. Store securely. |
| 15 | **Provide Data Handling Disclosure to each facility** | Founder | NOT STARTED | Day 30 | Accompany the partner agreement. |
| 16 | **Confirm each facility will notify residents** | Founder | NOT STARTED | Day 30 | Provide the template (doc 15). Ask for confirmation that residents were notified. |
| 17 | **Confirm input sanitization on all API routes** | Founder | NOT STARTED | Build Week 4 | Prevent XSS, SQL injection, and prompt injection via user input. |
| 18 | **Confirm rate limiting on API routes** | Founder | NOT STARTED | Build Week 4 | Prevent abuse of Claude API and auth endpoints. |
| 19 | **Confirm CORS configured for production domain only** | Founder | NOT STARTED | Build Week 4 | No wildcard CORS in production. |
| 20 | **Verify no environment variables exposed to client** | Founder | NOT STARTED | Build Week 4 | Only `NEXT_PUBLIC_*` variables should be accessible client-side. Service keys must never reach the browser. |

---

## Month 1–3 (Post-Launch)

| # | Action | Owner | Status | Target Date | Notes |
|---|--------|-------|--------|-------------|-------|
| 21 | **Implement full audit logging** | Founder | NOT STARTED | Month 3 | Log: who accessed what resource, when, from what IP. See audit_log table spec in doc 10. |
| 22 | **Evaluate Vercel BAA gap** | Founder | NOT STARTED | Month 2 | Options: (a) Upgrade to Vercel Enterprise, (b) Migrate to Railway/AWS with BAA, (c) Self-host. Decision needed by month 3. |
| 23 | **Draft Privacy Policy** | Founder + Lawyer | NOT STARTED | Month 1 | Publish on app. Must cover: data collected, purpose, AI usage, third parties, retention, user rights. |
| 24 | **Draft Terms of Service** | Founder + Lawyer | NOT STARTED | Month 1 | Publish on app. Must cover: acceptable use, liability, service availability, termination. |
| 25 | **Set up monitoring and alerts** | Founder | NOT STARTED | Month 1 | Sentry (or alternative) for errors. Alerts for: API error spikes, Claude failures, email bounces, unusual access patterns. |
| 26 | **Track Claude API usage per facility** | Founder | NOT STARTED | Month 1 | Monitor token consumption. Detect anomalies (sudden spikes may indicate abuse or runaway loops). |
| 27 | **Establish data export process** | Founder | NOT STARTED | Month 2 | Be able to fulfill data export requests within 5 business days (per Data Handling Disclosure commitment). |
| 28 | **Review and update prompts based on pilot feedback** | Founder | NOT STARTED | Month 2 | Run regression tests before deploying any prompt changes. Track acceptance rate (target: 70%+ notes saved without edits). |

---

## Month 3–6 (Formal Compliance)

| # | Action | Owner | Status | Target Date | Notes |
|---|--------|-------|--------|-------------|-------|
| 29 | **Complete HIPAA Security Risk Assessment** | Founder + Consultant | NOT STARTED | Month 3 | Document: what PHI you hold, where it flows, threats, controls, residual risks. This is required by the HIPAA Security Rule. |
| 30 | **Resolve Vercel BAA gap** | Founder | NOT STARTED | Month 4 | Must have a hosting solution with a BAA before scaling beyond design partners. |
| 31 | **Engage HIPAA compliance consultant** | Founder | NOT STARTED | Month 3 | Get a professional review of technical safeguards, policies, and procedures. Budget: $3,000–$10,000 for initial assessment. |
| 32 | **Create Business Associate Agreement template** | Founder + Lawyer | NOT STARTED | Month 3 | Your own BAA to sign with paying facilities (you are their Business Associate). |
| 33 | **Implement data retention policies** | Founder | NOT STARTED | Month 4 | Per state requirements (typically 3–7 years for care documentation). |
| 34 | **Implement account deletion / data anonymization** | Founder | NOT STARTED | Month 5 | Ability to anonymize resident records after discharge + retention period. Ability to delete org data after cancellation + retention period. |
| 35 | **Create incident response plan** | Founder | NOT STARTED | Month 4 | Documented procedure for: detection, containment, notification (60-day HIPAA window), remediation, post-mortem. |
| 36 | **Conduct third-party security assessment** | Founder + Vendor | NOT STARTED | Month 6 | Penetration testing or security audit. Required if pursuing enterprise or government customers. Budget: $5,000–$20,000. |

---

## Ongoing (Every Quarter)

| Action | Frequency | Notes |
|--------|-----------|-------|
| Review and update RLS policies | Quarterly | Especially after schema changes or new features |
| Review subprocessor BAA status | Quarterly | Providers change their terms; verify BAAs remain valid |
| Run prompt regression test suite | Before each prompt change | 50 test cases per doc 09 |
| Review access logs for anomalies | Monthly (after audit logging is live) | Look for unusual access patterns |
| Update Data Handling Disclosure if data practices change | As needed | 14-day advance notice to partners |
| Review and rotate API keys | Quarterly | Anthropic, OpenAI, Resend, Stripe |
| Verify backups are running | Monthly | Supabase dashboard → confirm daily backups active |
| Test data export process | Quarterly | Run a test export to verify it works within 5-day SLA |

---

## Cost Estimates for Compliance

| Item | Estimated Cost | When |
|------|---------------|------|
| Supabase Pro plan | $25/month | Before pilot |
| Lawyer review of disclosure + agreement | $500–$2,000 | Before pilot |
| HIPAA compliance consultant | $3,000–$10,000 | Month 3 |
| Vercel Enterprise (if chosen) | $1,000+/month | Month 4 |
| Alternative hosting with BAA (Railway/AWS) | $50–$200/month | Month 4 (if not Vercel Enterprise) |
| Third-party security assessment | $5,000–$20,000 | Month 6 |
| Ongoing legal review | $1,000–$3,000/year | Annually |
| Your own BAA template (lawyer-drafted) | $500–$1,500 | Month 3 |

**Total pre-pilot legal costs:** ~$500–$2,000
**Total first-year compliance costs:** ~$10,000–$35,000

---

## Key Contacts

| Role | Name | Contact |
|------|------|---------|
| CareNote Founder | [NAME] | [EMAIL / PHONE] |
| Legal Counsel | [NAME] | [EMAIL / PHONE] |
| HIPAA Compliance Consultant | TBD | TBD |
| Anthropic Account Contact | TBD | TBD |
| Supabase Account Contact | TBD | TBD |
