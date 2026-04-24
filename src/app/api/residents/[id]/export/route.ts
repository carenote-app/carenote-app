import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// Synchronous JSON export of everything we hold about a resident. Intended
// for fulfilling portability requests (to a new facility, the patient, or
// a legal guardian). Admin-only via requireAdmin (RLS enforces the
// organization scope).
//
// The export is logged as both an audit_event (export) and a
// disclosure_event (recipient_type=agency_internal, legal_basis=operations)
// so the act of pulling the full record is captured on the compliance
// surface. If the admin shares the file externally, the external delivery
// is a second disclosure that must be logged when it happens.
export async function GET(
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

  const { data: appUser } = await supabase
    .from("users")
    .select("role, organization_id, full_name, email")
    .eq("id", user.id)
    .single();

  const typedUser = appUser as {
    role: string;
    organization_id: string;
    full_name: string;
    email: string;
  } | null;

  if (
    !typedUser ||
    (typedUser.role !== "admin" && typedUser.role !== "compliance_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resident (RLS enforces org scope)
  const { data: resident } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .single();

  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const residentRow = resident as {
    id: string;
    first_name: string;
    last_name: string;
    organization_id: string;
  } & Record<string, unknown>;

  // Pull every related dataset. RLS scopes each implicitly.
  const [
    { data: notes },
    { data: familyContacts },
    { data: residentClinicians },
    { data: incidents },
    { data: weeklySummaries },
    { data: familyCommunications },
    { data: disclosures },
    { data: auditEvents },
    { data: voiceSessions },
    { data: voiceTranscripts },
  ] = await Promise.all([
    supabase.from("notes").select("*").eq("resident_id", id),
    supabase.from("family_contacts").select("*").eq("resident_id", id),
    supabase
      .from("resident_clinicians")
      .select("*, clinicians(*)")
      .eq("resident_id", id),
    supabase.from("incident_reports").select("*").eq("resident_id", id),
    supabase.from("weekly_summaries").select("*").eq("resident_id", id),
    supabase
      .from("family_communications")
      .select("*")
      .eq("resident_id", id),
    supabase.from("disclosure_events").select("*").eq("resident_id", id),
    supabase
      .from("audit_events")
      .select("*")
      .or(
        `metadata->>resident_id.eq.${id},and(object_type.eq.note,object_id.in.(SELECT id FROM notes WHERE resident_id = '${id}'))`
      )
      .limit(1000),
    supabase.from("voice_sessions").select("*").eq("resident_id", id),
    supabase
      .from("voice_transcripts")
      .select("*, voice_sessions!inner(resident_id)")
      .eq("voice_sessions.resident_id", id),
  ]);

  const payload = {
    meta: {
      exported_at: new Date().toISOString(),
      exported_by: {
        id: user.id,
        full_name: typedUser.full_name,
        email: typedUser.email,
      },
      resident_id: id,
      organization_id: residentRow.organization_id,
      note:
        "This export represents the resident's record in Kinroster as of " +
        "the export timestamp. Any records added after that time are not " +
        "included. The export act itself is logged on the audit and " +
        "disclosure ledgers.",
    },
    resident: residentRow,
    family_contacts: familyContacts ?? [],
    treating_clinicians: residentClinicians ?? [],
    notes: notes ?? [],
    incident_reports: incidents ?? [],
    weekly_summaries: weeklySummaries ?? [],
    family_communications: familyCommunications ?? [],
    disclosure_events: disclosures ?? [],
    audit_events: auditEvents ?? [],
    voice_sessions: voiceSessions ?? [],
    voice_transcripts: voiceTranscripts ?? [],
  };

  // Record the export on both ledgers. categories_shared is the list of
  // top-level keys actually included so auditors can see at a glance what
  // was in the bundle.
  await supabase.from("disclosure_events").insert({
    organization_id: residentRow.organization_id,
    resident_id: id,
    actor_user_id: user.id,
    recipient_type: "agency_internal",
    recipient_id: null,
    legal_basis: "operations",
    categories_shared: Object.keys(payload).filter((k) => k !== "meta"),
    source_note_ids: (notes ?? []).map((n) => (n as { id: string }).id),
    delivery_method: "pdf_export",
  });

  await logAudit({
    organizationId: residentRow.organization_id,
    userId: user.id,
    eventType: "export",
    objectType: "resident",
    objectId: id,
    request,
    metadata: {
      note_count: (notes ?? []).length,
      incident_count: (incidents ?? []).length,
      disclosure_count: (disclosures ?? []).length,
    },
  });

  const filename = `kinroster-resident-${residentRow.last_name}-${residentRow.first_name}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-");

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
