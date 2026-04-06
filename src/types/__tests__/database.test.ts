import { describe, it, expect } from "vitest";
import type {
  Organization,
  User,
  Resident,
  Note,
  IncidentReport,
  FamilyCommunication,
  WeeklySummary,
} from "../database";
import {
  mockOrganization,
  mockAdminUser,
  mockResident,
  mockNote,
  mockIncidentReport,
} from "@/test/fixtures";

describe("Database types", () => {
  it("Organization type matches fixture", () => {
    const org: Organization = mockOrganization;
    expect(org.id).toBeDefined();
    expect(org.name).toBe("Sunrise Senior Care");
    expect(org.type).toBe("rcfe");
    expect(["trial", "active", "past_due", "canceled"]).toContain(
      org.subscription_status
    );
  });

  it("User type has required fields", () => {
    const user: User = mockAdminUser;
    expect(user.organization_id).toBeDefined();
    expect(user.role).toBe("admin");
    expect(["admin", "caregiver"]).toContain(user.role);
  });

  it("Resident type has required fields", () => {
    const resident: Resident = mockResident;
    expect(resident.first_name).toBeDefined();
    expect(resident.last_name).toBeDefined();
    expect(resident.organization_id).toBeDefined();
    expect(["active", "discharged", "deceased"]).toContain(resident.status);
  });

  it("Note type has structuring fields", () => {
    const note: Note = mockNote;
    expect(note.raw_input).toBeDefined();
    expect(typeof note.is_structured).toBe("boolean");
    expect(typeof note.flagged_as_incident).toBe("boolean");
    expect(typeof note.manually_flagged).toBe("boolean");
    expect(note.metadata).toBeDefined();
  });

  it("Note type supports unstructured state", () => {
    const pendingNote: Note = {
      ...mockNote,
      is_structured: false,
      structured_output: null,
      structuring_error: "API timeout",
      last_structuring_attempt_at: "2026-04-05T12:00:00Z",
    };
    expect(pendingNote.is_structured).toBe(false);
    expect(pendingNote.structuring_error).toBe("API timeout");
  });

  it("IncidentReport type has review fields", () => {
    const report: IncidentReport = mockIncidentReport;
    expect(report.note_id).toBeDefined();
    expect(["low", "medium", "high"]).toContain(report.severity);
    expect(["open", "reviewed", "closed"]).toContain(report.status);
    // New fields from doc review
    expect(report.reviewed_at).toBeNull();
    expect(report.family_notified_at).toBeNull();
  });

  it("FamilyCommunication type has required fields", () => {
    const comm: FamilyCommunication = {
      id: "comm-1",
      organization_id: "org-1",
      resident_id: "resident-1",
      generated_by: "user-admin-1",
      recipient_contact_id: "contact-1",
      subject: "Update on Dorothy",
      body: "Dorothy had a great week...",
      source_note_ids: ["note-1"],
      date_range_start: "2026-03-29",
      date_range_end: "2026-04-05",
      status: "draft",
      sent_at: null,
      created_at: "2026-04-05T12:00:00Z",
    };
    expect(["draft", "sent", "failed"]).toContain(comm.status);
  });

  it("WeeklySummary type has required fields", () => {
    const summary: WeeklySummary = {
      id: "summary-1",
      organization_id: "org-1",
      resident_id: "resident-1",
      week_start: "2026-03-30",
      week_end: "2026-04-05",
      summary_text: "Weekly summary...",
      key_trends: ["Improved appetite"],
      concerns: [],
      incidents_count: 0,
      source_note_ids: ["note-1"],
      status: "pending_review",
      reviewed_by: null,
      reviewed_at: null,
      metadata: {},
      created_at: "2026-04-05T18:00:00Z",
      updated_at: "2026-04-05T18:00:00Z",
    };
    expect(["pending_review", "approved", "regenerating"]).toContain(
      summary.status
    );
  });
});
