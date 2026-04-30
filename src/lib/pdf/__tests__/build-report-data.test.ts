import { describe, it, expect } from "vitest";
import {
  buildReportData,
  type RawNoteRow,
  type RawReportInputs,
} from "../build-report-data";

const baseResident = {
  first_name: "Dorothy",
  last_name: "Chen",
  room_number: "3A",
  date_of_birth: "1940-03-15",
  conditions: "dementia",
  preferences: "morning walks",
  status: "active",
};

const baseInput: Omit<RawReportInputs, "notes"> = {
  resident: baseResident,
  facilityName: "Sunrise Senior Care",
  generatedBy: "Maria Santos",
  generatedAt: new Date("2026-04-30T18:00:00Z"),
  dateRangeStart: new Date("2026-04-23T00:00:00Z"),
  dateRangeEnd: new Date("2026-04-30T23:59:59Z"),
  incidents: [],
  weeklySummaries: [],
  clinicians: [],
  familyContacts: [],
};

function noteRow(overrides: Partial<RawNoteRow>): RawNoteRow {
  return {
    id: "n-1",
    created_at: "2026-04-25T09:00:00Z",
    shift: "morning",
    raw_input: "raw note",
    structured_output: JSON.stringify({
      summary: "A summary line.",
      sections: [
        {
          name: "Mood & Behavior",
          text: "Looked content.",
          disclosure_class: "family_shareable_by_involvement",
          scope_category: "wellbeing_summary",
        },
      ],
      follow_up: "None noted.",
      flags: [],
      sensitive_flag: false,
      sensitive_category: null,
    }),
    edited_output: null,
    is_structured: true,
    flagged_as_incident: false,
    sensitive_flag: false,
    author_name: "James Wilson",
    ...overrides,
  };
}

describe("buildReportData", () => {
  it("excludes sensitive-flagged notes and counts the exclusions in stats", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({ id: "keep" }),
        noteRow({ id: "drop", sensitive_flag: true }),
      ],
    });

    const ids = data.days.flatMap((d) => d.notes.map((n) => n.id));
    expect(ids).toEqual(["keep"]);
    expect(data.stats.excludedSensitiveCount).toBe(1);
    expect(data.stats.noteCount).toBe(1);
  });

  it("excludes notes outside the date range on either end", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({ id: "before", created_at: "2026-04-01T09:00:00Z" }),
        noteRow({ id: "in-range", created_at: "2026-04-25T09:00:00Z" }),
        noteRow({ id: "after", created_at: "2026-05-15T09:00:00Z" }),
      ],
    });

    const ids = data.days.flatMap((d) => d.notes.map((n) => n.id));
    expect(ids).toEqual(["in-range"]);
  });

  it("groups notes by local day, sorts within day ascending and across days descending", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({ id: "tues-pm", created_at: "2026-04-28T20:00:00Z" }),
        noteRow({ id: "tues-am", created_at: "2026-04-28T08:00:00Z" }),
        noteRow({ id: "mon-am", created_at: "2026-04-27T08:00:00Z" }),
      ],
    });

    expect(data.days).toHaveLength(2);
    // Newest day first across days
    expect(data.days[0].notes.map((n) => n.id)).toEqual(["tues-am", "tues-pm"]);
    expect(data.days[1].notes.map((n) => n.id)).toEqual(["mon-am"]);
  });

  it("counts incidents and follow-ups in stats", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({ id: "n1", flagged_as_incident: true }),
        noteRow({
          id: "n2",
          structured_output: JSON.stringify({
            summary: "x",
            sections: [],
            follow_up: "Monitor sleep tonight.",
            flags: [],
            sensitive_flag: false,
            sensitive_category: null,
          }),
        }),
        noteRow({ id: "n3" }),
      ],
    });

    expect(data.stats.incidentCount).toBe(1);
    expect(data.stats.followUpCount).toBe(1);
    expect(data.stats.noteCount).toBe(3);
  });

  it("treats 'None noted.' follow-ups as no follow-up", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [noteRow({ id: "n1" })],
    });

    expect(data.days[0].notes[0].followUp).toBeNull();
    expect(data.stats.followUpCount).toBe(0);
  });

  it("falls back to raw_input when structured_output is null", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({
          id: "raw-only",
          structured_output: null,
          raw_input: "Quick handwritten note from the caregiver",
        }),
      ],
    });

    const note = data.days[0].notes[0];
    expect(note.summary).toBe("Quick handwritten note from the caregiver");
    expect(note.sections).toEqual([]);
  });

  it("handles an empty notes array without crashing and reports zeros", () => {
    const data = buildReportData({ ...baseInput, notes: [] });
    expect(data.days).toEqual([]);
    expect(data.stats).toEqual({
      noteCount: 0,
      incidentCount: 0,
      followUpCount: 0,
      excludedSensitiveCount: 0,
    });
  });

  it("preferes edited_output over structured_output", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [
        noteRow({
          id: "edited",
          edited_output: JSON.stringify({
            summary: "Edited summary",
            sections: [],
            follow_up: "None noted.",
            flags: [],
            sensitive_flag: false,
            sensitive_category: null,
          }),
        }),
      ],
    });

    expect(data.days[0].notes[0].summary).toBe("Edited summary");
  });

  it("filters incidents by date range", () => {
    const data = buildReportData({
      ...baseInput,
      notes: [],
      incidents: [
        {
          id: "i-in",
          note_id: "n1",
          incident_type: "near_fall",
          severity: "medium",
          status: "open",
          follow_up_date: "2026-04-30",
          manager_notes: null,
          created_at: "2026-04-25T09:00:00Z",
        },
        {
          id: "i-out",
          note_id: "n2",
          incident_type: "near_fall",
          severity: "low",
          status: "closed",
          follow_up_date: null,
          manager_notes: null,
          created_at: "2026-03-15T09:00:00Z",
        },
      ],
    });

    expect(data.incidents.map((i) => i.id)).toEqual(["i-in"]);
  });

  it("composes resident.fullName from first_name + last_name", () => {
    const data = buildReportData({ ...baseInput, notes: [] });
    expect(data.resident.fullName).toBe("Dorothy Chen");
  });
});
