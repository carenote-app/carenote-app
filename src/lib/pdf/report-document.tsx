// Server-only PDF document. Rendered via @react-pdf/renderer's Node
// pipeline inside the report API route. NOT a browser React component —
// the primitives are PDF-document elements (Page, View, Text), not DOM.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { ReportData, ReportNote } from "./build-report-data";

const COLOR_TEXT = "#111827";
const COLOR_MUTED = "#6b7280";
const COLOR_BORDER = "#e5e7eb";
const COLOR_DESTRUCTIVE = "#b91c1c";
const COLOR_DESTRUCTIVE_BG = "#fef2f2";
const COLOR_INCIDENT = "#b91c1c";
const COLOR_PRIMARY = "#0f766e";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontSize: 10,
    color: COLOR_TEXT,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
    paddingBottom: 8,
    marginBottom: 16,
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: COLOR_PRIMARY },
  brandSub: { fontSize: 8, color: COLOR_MUTED },
  reportMeta: { fontSize: 8, color: COLOR_MUTED, textAlign: "right" },
  h1: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 6,
    color: COLOR_PRIMARY,
  },
  h3: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  muted: { color: COLOR_MUTED },
  small: { fontSize: 8 },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontSize: 9,
    color: COLOR_MUTED,
    textTransform: "uppercase",
  },
  value: { flex: 1, fontSize: 10 },
  card: {
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  cardIncident: {
    borderColor: COLOR_INCIDENT,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  noteSummary: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionLabel: {
    fontSize: 8,
    color: COLOR_MUTED,
    textTransform: "uppercase",
    marginTop: 4,
  },
  sectionText: { fontSize: 10, marginTop: 1 },
  followUpBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
  },
  flagCallout: {
    borderWidth: 1,
    borderColor: COLOR_DESTRUCTIVE,
    backgroundColor: COLOR_DESTRUCTIVE_BG,
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  flagType: {
    fontSize: 8,
    color: COLOR_DESTRUCTIVE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  flagReason: { fontSize: 9, marginTop: 1 },
  table: {
    borderTopWidth: 1,
    borderColor: COLOR_BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: COLOR_BORDER,
    paddingVertical: 4,
  },
  tableCell: { fontSize: 9, paddingRight: 8 },
  dayHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f9fafb",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  statBox: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
    marginBottom: 4,
  },
  stat: { flexDirection: "column" },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 8, color: COLOR_MUTED, textTransform: "uppercase" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLOR_MUTED,
    borderTopWidth: 0.5,
    borderColor: COLOR_BORDER,
    paddingTop: 4,
  },
});

const DATE_FMT_LONG: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};
const DATE_FMT_SHORT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};
const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", DATE_FMT_LONG);
}
function fmtDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", DATE_FMT_SHORT);
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", TIME_FMT);
}
function humanizeFlagType(t: string): string {
  return t.replace(/_/g, " ");
}

