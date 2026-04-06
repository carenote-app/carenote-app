# CareNote — Compliance, Privacy & Security

## Overview

CareNote handles Protected Health Information (PHI) as defined by HIPAA. Resident names combined with health observations constitute PHI. This document outlines the compliance posture for each phase of the product, the specific safeguards in place, and the roadmap to full HIPAA compliance.

---

## HIPAA Applicability

### Is CareNote a Covered Entity or Business Associate?

CareNote is a **Business Associate** — a service provider that handles PHI on behalf of covered entities (the care facilities). This means:

1. CareNote must sign a **Business Associate Agreement (BAA)** with each facility
2. CareNote must ensure its subprocessors (Anthropic, Supabase, Vercel) also have BAAs in place
3. CareNote must implement the HIPAA Security Rule safeguards (administrative, physical, technical)

### Subprocessor BAA Status

| Subprocessor | BAA Available? | Notes |
|-------------|---------------|-------|
| **Anthropic (Claude API)** | Yes — available for API customers | Sign BAA before processing PHI through Claude |
| **Supabase** | Yes — on Pro plan ($25/month) | Sign BAA, enable HIPAA project settings |
| **Vercel** | Limited — available on Enterprise plan | For MVP, evaluate alternatives (see below) |
| **Resend** | Not currently | Low risk — family updates contain minimal PHI |
| **Stripe** | Yes — PCI DSS compliant, BAA available | Stripe handles billing data, not PHI |
| **OpenAI (Whisper API)** | Must verify — BAA available on Enterprise plan; confirm before processing PHI | Audio data constitutes PHI; if BAA unavailable, use Web Speech API as interim (audio never leaves device) |

### MVP Compliance Strategy

**Phase 1 (Months 0–3): Informed Consent Approach**

During the pilot phase with 5–10 design partner facilities:

1. Sign BAAs with Anthropic and Supabase immediately
2. Implement all technical safeguards described in this document
3. Provide each pilot facility with a clear data handling disclosure:
   - What data is collected
   - How it is stored and processed
   - Who has access
   - What AI services are used
4. Obtain informed consent from facility operators
5. Require facilities to inform residents (or their representatives) that AI tools are used for documentation

**Phase 2 (Months 3–6): Full HIPAA Compliance**

1. Complete HIPAA Security Risk Assessment
2. Resolve Vercel BAA gap (options: upgrade to Vercel Enterprise, migrate to AWS/Railway, or self-host)
3. Implement full audit logging
4. Engage a HIPAA compliance consultant for review
5. Obtain third-party security assessment if pursuing enterprise customers

---

## Technical Safeguards

### Data Encryption

| Layer | Method | Status |
|-------|--------|--------|
| Data in transit | TLS 1.2+ (HTTPS everywhere) | Implemented by default |
| Data at rest (database) | AES-256 (Supabase default) | Implemented by default |
| Data at rest (backups) | Encrypted (Supabase Pro) | Requires Pro plan |
| API keys and secrets | Vercel encrypted environment variables | Implemented |

### Access Controls

| Control | Implementation |
|---------|---------------|
| Authentication | Supabase Auth (bcrypt password hashing, JWT tokens) |
| Authorization | Role-based (admin/caregiver) enforced at API layer + RLS |
| Session management | JWT with 1-hour expiry, 30-day refresh tokens |
| Row Level Security | Every table scoped to organization_id via Postgres RLS |
| API route protection | Middleware verifies JWT and role on every request |
| Password requirements | Minimum 8 characters (enforced by Supabase Auth) |

### Data Isolation

| Concern | Safeguard |
|---------|-----------|
| Cross-organization data access | RLS policies prevent any query from returning data outside the user's organization |
| Claude API data isolation | Each API call is stateless — no conversation memory, no fine-tuning on user data, no data retention by Anthropic beyond 30 days |
| Multi-tenant database | Single database with RLS, not shared tables without isolation |

### Audit Logging (V1.1)

V1 stores `created_at` and `updated_at` on all records. V1.1 will add a full audit log:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,           -- create, read, update, delete, send, login
  resource_type TEXT NOT NULL,    -- note, resident, incident, family_communication
  resource_id UUID,
  details JSONB,                  -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## AI-Specific Safety Rules

### What Claude Can Do

| Allowed | Example |
|---------|---------|
| Structure raw text into formatted notes | Reorganize "ate half lunch, seemed tired" into categorized sections |
| Extract and categorize observations | Identify that a note touches nutrition and mood |
| Flag potential safety concerns | Note mentions a fall → flag for manager review |
| Generate professional language from informal input | "grumpy" → "appeared irritable" |
| Synthesize multiple notes into summaries | Combine a week of notes into a weekly overview |
| Translate tone (clinical → family-friendly) | Shift note → warm family email |

### What Claude Cannot Do

| Prohibited | Why | How It's Enforced |
|-----------|-----|-------------------|
| Make medical diagnoses | Liability, regulatory violation | System prompt explicitly prohibits; output is validated |
| Recommend medications or treatments | Not a clinical decision support tool | System prompt explicitly prohibits |
| Add information not in the input | Fabrication risk in a regulated context | System prompt instructs to only use provided information |
| Auto-send communications to families | Human must review and approve | No auto-send feature exists; admin must click "Send" |
| Auto-file incident reports | Human must confirm classification | Incident creation requires caregiver confirmation |
| Access data from other residents | Privacy violation | Each Claude call is scoped to a single resident |
| Store or learn from user data | PHI protection | Anthropic API is stateless; no fine-tuning on user data |

