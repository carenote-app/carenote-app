# CareNote — Data Model

## Overview

CareNote's data model is designed around seven core entities: Organizations, Users, Residents, Notes, Incident Reports, Family Communications, and Weekly Summaries. All data is scoped to an organization and protected by Row Level Security (RLS).

The raw caregiver input is always stored alongside the AI-structured output. The caregiver's words are the legal source of truth; the structured output is a convenience layer.

---

## Entity Relationship Diagram

```
┌──────────────────┐
│   organization   │
│──────────────────│
│ id (PK)          │
│ name             │
│ type             │
│ timezone         │
│ email_from_name  │
│ email_reply_to   │
│ subscription_*   │
│ stripe_*         │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:many
         │
    ┌────▼────────────┐          ┌────────────────────┐
    │     user         │          │     resident        │
    │─────────────────│          │────────────────────│
    │ id (PK)          │          │ id (PK)             │
    │ organization_id  │◄────────►│ organization_id     │
    │ email            │          │ first_name          │
    │ full_name        │          │ last_name           │
    │ role             │          │ date_of_birth       │
    │ is_active        │          │ move_in_date        │
    │ created_at       │          │ room_number         │
    └────────┬─────────┘          │ conditions          │
             │                    │ preferences         │
             │                    │ care_notes_context   │
             │                    │ status              │
             │                    │ created_at          │
             │                    └──┬────┬────┬────────┘
             │                       │    │    │
             │                       │    │    │  1:many
             │                       │    │    │
             │                       │    │ ┌──▼──────────────────┐
             │                       │    │ │  weekly_summary      │
             │                       │    │ │─────────────────────│
             │                       │    │ │ id (PK)              │
             │                       │    │ │ organization_id      │
             │                       │    │ │ resident_id          │
             │                       │    │ │ week_start/end       │
             │                       │    │ │ summary_text         │
             │                       │    │ │ key_trends[]         │
             │                       │    │ │ concerns[]           │
             │                       │    │ │ status               │
             │                       │    │ │ reviewed_by          │
             │                       │    │ │ created_at           │
             │                       │    │ └─────────────────────┘
             │                       │    │
             │              1:many   │    │  1:many
             │                       │    │
             │            ┌──────────▼──┐  ┌───▼─────────────────┐
             │            │family_contact│  │       note           │
             │            │─────────────│  │─────────────────────│
             │            │ id (PK)     │  │ id (PK)              │
             │            │ resident_id │  │ organization_id      │
             │            │ name        │  │ resident_id          │
             │            │ relationship│  │ author_id ◄──────────┤
             │            │ email       │  │ note_type            │  user writes
             │            │ phone       │  │ raw_input            │  notes
             │            │ is_primary  │  │ structured_output    │
             │            │ receives_   │  │ is_structured        │
             │            │  updates    │  │ is_edited            │
             │            │ created_at  │  │ shift                │
             │            └──────┬──────┘  │ flagged_as_incident  │
             │                   │         │ manually_flagged     │
             │                   │         │ metadata (jsonb)     │
             │                   │         │ created_at           │
             │                   │         └───┬─────────────────┘
             │                   │             │
             │                   │             │  1:0..1
             │                   │             │
             │                   │         ┌───▼─────────────────┐
             │                   │         │  incident_report     │
             │                   │         │─────────────────────│
             │                   │         │ id (PK)              │
             │                   │         │ note_id (FK → note)  │
             │                   │         │ organization_id      │
             │                   │         │ resident_id          │
             │                   │         │ report_text          │
             │                   │         │ severity             │
             │                   │         │ status               │
             │                   │         │ reviewed_by          │
             │                   │         │ reviewed_at          │
             │                   │         │ family_notified      │
             │                   │         │ family_notified_at   │
             │                   │         │ follow_up_date       │
             │                   │         │ created_at           │
             │                   │         │ updated_at           │
             │                   │         └─────────────────────┘
             │                   │
             │              ┌────▼──────────────────┐
             └──────────────►  family_communication  │
              user sends    │───────────────────────│
              family comms  │ id (PK)                │
                            │ organization_id        │
                            │ resident_id            │
                            │ generated_by (FK→user) │
                            │ recipient_contact_id   │
                            │ subject                │
                            │ body                   │
                            │ source_note_ids (uuid[])│
                            │ date_range_start       │
                            │ date_range_end         │
                            │ status                 │
                            │ sent_at                │
                            │ created_at             │
                            └────────────────────────┘
```

