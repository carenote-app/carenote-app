import type {
  Organization,
  User,
  Resident,
  FamilyContact,
  Note,
  IncidentReport,
} from "@/types/database";

export const mockOrganization: Organization = {
  id: "org-1",
  name: "Sunrise Senior Care",
  type: "rcfe",
  timezone: "America/Los_Angeles",
  email_from_name: "Sunrise Senior Care",
  email_reply_to: "care@sunrise.com",
  subscription_status: "active",
  trial_ends_at: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  settings: {},
  bed_count: 8,
  subscription_tier: "small",
  billing_emails_sent: {},
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const mockAdminUser: User = {
  id: "user-admin-1",
  organization_id: "org-1",
  email: "maria@sunrise.com",
  full_name: "Maria Santos",
  role: "admin",
  is_active: true,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const mockCaregiverUser: User = {
  id: "user-cg-1",
  organization_id: "org-1",
  email: "james@sunrise.com",
  full_name: "James Wilson",
  role: "caregiver",
  is_active: true,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const mockResident: Resident = {
  id: "resident-1",
  organization_id: "org-1",
  first_name: "Dorothy",
  last_name: "Chen",
  date_of_birth: "1940-03-15",
  move_in_date: "2025-01-10",
  room_number: "3A",
  conditions: "dementia, diabetes",
  preferences: "likes morning walks, prefers tea",
  care_notes_context:
    "Dorothy responds well to outdoor activities. Her daughter Sarah calls daily around 11 AM.",
  status: "active",
  created_at: "2026-01-10T00:00:00Z",
  updated_at: "2026-01-10T00:00:00Z",
};

export const mockFamilyContact: FamilyContact = {
  id: "contact-1",
  resident_id: "resident-1",
  name: "Sarah Chen",
  relationship: "Daughter",
  email: "sarah@example.com",
  phone: "(555) 123-4567",
  is_primary: true,
  receives_updates: true,
  involved_in_care: true,
  personal_representative: false,
  authorization_on_file: false,
  authorization_scope: [],
  communication_channels: ["email"],
  authorization_start_date: null,
  authorization_end_date: null,
  revoked_at: null,
  revocation_reason: null,
  confidential_communication_notes: null,
  created_at: "2026-01-10T00:00:00Z",
};

export const mockNote: Note = {
  id: "note-1",
  organization_id: "org-1",
  resident_id: "resident-1",
  author_id: "user-cg-1",
  note_type: "shift_note",
  raw_input:
    "dorothy was in good spirits today, ate all her lunch, went for a walk in the garden",
  structured_output: JSON.stringify({
    summary:
      "Dorothy had a positive day with good appetite and outdoor activity.",
    sections: {
      "Mood & Behavior":
        "Dorothy was in good spirits throughout the day.",
      Nutrition: "Ate all of her lunch.",
      Mobility: "Went for a walk in the garden.",
    },
    follow_up: "None noted.",
    flags: [],
  }),
  is_structured: true,
  structuring_error: null,
  last_structuring_attempt_at: "2026-04-05T12:00:00Z",
  is_edited: false,
  edited_output: null,
  shift: "morning",
  flagged_as_incident: false,
  manually_flagged: false,
  sensitive_flag: false,
  sensitive_category: null,
  metadata: {
    categories: ["mood", "nutrition", "mobility"],
    flags: [],
    ai_classification: "routine",
    model_used: "claude-sonnet-4-6",
    tokens_used: { input: 250, output: 180 },
  },
  created_at: "2026-04-05T12:00:00Z",
  updated_at: "2026-04-05T12:00:00Z",
};

export const mockIncidentNote: Note = {
  ...mockNote,
  id: "note-2",
  raw_input:
    "dorothy slipped getting out of bed, grabbed the rail, didnt fall. no injuries but she seemed shaken",
  structured_output: JSON.stringify({
    summary:
      "Dorothy had a near-fall while getting out of bed but caught herself on the bedrail.",
    sections: {
      "Mood & Behavior":
        "Dorothy appeared shaken after the incident.",
      Mobility:
        "Near-fall while getting out of bed. She grabbed the bedrail to steady herself.",
    },
    follow_up: "Monitor mobility and assess need for additional bed supports.",
    flags: [
      {
        type: "fall_risk",
        reason: "Near-fall event getting out of bed",
      },
    ],
  }),
  is_structured: true,
  flagged_as_incident: true,
  metadata: {
    categories: ["mobility", "mood"],
    flags: [
      { type: "fall_risk", reason: "Near-fall event getting out of bed" },
    ],
    ai_classification: "possible_incident",
    model_used: "claude-sonnet-4-6",
    tokens_used: { input: 280, output: 200 },
  },
};

export const mockIncidentReport: IncidentReport = {
  id: "incident-1",
  note_id: "note-2",
  organization_id: "org-1",
  resident_id: "resident-1",
  report_text: "Near-fall incident report...",
  incident_type: "near_fall",
  severity: "medium",
  status: "open",
  reviewed_by: null,
  reviewed_at: null,
  manager_notes: null,
  family_notified: false,
  family_notified_at: null,
  follow_up_date: "2026-04-07",
  created_at: "2026-04-05T12:00:00Z",
  updated_at: "2026-04-05T12:00:00Z",
};
