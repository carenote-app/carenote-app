import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sets the calling admin's organization bed_count. Used by the billing
// page to gate Subscribe until a value is on file. The subscription_tier
// derives automatically from the schema (generated column).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  const typed = appUser as
    | { organization_id: string; role: string }
    | null;
  if (!typed?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }
  if (typed.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bedCount = (parsed as { bed_count?: unknown })?.bed_count;
  if (
    typeof bedCount !== "number" ||
    !Number.isInteger(bedCount) ||
    bedCount < 1 ||
    bedCount > 99
  ) {
    return NextResponse.json(
      { error: "bed_count must be an integer between 1 and 99" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({ bed_count: bedCount })
    .eq("id", typed.organization_id)
    .select("bed_count, subscription_tier")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    bed_count: (data as { bed_count: number; subscription_tier: string })
      .bed_count,
    subscription_tier: (
      data as { bed_count: number; subscription_tier: string }
    ).subscription_tier,
  });
}
