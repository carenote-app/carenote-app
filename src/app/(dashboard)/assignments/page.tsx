import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AssignmentsList } from "@/components/assignments/assignments-list";

export default async function AssignmentsPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: assignmentsData }, { data: caregiversData }, { data: residentsData }] =
    await Promise.all([
      supabase
        .from("caregiver_assignments")
        .select("id, caregiver_id, resident_id, start_date, end_date")
        .order("start_date", { ascending: false }),
      supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("organization_id", user.organization_id)
        .eq("is_active", true)
        .in("role", ["caregiver", "nurse_reviewer"])
        .order("full_name"),
      supabase
        .from("residents")
        .select("id, first_name, last_name, room_number")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("last_name"),
    ]);

  const caregivers = (caregiversData ?? []) as Array<{
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

  const caregiverMap = new Map(caregivers.map((c) => [c.id, c]));
  const residentMap = new Map(residents.map((r) => [r.id, r]));

  const assignments = (
    (assignmentsData ?? []) as Array<{
      id: string;
      caregiver_id: string;
      resident_id: string;
      start_date: string;
      end_date: string | null;
    }>
  ).map((a) => ({
    ...a,
    caregiver_display:
      caregiverMap.get(a.caregiver_id)?.full_name ??
      caregiverMap.get(a.caregiver_id)?.email ??
      "Unknown user",
    resident_display: residentMap.get(a.resident_id)
      ? `${residentMap.get(a.resident_id)!.first_name} ${
          residentMap.get(a.resident_id)!.last_name
        }`
      : "Unknown resident",
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Caregiver Assignments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track which caregivers are assigned to which residents. This is the
          source of truth for future per-assignment visibility enforcement —
          today, all caregivers still see all notes in the org. Populating
          assignments now means the switch to enforced mode is one setting
          flip away.
        </p>
      </div>
      <AssignmentsList
        assignments={assignments}
        caregivers={caregivers}
        residents={residents}
      />
    </div>
  );
}
