# Compliance Gaps — Action Required

Audit of claims made in legal pages (/privacy, /terms, /hipaa, /support) vs actual implementation. Conducted 2026-04-17.

## Status: NOT COMPLIANT

The legal pages make specific claims that are not backed by code. This creates legal liability if real patient data is processed.

---

## Already Implemented (safe to claim)

- [x] Row-Level Security on all tables (org-scoped)
- [x] Organization data isolation (all queries filter by org_id)
- [x] Role-based access control (admin vs caregiver)
- [x] Encryption in transit (TLS via Vercel + Supabase)
- [x] Encryption at rest (Supabase default)
- [x] Password minimum (8 chars on signup)
- [x] AI content review step before note approval
- [x] Third-party disclosure is accurate (Vapi, Claude, Deepgram)

---

## NOT Implemented (claimed in legal pages)

### Critical — must fix before real patient data

| Gap | Claimed in | What's missing | Effort |
|-----|-----------|----------------|--------|
| **Data deletion** | Privacy Policy ("delete within 90 days") | No delete account/data API or UI | 1 day |
| **Data export** | Privacy Policy ("portable copy in machine-readable format") | No export endpoint or download button | 1 day |
| **Audit logging** | HIPAA page ("all access to PHI is logged") | No audit table, no logging middleware, no access tracking | 2-3 days |
| **BAAs with vendors** | HIPAA page ("Business Associate Agreements") | Not signed with Supabase, Vapi, or Anthropic | Admin task (no code) |
| **Vapi HIPAA add-on** | HIPAA page ("voice data encrypted") | HIPAA not enabled in Vapi dashboard (Compliance section) | Admin task (no code) |

### Medium — should fix before production launch

| Gap | Claimed in | What's missing | Effort |
|-----|-----------|----------------|--------|
| **Session timeout** | HIPAA page ("automatic session expiration") | No idle timeout or forced re-auth | Half day |
| **Rate limiting** | Implied by security claims | No rate limiting on any API route | Half day |
| **Input sanitization** | General security | raw_input stored without sanitization | Half day |

### Low — cosmetic / operational

| Gap | Where | What's missing | Effort |
|-----|-------|----------------|--------|
| **support@kinroster.app** | Support page | No domain, no email configured | Needs domain purchase first |
| **Incident response plan** | HIPAA page | Described but no actual runbook exists | 1 day (doc only) |

---

## Two Options

### Option A — Quick Fix (20 minutes)

Tone down legal pages to be aspirational rather than declarative:
- Replace "we do X" with "Kinroster is designed to support X"
- Add banner: "Kinroster is in active development. Contact us before processing real patient data."
- Remove specific claims about audit logging and data deletion until implemented
- Change HIPAA page to "HIPAA-Ready Architecture" instead of "HIPAA Compliance"

### Option B — Build It Out (5-7 days total)

Implement the missing features in priority order:

**Week 1:**
1. `POST /api/account/delete` — soft-delete user + schedule data purge
2. `GET /api/account/export` — JSON export of all user's notes, sessions, residents
3. Audit log table (`audit_events`) + middleware that logs reads/writes to PHI tables
4. Session timeout middleware (re-auth after 30 min idle)

**Week 2:**
5. Rate limiting middleware (e.g., `next-rate-limit` or Vercel Edge middleware)
6. Input sanitization utility for `raw_input` and other text fields
7. Sign BAAs with Supabase (available on Pro plan), Vapi (requires HIPAA add-on purchase), Anthropic (available on request)
8. Enable Vapi HIPAA add-on in dashboard

**Administrative (no code):**
- Purchase domain → set up support@domain email
- Write incident response runbook
- Sign BAAs with all three vendors

---

## Recommendation

Do **Option A now** (before sharing the production URL with anyone) to avoid false compliance claims. Then do **Option B** before any pilot with real patient data.

The RLS + org isolation + encryption foundation is genuinely solid. The gaps are in operational compliance (audit, deletion, export) and vendor agreements (BAAs). These are fixable but shouldn't be claimed until they exist.
