import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { AuditLogFilters } from "@/components/audit-log/audit-log-filters";

const PAGE_SIZE = 100;

type SearchParams = {
  event_type?: string;
  user_id?: string;
  start?: string;
  end?: string;
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const params = await searchParams;

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name");

  const users = (usersData ?? []) as Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  const userMap = new Map(users.map((u) => [u.id, u]));

  let query = supabase
    .from("audit_events")
    .select(
      "id, event_type, object_type, object_id, result, ip_address, user_agent, metadata, created_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (params.event_type && params.event_type !== "all") {
    query = query.eq("event_type", params.event_type);
  }
  if (params.user_id && params.user_id !== "all") {
    query = query.eq("user_id", params.user_id);
  }
  if (params.start) {
    query = query.gte("created_at", params.start);
  }
  if (params.end) {
    query = query.lte("created_at", params.end + "T23:59:59Z");
  }

  const { data: eventsData } = await query;

  const events = (eventsData ?? []) as Array<{
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

  const exportQs = new URLSearchParams();
  if (params.event_type) exportQs.set("event_type", params.event_type);
  if (params.user_id) exportQs.set("user_id", params.user_id);
  if (params.start) exportQs.set("start", params.start);
  if (params.end) exportQs.set("end", params.end);
  const exportHref = `/api/audit-log/export${
    exportQs.toString() ? "?" + exportQs.toString() : ""
  }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Audit Log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Security-relevant actions in this organization — logins, share
            creation and opens, sensitive access grants, note changes.
            Append-only; entries cannot be edited or deleted.
          </p>
        </div>
        <Link href={exportHref}>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <AuditLogFilters
          users={users}
          initialEventType={params.event_type ?? "all"}
          initialUserId={params.user_id ?? "all"}
          initialStart={params.start ?? ""}
          initialEnd={params.end ?? ""}
        />
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events match the current filters.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const actor = e.user_id ? userMap.get(e.user_id) : null;
            return (
              <Card key={e.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{e.event_type}</p>
                        {e.result !== "success" && (
                          <Badge
                            variant={
                              e.result === "denied" ? "destructive" : "outline"
                            }
                            className="text-xs"
                          >
                            {e.result}
                          </Badge>
                        )}
                        {e.object_type && (
                          <Badge variant="outline" className="text-xs">
                            {e.object_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {actor
                          ? `${actor.full_name} (${actor.email})`
                          : e.user_id
                          ? "user " + e.user_id.slice(0, 8)
                          : "unauthenticated"}
                        {e.ip_address ? ` · ${e.ip_address}` : ""}
                        {" · "}
                        <time suppressHydrationWarning>
                          {new Date(e.created_at).toLocaleString()}
                        </time>
                      </p>
                      {Object.keys(e.metadata ?? {}).length > 0 && (
                        <pre className="mt-1.5 text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(e.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {events.length === PAGE_SIZE && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Showing most recent {PAGE_SIZE} events. Narrow the filters to
              see older entries or export CSV for the full set.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
