# Entity Model, Roles & Auth — Current State + Recommendations

Investigated 2026-04-17. Documents how the app currently works, what the landing page role selection actually does, and what needs to change.

---

## Current State

### The landing page role selection is a DEMO — it doesn't create accounts

When a visitor clicks "Continue as Caretaker" or "Continue as Doctor" on the landing page:
1. It opens a `ConsultModal` with **hardcoded fake data** (no real AI, no real recording)
2. It shows a simulated transcript and a simulated structured note
3. **Nothing is saved, no account is created, no real API is called**
4. The modal is purely a proof-of-concept to show what the product does

The "Doctor" role **does not exist in the database**. The only roles are:
- `admin` — manages the facility, team, residents, billing
- `caregiver` — creates notes, uses voice calls, views residents

### How account creation actually works

1. User goes to `/signup`
2. Fills in: full name, email, password, facility name, facility type, timezone
3. A database trigger (`handle_new_user`) auto-creates:
   - An **Organization** (the facility)
   - A **User** record with role `admin`
4. That admin can then invite caregivers via `/team` → team management page
5. Invited caregivers get their own login but belong to the same organization

### Entity Relationship Map

```
Organization (facility)
├── Users (staff)
│   ├── admin — manages everything
│   └── caregiver — creates notes, uses voice calls
│
├── Residents (patients/residents)
│   ├── Notes (shift notes, observations, incidents)
│   │   ├── structured by Claude AI
│   │   ├── authored by a caregiver or admin
│   │   └── linked to voice_sessions if created via voice call
│   │
│   ├── Family Contacts (next-of-kin)
│   │   └── Family Communications (AI-generated updates sent via email)
│   │
│   ├── Incident Reports (escalated from flagged notes)
│   │   └── reviewed by admin
│   │
│   ├── Weekly Summaries (AI-generated weekly rollups)
│   │
│   └── Voice Sessions (Vapi call records)
│       └── Voice Transcripts (turn-by-turn conversation)
│
└── Billing (Stripe subscription)
```

### Who can do what (current)

| Action | Admin | Caregiver |
|--------|-------|-----------|
| View residents | Yes | Yes |
| Add/edit residents | Yes | No |
| Create notes (text or voice) | Yes | Yes |
| Edit own notes (within 1 hour) | Yes | Yes |
| Edit any note (any time) | Yes | No |
| View incidents | Yes | No |
| Review incidents | Yes | No |
| Send family updates | Yes | No |
| Manage team (invite/remove) | Yes | No |
| Billing/settings | Yes | No |
| View voice sessions | Yes | Yes |

### Where are doctors in this?

**Nowhere.** The current model is designed for Residential Care Facilities for the Elderly (RCFE), where:
- An **admin** (facility owner/manager) oversees operations
- **Caregivers** (direct care staff) document daily observations
- **Residents** receive care
- **Families** receive updates
- **Doctors** are external — they visit or the resident goes to them

Doctors are not users of the system in the current model. They receive information indirectly (through family or facility admin coordination, not through the app).

---

## Questions to Decide

### 1. Should the landing page role selection create accounts?

**Recommendation: Yes, but differently.**

Current flow (broken):
```
Landing → Select Role → Fake Demo Modal → Dead end
```

Proposed flow:
```
Landing → Select Role → Sign Up (pre-filled with role context) → Dashboard
```

Or keep the demo modal but add a clear CTA at the end:
```
Landing → Select Role → Demo Modal → "Ready to try for real? Sign up" → /signup
```

### 2. Should doctors have accounts?

**It depends on the product vision.** Three options:

**Option A — Doctors stay external (current model, simplest)**
- Kinroster is a caregiver tool, not a clinical platform
- Admin can export/email relevant notes to a doctor manually
- No code changes needed
- Best for: RCFE-focused MVP

**Option B — Doctors get read-only access**
- Add a `doctor` role to the database
- Doctors can view residents and notes but not create them
- Doctors might be linked to multiple organizations (e.g., a visiting physician serves 3 facilities)
- Requires: new role, possibly cross-org access model, doctor-resident linking table
- Best for: facilities where doctors want to check in on residents remotely

**Option C — Doctors are first-class users with their own workflows**
- Doctors create clinical assessments, treatment plans, prescriptions
- Separate note types: `clinical_assessment`, `treatment_plan`
- Doctor ↔ caregiver messaging or handoff notes
- Requires: significant new schema, UI, and AI prompts
- Best for: home healthcare agencies where doctors actively manage care

**Recommendation for MVP:** Option A. Keep doctors external. The landing page "Doctor" role can become a separate product tier or waitlist. Don't build multi-role complexity before validating with caregivers.

### 3. Should the app support Google SSO?

**Recommendation: Yes, add it.**

Benefits:
- Caregivers in facilities often share devices — Google login is faster than remembering passwords
- Reduces password reset support burden
- Supabase supports Google OAuth natively (just needs config)

Implementation:
1. Create OAuth credentials in Google Cloud Console
2. Add credentials to Supabase dashboard → Authentication → Providers → Google
3. Add a "Sign in with Google" button to login/signup pages
4. Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Supabase-side, not app-side)

Effort: ~2 hours (mostly Google Cloud Console + Supabase config)

### 4. How should communication flow between entities?

Current flow:
```
Caregiver → (voice/text) → Note → Claude structures it
                                → Incident? → Admin reviews → Incident Report
                                → Family update? → Admin generates → Email to family
                                → Weekly summary? → Auto-generated → Admin approves
```

Missing flows that might matter:
```
Doctor → views resident notes (Option B)
Family → views resident updates in a portal (not built, emails only)
Caregiver → Caregiver shift handoff (partially covered by "next shift" in notes)
```

---

## Action Items

### Immediate (before sharing production URL)

- [ ] **Fix landing page flow:** Either make role selection lead to signup, or add a clear "Sign up to try for real" CTA after the demo modal
- [ ] **Remove or relabel "Doctor" on landing page** if not implementing doctor accounts — replace with "Healthcare Professional" or "Facility Manager" to match the admin role
- [ ] **Decide on doctor role** — Option A, B, or C (recommendation: A for MVP)

### Short-term (1-2 days)

- [ ] **Add Google SSO** — configure in Supabase + add button to login/signup
- [ ] **Update ConsultModal** — either wire to real Vapi demo or add signup CTA at the end
- [ ] **Add role selection to signup** if supporting multiple roles (admin vs caregiver self-signup)

### Medium-term (if pursuing Option B for doctors)

- [ ] Add `doctor` to user role CHECK constraint
- [ ] Create doctor-resident linking table (many-to-many — a doctor serves multiple residents across orgs)
- [ ] Doctor-specific dashboard with read-only patient views
- [ ] Doctor invitation flow (admin invites doctor to view specific residents)
- [ ] Update RLS policies for cross-org doctor access

---

## Database Schema Changes Needed (by option)

### Option A (doctors external) — no schema changes

### Option B (doctors read-only)
```sql
-- Add doctor role
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'caregiver', 'doctor'));

-- Doctor-resident access (many-to-many, cross-org)
CREATE TABLE doctor_residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, resident_id)
);
ALTER TABLE doctor_residents ENABLE ROW LEVEL SECURITY;
```

### Google SSO — no schema changes (Supabase handles OAuth mapping to auth.users)
