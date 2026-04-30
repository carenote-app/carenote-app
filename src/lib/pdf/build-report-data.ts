// Pure transformation: raw rows from the report API route → ReportData
// shape consumed by the PDF document. Has no side effects and no I/O so
// it's straightforward to unit-test (sensitive-flag exclusion, ordering,
// summary stats, empty-set handling).

import {
  parseStructuredOutput,
} from "@/lib/structured-output";
import type {
  StructuredNoteSection,
  DisclosureClass,
} from "@/lib/prompts/shift-note";

export interface RawNoteRow {
  id: string;
  created_at: string;
  shift: string | null;
  raw_input: string;
  structured_output: string | null;
  edited_output: string | null;
  is_structured: boolean;
  flagged_as_incident: boolean;
  sensitive_flag: boolean;
  author_name: string | null;
}

export interface RawIncidentRow {
  id: string;
  note_id: string;
  incident_type: string;
  severity: string;
  status: string;
  follow_up_date: string | null;
  manager_notes: string | null;
  created_at: string;
}

export interface RawWeeklySummaryRow {
  id: string;
  week_start: string;
  week_end: string;
  summary_text: string;
}

export interface RawClinicianRow {
  full_name: string;
  specialty: string | null;
  relationship: string;
  is_primary: boolean;
}

export interface RawFamilyContactRow {
  name: string;
  relationship: string;
}

export interface RawReportInputs {
  resident: {
    first_name: string;
    last_name: string;
    room_number: string | null;
    date_of_birth: string | null;
    conditions: string | null;
    preferences: string | null;
    status: string;
  };
  facilityName: string;
  generatedBy: string;
  generatedAt: Date;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  notes: RawNoteRow[];
  incidents: RawIncidentRow[];
  weeklySummaries: RawWeeklySummaryRow[];
  clinicians: RawClinicianRow[];
  familyContacts: RawFamilyContactRow[];
}

export interface ReportNoteSection {
  name: string;
  text: string;
  disclosure_class: DisclosureClass;
}

export interface ReportNote {
  id: string;
  createdAt: Date;
  shift: string | null;
  authorName: string;
  flaggedAsIncident: boolean;
  summary: string;
  sections: ReportNoteSection[];
  followUp: string | null;
  flags: Array<{ type: string; reason: string }>;
}

export interface ReportDay {
  date: Date; // midnight of the local day
  notes: ReportNote[];
}

export interface ReportData {
  resident: RawReportInputs["resident"] & { fullName: string };
  facilityName: string;
  generatedBy: string;
  generatedAt: Date;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  clinicians: RawClinicianRow[];
  familyContacts: RawFamilyContactRow[];
  days: ReportDay[];
  incidents: RawIncidentRow[];
  weeklySummaries: RawWeeklySummaryRow[];
  stats: {
    noteCount: number;
    incidentCount: number;
    followUpCount: number;
    excludedSensitiveCount: number;
  };
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function noteFromRaw(row: RawNoteRow): ReportNote {
  const source = row.edited_output || row.structured_output;
  const parsed = source ? parseStructuredOutput(source) : null;

  const sections: ReportNoteSection[] = parsed
    ? parsed.sections.map((s: StructuredNoteSection) => ({
        name: s.name,
        text: s.text,
        disclosure_class: s.disclosure_class,
      }))
    : [];

  const summary = parsed?.summary?.trim() || row.raw_input.trim();
  const followUp =
    parsed?.follow_up && parsed.follow_up.trim().toLowerCase() !== "none noted."
      ? parsed.follow_up.trim()
      : null;

  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    shift: row.shift,
    authorName: row.author_name ?? "Unknown",
    flaggedAsIncident: row.flagged_as_incident,
    summary,
    sections,
    followUp,
    flags: parsed?.flags ?? [],
  };
}

export function buildReportData(input: RawReportInputs): ReportData {
  const start = input.dateRangeStart.getTime();
  const end = input.dateRangeEnd.getTime();

  let excludedSensitiveCount = 0;
  const inRangeNonSensitive: RawNoteRow[] = [];
  for (const row of input.notes) {
    const t = new Date(row.created_at).getTime();
    if (t < start || t > end) continue;
    if (row.sensitive_flag) {
      excludedSensitiveCount += 1;
      continue;
    }
    inRangeNonSensitive.push(row);
  }

  // Group by local day; ascending within day so the timeline reads forward
  // through the shift; descending across days so the most recent shift is
  // first when the manager opens the PDF.
  const byDay = new Map<string, ReportNote[]>();
  for (const row of inRangeNonSensitive) {
    const created = new Date(row.created_at);
    const key = dayKey(created);
    const list = byDay.get(key) ?? [];
    list.push(noteFromRaw(row));
    byDay.set(key, list);
  }

  const days: ReportDay[] = Array.from(byDay.entries())
    .map(([key, notes]) => {
      notes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const [y, m, d] = key.split("-").map(Number);
      return { date: new Date(y, m - 1, d), notes };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const noteCount = inRangeNonSensitive.length;
  const followUpCount = days
    .flatMap((d) => d.notes)
    .filter((n) => n.followUp !== null).length;

  return {
    resident: {
      ...input.resident,
      fullName: `${input.resident.first_name} ${input.resident.last_name}`,
    },
    facilityName: input.facilityName,
    generatedBy: input.generatedBy,
    generatedAt: input.generatedAt,
    dateRangeStart: input.dateRangeStart,
    dateRangeEnd: input.dateRangeEnd,
    clinicians: input.clinicians,
    familyContacts: input.familyContacts,
    days,
    incidents: input.incidents.filter((i) => {
      const t = new Date(i.created_at).getTime();
      return t >= start && t <= end;
    }),
    weeklySummaries: input.weeklySummaries,
    stats: {
      noteCount,
      incidentCount: days.flatMap((d) => d.notes).filter((n) => n.flaggedAsIncident)
        .length,
      followUpCount,
      excludedSensitiveCount,
    },
  };
}