function NoteCard({ note }: { note: ReportNote }) {
  return (
    <View style={[styles.card, note.flaggedAsIncident ? styles.cardIncident : {}]} wrap={false}>
      <View style={styles.cardHeader}>
        <Text style={styles.small}>
          {fmtTime(note.createdAt)}
          {note.shift ? ` • ${note.shift} shift` : ""}
        </Text>
        <Text style={[styles.small, styles.muted]}>{note.authorName}</Text>
      </View>

      <Text style={styles.noteSummary}>{note.summary}</Text>

      {note.sections.map((s, i) => (
        <View key={`${note.id}-s-${i}`}>
          <Text style={styles.sectionLabel}>{s.name}</Text>
          <Text style={styles.sectionText}>{s.text}</Text>
        </View>
      ))}

      {note.followUp && (
        <View style={styles.followUpBox}>
          <Text style={styles.sectionLabel}>Follow-up</Text>
          <Text style={styles.sectionText}>{note.followUp}</Text>
        </View>
      )}

      {note.flags.length > 0 && (
        <View>
          {note.flags.map((flag, i) => (
            <View key={`${note.id}-f-${i}`} style={styles.flagCallout}>
              <Text style={styles.flagType}>{humanizeFlagType(flag.type)}</Text>
              <Text style={styles.flagReason}>{flag.reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Header({ data }: { data: ReportData }) {
  return (
    <View style={styles.brandRow} fixed>
      <View>
        <Text style={styles.brand}>Kinroster</Text>
        <Text style={styles.brandSub}>{data.facilityName}</Text>
      </View>
      <View>
        <Text style={styles.reportMeta}>
          Generated {fmtDateShort(data.generatedAt)} {fmtTime(data.generatedAt)}
        </Text>
        <Text style={styles.reportMeta}>by {data.generatedBy}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>
        Confidential — contains PHI; handle per your facility&apos;s policy.
      </Text>
      <Text
        render={({ pageNumber, totalPages }: {
          pageNumber: number;
          totalPages: number;
        }) => `Page ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }): ReactElement {
  const dateRangeLabel = `${fmtDateShort(data.dateRangeStart)} – ${fmtDateShort(
    data.dateRangeEnd
  )}`;

  return (
    <Document
      title={`Resident Care Report — ${data.resident.fullName}`}
      author={data.generatedBy}
      subject="Resident care report"
      creator="Kinroster"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <Header data={data} />

        <Text style={styles.h1}>Resident Care Report</Text>
        <Text style={styles.muted}>{dateRangeLabel}</Text>

        {/* Resident block */}
        <Text style={styles.h2}>Resident</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{data.resident.fullName}</Text>
        </View>
        {data.resident.room_number && (
          <View style={styles.row}>
            <Text style={styles.label}>Room</Text>
            <Text style={styles.value}>{data.resident.room_number}</Text>
          </View>
        )}
        {data.resident.date_of_birth && (
          <View style={styles.row}>
            <Text style={styles.label}>DOB</Text>
            <Text style={styles.value}>{data.resident.date_of_birth}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {data.resident.status.replace(/_/g, " ")}
          </Text>
        </View>
        {data.resident.conditions && (
          <View style={styles.row}>
            <Text style={styles.label}>Conditions</Text>
            <Text style={styles.value}>{data.resident.conditions}</Text>
          </View>
        )}
        {data.resident.preferences && (
          <View style={styles.row}>
            <Text style={styles.label}>Preferences</Text>
            <Text style={styles.value}>{data.resident.preferences}</Text>
          </View>
        )}

        {/* At-a-glance */}
        <Text style={styles.h2}>At a glance</Text>
        <View style={styles.statBox}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.stats.noteCount}</Text>
            <Text style={styles.statLabel}>Notes in range</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.stats.incidentCount}</Text>
            <Text style={styles.statLabel}>Incidents flagged</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.stats.followUpCount}</Text>
            <Text style={styles.statLabel}>Open follow-ups</Text>
          </View>
        </View>
        {data.stats.excludedSensitiveCount > 0 && (
          <Text style={[styles.small, styles.muted]}>
            {data.stats.excludedSensitiveCount} sensitive-flagged note
            {data.stats.excludedSensitiveCount === 1 ? "" : "s"} excluded
            (federally protected; routine sharing restricted).
          </Text>
        )}

        {/* Treating clinicians */}
        {data.clinicians.length > 0 && (
          <View>
            <Text style={styles.h2}>Treating clinicians</Text>
            <View style={styles.table}>
              {data.clinicians.map((c, i) => (
                <View key={`c-${i}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {c.full_name}
                    {c.is_primary ? "  (primary)" : ""}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {c.specialty ?? ""}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {c.relationship}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Family contacts */}
        {data.familyContacts.length > 0 && (
          <View>
            <Text style={styles.h2}>Family contacts</Text>
            <View style={styles.table}>
              {data.familyContacts.map((f, i) => (
                <View key={`f-${i}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{f.name}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {f.relationship}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes timeline */}
        <Text style={styles.h2}>Notes timeline</Text>
        {data.days.length === 0 ? (
          <Text style={styles.muted}>
            No notes recorded in this date range.
          </Text>
        ) : (
          data.days.map((day, di) => (
            <View key={`d-${di}`}>
              <Text style={styles.dayHeader}>{fmtDateLong(day.date)}</Text>
              {day.notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>
          ))
        )}

        {/* Incident reports */}
        {data.incidents.length > 0 && (
          <View>
            <Text style={styles.h2}>Incident reports</Text>
            {data.incidents.map((i) => (
              <View key={i.id} style={styles.card} wrap={false}>
                <View style={styles.cardHeader}>
                  <Text style={styles.h3}>
                    {i.incident_type.replace(/_/g, " ")} • {i.severity}
                  </Text>
                  <Text style={[styles.small, styles.muted]}>
                    {fmtDateShort(new Date(i.created_at))}
                  </Text>
                </View>
                <Text style={styles.small}>Status: {i.status}</Text>
                {i.follow_up_date && (
                  <Text style={styles.small}>
                    Follow-up date: {i.follow_up_date}
                  </Text>
                )}
                {i.manager_notes && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.sectionLabel}>Manager notes</Text>
                    <Text style={styles.sectionText}>{i.manager_notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Weekly summaries */}
        {data.weeklySummaries.length > 0 && (
          <View>
            <Text style={styles.h2}>Weekly summaries</Text>
            {data.weeklySummaries.map((w) => (
              <View key={w.id} style={styles.card} wrap={false}>
                <Text style={styles.h3}>
                  {fmtDateShort(new Date(w.week_start))} –{" "}
                  {fmtDateShort(new Date(w.week_end))}
                </Text>
                <Text style={styles.sectionText}>{w.summary_text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.small, styles.muted]}>
            AI-structured from caregiver observations. Original raw inputs
            retained in the source system. Sensitive-flagged content (42 CFR
            Part 2 / psychotherapy) is excluded from this export.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

export async function renderReport(data: ReportData): Promise<Buffer> {
  const stream = await pdf(<ReportDocument data={data} />).toBuffer();
  // @react-pdf/renderer's toBuffer() returns a Node Readable in v4. Collect
  // it into a single Buffer so callers can attach to email or write to the
  // response body in one shot.
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