**Voice data handling rule:** Audio recordings of caregiver observations constitute PHI because they may contain resident names and health information spoken aloud. The system is designed so that audio is never stored — it is transmitted to Whisper for transcription and immediately discarded. Only the text transcript is saved. This design choice eliminates audio storage, playback, and retrieval requirements while maintaining full HIPAA compliance for the resulting text record.

### Prompt Injection Defense

| Attack Vector | Mitigation |
|-------------|-----------|
| Caregiver input contains instructions to Claude | Input is wrapped in delimiters (`"""`) and the system prompt explicitly states to treat the content as raw observation text, not instructions |
| Adversarial input attempts to extract system prompt | System prompt instructs Claude to ignore meta-instructions in user content |
| Input attempts to generate harmful content | Output is parsed as JSON; free-text fields are displayed in a controlled UI, not executed |

### Human-in-the-Loop Requirements

Every Claude output must be reviewed by a human before it becomes an official record or is sent externally:

1. **Shift notes:** Caregiver sees structured output and must tap "Save" (can edit first)
2. **Incident reports:** Caregiver reviews generated report and must tap "Save Report"
3. **Family updates:** Admin reviews draft and must tap "Send" (with confirmation dialog)
4. **Weekly summaries:** Admin reviews and must tap "Approve"

There is no path in the application where AI-generated content bypasses human review.

---

## Data Handling Practices

### What Data is Sent to Claude

| Sent to Claude | Not Sent to Claude |
|---------------|-------------------|
| Resident first and last name | Date of birth |
| Care notes context (conditions, preferences) | Social Security number (never collected) |
| Raw caregiver observation text | Family contact information (email, phone) |
| Caregiver name (for attribution) | Billing or financial data |
| Timestamp | Organization settings |
| Previous notes (for summaries/updates) | Other residents' data |

### PII Stripping Option (If BAA Is Unavailable)

If Anthropic BAA is not obtainable, implement PII stripping before Claude API calls:

```
Before sending to Claude:
  "Dorothy" → "[RESIDENT]"
  "Sarah Chen (daughter)" → "[FAMILY_MEMBER]"
  Dates → relative ("yesterday", "this morning")
  Facility name → "[FACILITY]"

After receiving Claude response:
  Re-hydrate: "[RESIDENT]" → "Dorothy"
  "[FAMILY_MEMBER]" → "Sarah Chen"
```

This adds complexity and may reduce output quality. It is a fallback, not the preferred approach.

### Data Retention

| Data Type | Retention Period (V1) | Future Policy |
|-----------|----------------------|---------------|
| Shift notes | Indefinite | Configurable per state requirements (3–7 years) |
| Incident reports | Indefinite | Minimum 7 years (typical regulatory requirement) |
| Family communications | Indefinite | Minimum 3 years |
| User accounts | Until deactivated | 90-day deletion after deactivation request |
| Audit logs | N/A (V1.1) | Minimum 6 years |
| Raw Claude API inputs/outputs | Not stored by Anthropic beyond 30 days | Verify with Anthropic |

### Data Deletion

V1 does not support data deletion (notes are never deleted — they are legal records). V1.1 will support:

- Resident record anonymization (upon discharge + retention period expiry)
- Organization account deletion (upon subscription cancellation + retention period)
- GDPR-style data export (if expanding internationally)

---

## State-Specific Compliance Notes

Documentation requirements vary by state. CareNote should track which state a facility operates in and surface relevant guidance.

| State | Licensing Body | Key Documentation Requirements |
|-------|---------------|-------------------------------|
| California | CDSS Community Care Licensing | Daily personal care logs, incident reports within 24 hours, medication records |
| Washington | DSHS Aging & Long-Term Support | Individualized service plans, daily logs, incident reports |
| Texas | HHSC | Service plans, daily activity records, incident reports within 24 hours |
| Florida | AHCA | Resident records, daily observations, incident reports |
| Oregon | DHS | Service plans, progress notes, incident reports |

**V1 approach:** Do not build state-specific features. The structured note format is general enough to meet most state requirements. Track which state facilities are in for future feature targeting.

---

## Security Incident Response (V1.1)

Documented plan for V1.1:

1. **Detection:** Monitor for unauthorized access via audit logs and Sentry alerts
2. **Containment:** Ability to revoke all sessions for an organization, disable API keys
3. **Notification:** Within 60 days of discovery (HIPAA Breach Notification Rule)
4. **Remediation:** Root cause analysis and fix
5. **Documentation:** Maintain incident log

---

## Compliance Checklist for Launch

| Item | Status | Required By |
|------|--------|-------------|
| Supabase Pro plan with BAA | To do | Before first pilot |
| Anthropic BAA signed | To do | Before first pilot |
| HTTPS everywhere | Default (Vercel) | Day 1 |
| RLS on all tables | To implement | Day 1 |
| Role-based access control | To implement | Week 1 |
| Input validation and sanitization | To implement | Week 2 |
| Rate limiting on API routes | To implement | Week 2 |
| Data handling disclosure for facilities | To draft | Week 4 |
| Privacy policy | To draft | Week 4 |
| Terms of service | To draft | Week 4 |
| Full audit logging | V1.1 | Month 3 |
| HIPAA Security Risk Assessment | V1.1 | Month 3 |
| Vercel BAA or hosting migration | V1.1 | Month 4 |
| Third-party security review | V2 | Month 6 |