---

## Table Definitions

### organizations

The top-level entity. Every facility is an organization.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rcfe', 'home_care', 'other')),
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  email_from_name TEXT,
  email_reply_to TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

### users

Application users (caregivers and admins). Linked to Supabase Auth via `id`.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'caregiver' CHECK (role IN ('admin', 'caregiver')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_users_org ON users (organization_id);
```

### residents

People receiving care at the facility.

```sql
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  move_in_date DATE,
  room_number TEXT,
  conditions TEXT,                    -- Free text: "dementia, diabetes, limited mobility"
  preferences TEXT,                   -- Free text: "likes morning walks, prefers tea"
  care_notes_context TEXT,            -- Persistent context sent to Claude with every note
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'discharged', 'deceased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_residents_org ON residents (organization_id);
CREATE INDEX idx_residents_org_status ON residents (organization_id, status);
```

### family_contacts

Family members or emergency contacts associated with a resident.

```sql
CREATE TABLE family_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,         -- "Daughter", "Son", "Spouse"
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  receives_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_family_contacts_resident ON family_contacts (resident_id);
```

### notes

The core table. Stores every caregiver observation with both raw input and structured output.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  note_type TEXT NOT NULL CHECK (note_type IN ('shift_note', 'incident', 'observation', 'summary')),
  raw_input TEXT NOT NULL,            -- Original caregiver text (source of truth)
  structured_output TEXT,             -- Claude-generated structured version
  is_structured BOOLEAN NOT NULL DEFAULT false, -- False until Claude processes successfully
  structuring_error TEXT,             -- Error message if Claude structuring failed
  last_structuring_attempt_at TIMESTAMPTZ, -- For retry backoff
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_output TEXT,                 -- Caregiver's edited version of structured output
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night')),
  flagged_as_incident BOOLEAN NOT NULL DEFAULT false,
  manually_flagged BOOLEAN NOT NULL DEFAULT false, -- True if caregiver manually flagged (vs AI)
  metadata JSONB DEFAULT '{}',        -- Extracted tags: mood, appetite, activities, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notes_resident_created ON notes (resident_id, created_at DESC);
CREATE INDEX idx_notes_org_created ON notes (organization_id, created_at DESC);
CREATE INDEX idx_notes_author ON notes (author_id, created_at DESC);
CREATE INDEX idx_notes_org_type ON notes (organization_id, note_type);
```

### incident_reports

Formal incident documentation linked to a source note.

```sql
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL,           -- Full structured incident report
  incident_type TEXT NOT NULL,         -- fall, near_fall, medication, behavioral, injury, other
  severity TEXT NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'closed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,            -- When admin reviewed the incident
  manager_notes TEXT,
  family_notified BOOLEAN NOT NULL DEFAULT false,
  family_notified_at TIMESTAMPTZ,     -- When family was notified
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_incidents_org_status ON incident_reports (organization_id, status);
CREATE INDEX idx_incidents_resident ON incident_reports (resident_id, created_at DESC);
```

### family_communications

Record of every family update sent from the platform.

```sql
CREATE TABLE family_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id),
  recipient_contact_id UUID NOT NULL REFERENCES family_contacts(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  source_note_ids UUID[] DEFAULT '{}', -- Array of note IDs used to generate this update
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_communications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_family_comms_resident ON family_communications (resident_id, created_at DESC);
CREATE INDEX idx_family_comms_org ON family_communications (organization_id, created_at DESC);
CREATE INDEX idx_family_comms_status ON family_communications (organization_id, status);
```

### weekly_summaries

Auto-generated weekly care summaries for each resident, reviewed by admins.

```sql
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,           -- Monday of the summary week
  week_end DATE NOT NULL,             -- Sunday of the summary week
  summary_text TEXT NOT NULL,         -- Claude-generated summary content
  key_trends TEXT[],                  -- Array of identified trends
  concerns TEXT[],                    -- Array of concerns needing follow-up
  incidents_count INTEGER NOT NULL DEFAULT 0,
  source_note_ids UUID[] DEFAULT '{}', -- Notes used to generate this summary
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'regenerating')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',        -- Model used, tokens, generation details
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resident_id, week_start)    -- One summary per resident per week
);

ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_weekly_summaries_org ON weekly_summaries (organization_id, week_start DESC);
CREATE INDEX idx_weekly_summaries_resident ON weekly_summaries (resident_id, week_start DESC);
CREATE INDEX idx_weekly_summaries_status ON weekly_summaries (organization_id, status);
```

---

### Additional Indexes

```sql
-- Notes pending structuring (for retry job)
CREATE INDEX idx_notes_pending_structuring ON notes (is_structured, last_structuring_attempt_at)
  WHERE is_structured = false;

-- Incident-flagged notes
CREATE INDEX idx_notes_flagged ON notes (organization_id, created_at DESC)
  WHERE flagged_as_incident = true;

-- Open incidents for dashboard
CREATE INDEX idx_incidents_open ON incident_reports (organization_id, created_at DESC)
  WHERE status = 'open';
```

---

## Structured Output Schema (JSONB metadata)

The `metadata` column on notes stores extracted categories for filtering and future analytics:

```typescript
interface NoteMetadata {
  categories: string[];           // ["nutrition", "mood", "mobility"]
  flags: Array<{
    type: string;                 // "pain", "fall_risk", "medication_refusal", etc.
    reason: string;               // Brief explanation from the note
  }>;
  ai_classification: string;     // "routine", "possible_incident", "definite_incident"
  model_used: string;            // "claude-sonnet-4-6"
  tokens_used: {
    input: number;
    output: number;
  };
}
```

This design supports future analytics (Phase 2) without requiring schema changes. Categories and flags are queryable via JSONB operators:

```sql
-- Find all notes mentioning nutrition concerns
SELECT * FROM notes
WHERE metadata->'categories' ? 'nutrition'
AND organization_id = $1;

-- Find all flagged notes
SELECT * FROM notes
WHERE jsonb_array_length(metadata->'flags') > 0
AND organization_id = $1;
```

---

## RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| organizations | Own org only | — (created at signup) | Admin only | — |
| users | Own org only | Admin only (invite) | Admin (any) / Self (own profile) | Admin only |
| residents | Own org only | Admin only | Admin only | Admin only |
| family_contacts | Own org residents | Admin only | Admin only | Admin only |
| notes | Own org only | Any authenticated user in org | Author only (within 1 hour) | — (notes are never deleted) |
| incident_reports | Own org only | Any authenticated user in org | Admin only | — |
| family_communications | Admin only | Admin only | Admin only | — |
| weekly_summaries | Own org only | System (cron job) | Admin only | — |

---

## Data Retention

**V1 policy:** No data is deleted. All notes, reports, and communications are retained indefinitely.

**Future consideration (V1.1+):** Configurable retention policies per organization for compliance with state-specific requirements. Some states require 3-year retention, others 7 years.

---

## Migration Strategy

Migrations are managed via Supabase CLI:

```bash
supabase migration new create_organizations
supabase migration new create_users
supabase migration new create_residents
supabase migration new create_notes
supabase migration new create_incidents
supabase migration new create_family_comms
supabase migration new create_weekly_summaries
supabase db push                    # Apply to remote
```

Each migration file follows the pattern:
1. Create table
2. Enable RLS immediately
3. Create policies
4. Create indexes

Never separate table creation from RLS enablement.
