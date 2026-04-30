import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  buildReportData,
  type RawReportInputs,
  type RawNoteRow,
  type RawIncidentRow,
  type RawWeeklySummaryRow,
  type RawClinicianRow,
  type RawFamilyContactRow,
} from "@/lib/pdf/build-report-data";
import { renderReport } from "@/lib/pdf/report-document";
import { sendExportEmail } from "@/lib/resend";

// PDF report export for a single resident, scoped to a date range.
//
// Auth: any authenticated user in the resident's organization. Unlike the
// JSON export at ../export/route.ts (admin-only — fulfils portability
// requests with the full record), this surface produces a curated,
// professional PDF for caregivers to hand to managers. RLS already lets
// every org member SELECT every note in their org, so generating a PDF of
// content the caregiver can already see in-app is not a new disclosure
// surface — just a new format. We mirror the JSON export's compliance
// ledger writes so both surfaces show up in the same audit trails.
//
// The PDF is rendered with @react-pdf/renderer, which only runs on the
// Node runtime — Edge would crash on its `font` / `node:stream` reach.
export const runtime = "nodejs";

const VALID_MODES = ["download", "email"] as const;
type DeliveryMode = (typeof VALID_MODES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PostBody {
  dateRangeStart?: unknown;
  dateRangeEnd?: unknown;
  delivery?: unknown;
}

interface ParsedDelivery {
  mode: DeliveryMode;
  to?: string;
  message?: string;
}

function parseBody(raw: PostBody): {
  start: Date;
  end: Date;
  delivery: ParsedDelivery;
} | { error: string } {
  if (typeof raw.dateRangeStart !== "string" || typeof raw.dateRangeEnd !== "string") {
    return { error: "dateRangeStart and dateRangeEnd are required ISO strings" };
  }
  const start = new Date(raw.dateRangeStart);
  const end = new Date(raw.dateRangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid date range" };
  }
  if (start.getTime() > end.getTime()) {
    return { error: "dateRangeStart must be on or before dateRangeEnd" };
  }

  const delivery = raw.delivery as { mode?: unknown; to?: unknown; message?: unknown } | null;
  if (!delivery || typeof delivery.mode !== "string") {
    return { error: "delivery.mode is required" };
  }
  if (!VALID_MODES.includes(delivery.mode as DeliveryMode)) {
    return { error: "delivery.mode must be 'download' or 'email'" };
  }
  const mode = delivery.mode as DeliveryMode;

  if (mode === "email") {
    if (typeof delivery.to !== "string" || !EMAIL_RE.test(delivery.to)) {
      return { error: "delivery.to must be a valid email" };
    }
    const message = typeof delivery.message === "string" ? delivery.message : undefined;
    return {
      start,
      end,
      delivery: { mode, to: delivery.to, message },
    };
  }

  return { start, end, delivery: { mode } };
}

function safeFilenameSegment(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { start, end, delivery } = parsed;

  // Caller's app-user row (org scope, name for attribution + email for replyTo)
  const { data: appUser } = await supabase
    .from("users")
    .select("organization_id, full_name, email")
    .eq("id", user.id)
    .single();

  const typedUser = appUser as
    | { organization_id: string; full_name: string; email: string }
    | null;
  if (!typedUser?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  // Resident — RLS gates org membership. We also fetch the org name for the
  // PDF header and email "from" line in one round-trip.
  const { data: residentRow } = await supabase
    .from("residents")
    .select(
      "id, organization_id, first_name, last_name, room_number, date_of_birth, conditions, preferences, status"
    )
    .eq("id", id)
    .single();

  const resident = residentRow as
    | (RawReportInputs["resident"] & {
        id: string;
        organization_id: string;
      })
    | null;
  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", resident.organization_id)
    .single();
  const facilityName =
    (orgRow as { name: string } | null)?.name ?? "Your facility";

  // Pull the report slice in parallel. RLS already scopes each query;
  // sensitive-flag filtering is at the DB layer for defence-in-depth, and
  // also at the buildReportData layer.
  const [
    { data: rawNotes },
    { data: rawIncidents },
    { data: rawWeeklySummaries },
    { data: rawAssignedClinicians },
    { data: rawFamilyContacts },
  ] = await Promise.all([
    supabase
      .from("notes")
      .select(
        "id, created_at, shift, raw_input, structured_output, edited_output, is_structured, flagged_as_incident, sensitive_flag, users:author_id(full_name)"
      )
      .eq("resident_id", id)
      .eq("sensitive_flag", false)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("incident_reports")
      .select(
        "id, note_id, incident_type, severity, status, follow_up_date, manager_notes, created_at"
      )
      .eq("resident_id", id)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("weekly_summaries")
      .select("id, week_start, week_end, summary_text")
      .eq("resident_id", id)
      .gte("week_end", start.toISOString().slice(0, 10))
      .lte("week_start", end.toISOString().slice(0, 10)),
    supabase
      .from("resident_clinicians")
      .select(
        "relationship, is_primary, clinicians(full_name, specialty)"
      )
      .eq("resident_id", id),
    supabase
      .from("family_contacts")
      .select("name, relationship")
      .eq("resident_id", id),
  ]);

  const notes: RawNoteRow[] = (
    (rawNotes ?? []) as Array<{
      id: string;
      created_at: string;
      shift: string | null;
      raw_input: string;
      structured_output: string | null;
      edited_output: string | null;
      is_structured: boolean;
      flagged_as_incident: boolean;
      sensitive_flag: boolean;
      users: { full_name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    shift: row.shift,
    raw_input: row.raw_input,
    structured_output: row.structured_output,
    edited_output: row.edited_output,
    is_structured: row.is_structured,
    flagged_as_incident: row.flagged_as_incident,
    sensitive_flag: row.sensitive_flag,
    author_name: row.users?.full_name ?? null,
  }));

  const incidents = (rawIncidents ?? []) as RawIncidentRow[];
  const weeklySummaries = (rawWeeklySummaries ?? []) as RawWeeklySummaryRow[];
  const clinicians: RawClinicianRow[] = (
    (rawAssignedClinicians ?? []) as Array<{
      relationship: string;
      is_primary: boolean;
      clinicians: { full_name: string; specialty: string | null } | null;
    }>
  )
    .filter((row) => row.clinicians !== null)
    .map((row) => ({
      full_name: row.clinicians!.full_name,
      specialty: row.clinicians!.specialty,
      relationship: row.relationship,
      is_primary: row.is_primary,
    }));
  const familyContacts = (rawFamilyContacts ?? []) as RawFamilyContactRow[];

  const reportData = buildReportData({
    resident: {
      first_name: resident.first_name,
      last_name: resident.last_name,
      room_number: resident.room_number,
      date_of_birth: resident.date_of_birth,
      conditions: resident.conditions,
      preferences: resident.preferences,
      status: resident.status,
    },
    facilityName,
    generatedBy: typedUser.full_name,
    generatedAt: new Date(),
    dateRangeStart: start,
    dateRangeEnd: end,
    notes,
    incidents,
    weeklySummaries,
    clinicians,
    familyContacts,
  });

  const pdfBuffer = await renderReport(reportData);

  // Filename: kinroster-report-{last}-{first}-{from}-to-{to}.pdf
  const filename = `kinroster-report-${safeFilenameSegment(
    resident.last_name
  )}-${safeFilenameSegment(resident.first_name)}-${start
    .toISOString()
    .slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.pdf`;

  // Email mode: send first, then write the ledger so a delivery failure
  // doesn't leave a phantom disclosure record. Download mode: write the
  // ledger then return the PDF.
  if (delivery.mode === "email") {
    try {
      await sendExportEmail({
        to: delivery.to!,
        fromName: `${facilityName} via Kinroster`,
        replyTo: typedUser.email,
        facilityName,
        requesterName: typedUser.full_name,
        dateRange: `${start.toISOString().slice(0, 10)} – ${end
          .toISOString()
          .slice(0, 10)}`,
        message: delivery.message,
        pdfBuffer,
        pdfFilename: filename,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email send failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Compliance ledger
  await supabase.from("disclosure_events").insert({
    organization_id: resident.organization_id,
    resident_id: id,
    actor_user_id: user.id,
    recipient_type: "agency_internal",
    recipient_id: null,
    legal_basis: "operations",
    categories_shared: [
      ...(reportData.days.length > 0 ? ["notes"] : []),
      ...(reportData.incidents.length > 0 ? ["incidents"] : []),
      ...(reportData.weeklySummaries.length > 0 ? ["weekly_summaries"] : []),
    ],
    source_note_ids: reportData.days
      .flatMap((d) => d.notes)
      .map((n) => n.id),
    delivery_method: delivery.mode === "download" ? "pdf_export" : "email",
  });

  await logAudit({
    organizationId: resident.organization_id,
    userId: user.id,
    eventType: "export",
    objectType: "resident",
    objectId: id,
    request,
    metadata: {
      format: "pdf",
      delivery_mode: delivery.mode,
      date_range_start: start.toISOString(),
      date_range_end: end.toISOString(),
      note_count: reportData.stats.noteCount,
      incident_count: reportData.stats.incidentCount,
      excluded_sensitive_count: reportData.stats.excludedSensitiveCount,
      // Recipient email: domain-only on the audit row to keep PII off the
      // ledger surface. The full recipient is captured implicitly in the
      // Resend send log if we ever need it for forensics.
      ...(delivery.mode === "email"
        ? {
            recipient_email_domain: delivery.to!.split("@")[1] ?? null,
          }
        : {}),
    },
  });

  if (delivery.mode === "download") {
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
