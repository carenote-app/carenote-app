import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

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

  // RLS enforces org + admin. A non-admin or cross-org caller sees 0 rows
  // affected, which we translate to 404.
  const { data, error } = await supabase
    .from("clinician_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id, organization_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to revoke", details: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Share link not found or already revoked" },
      { status: 404 }
    );
  }

  const typedData = data as { id: string; organization_id: string };

  await logAudit({
    organizationId: typedData.organization_id,
    userId: user.id,
    eventType: "share_revoke",
    objectType: "share_link",
    objectId: typedData.id,
    request,
  });

  return NextResponse.json({ success: true });
}
