import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { SensitiveAccessList } from "@/components/sensitive-access/sensitive-access-list";

export default async function SensitiveAccessPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: grantsData }, { data: usersData }, { data: residentsData }] =
    await Promise.all([
      supabase
        .from("notes_sensitive_access")
        .select(
          "id, user_id, resident_id, granted_by, granted_at, expires_at, reason"
        )
        .order("granted_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("organization_id", user.organization_id)
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("residents")
        .select("id, first_name, last_name, room_number")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("last_name"),
    ]);

  const users = (usersData ?? []) as Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
  }>;

  const residents = (residentsData ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    room_number: string | null;
  }>;

  const userMap = new Map(users.map((u) => [u.id, u]));
  const residentMap = new Map(residents.map((r) => [r.id, r]));

  const grants = (
    (grantsData ?? []) as Array<{
      id: string;
      user_id: string;
      resident_id: string;
      granted_by: string;
      granted_at: string;
      expires_at: string | null;
      reason: string;
    }>
  ).map((g) => ({
    ...g,
    user_display:
      userMap.get(g.user_id)?.full_name ??
      userMap.get(g.user_id)?.email ??
      "Unknown user",
    resident_display: residentMap.get(g.resident_id)
      ? `${residentMap.get(g.resident_id)!.first_name} ${
          residentMap.get(g.resident_id)!.last_name
        }`
      : "Unknown resident",
    granted_by_display:
      userMap.get(g.granted_by)?.full_name ??
      userMap.get(g.granted_by)?.email ??
      "Unknown",
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Sensitive Access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant individual users read access to a resident&apos;s sensitive
          notes (substance use, psychotherapy). Grants are auditable and can
          be revoked at any time. Admins and note authors always have access
          without an explicit grant.
        </p>
      </div>
      <SensitiveAccessList
        grants={grants}
        users={users.filter((u) => u.role !== "admin")}
        residents={residents}
      />
    </div>
  );
}
