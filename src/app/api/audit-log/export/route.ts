import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_ROWS = 10000;

// CSV export of audit events filtered the same way the /audit-log page
// filters. Admin-only via RLS — non-admin callers get an empty CSV with
// just the header row. Capped at MAX_ROWS to keep the response bounded.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || (appUser as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from("audit_events")
    .select(
      "id, event_type, object_type, object_id, result, ip_address, user_agent, metadata, created_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  const eventType = sp.get("event_type");
  const userId = sp.get("user_id");
  const start = sp.get("start");
  const end = sp.get("end");

  if (eventType && eventType !== "all") query = query.eq("event_type", eventType);
  if (userId && userId !== "all") query = query.eq("user_id", userId);
  if (start) query = query.gte("created_at", start);
  if (end) query = query.lte("created_at", end + "T23:59:59Z");

  const { data } = await query;

  const rows = (data ?? []) as Array<{
    id: string;
    event_type: string;
    object_type: string | null;
    object_id: string | null;
    result: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>;

  const header = [
    "id",
    "created_at",
    "user_id",
    "event_type",
    "object_type",
    "object_id",
    "result",
    "ip_address",
    "user_agent",
    "metadata",
  ];

  const csv =
    header.join(",") +
    "\n" +
    rows
      .map((r) =>
        [
          r.id,
          r.created_at,
          r.user_id ?? "",
          r.event_type,
          r.object_type ?? "",
          r.object_id ?? "",
          r.result,
          r.ip_address ?? "",
          r.user_agent ?? "",
          JSON.stringify(r.metadata ?? {}),
        ]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value === "") return "";
  // Quote if it contains a comma, quote, or newline; double-up internal quotes.
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
