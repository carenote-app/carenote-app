import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: appUser } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const typedUser = appUser as { role: string; organization_id: string } | null;
  if (!typedUser || typedUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, fullName, organizationId, role } = await request.json();

  if (!email || !fullName || organizationId !== typedUser.organization_id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const INVITABLE_ROLES = [
    "caregiver",
    "nurse_reviewer",
    "ops_staff",
    "billing_staff",
  ] as const;
  const safeRole: (typeof INVITABLE_ROLES)[number] =
    typeof role === "string" &&
    (INVITABLE_ROLES as readonly string[]).includes(role)
      ? (role as (typeof INVITABLE_ROLES)[number])
      : "caregiver";

  // Use admin client to invite user via Supabase Auth
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        organization_id: organizationId,
        role: safeRole,
        invited: true,
      },
    });

  if (inviteError) {
    return NextResponse.json(
      { error: inviteError.message },
      { status: 400 }
    );
  }

  // Create user record (the signup trigger won't fire for invited users)
  if (inviteData.user) {
    await adminClient.from("users").upsert({
      id: inviteData.user.id,
      organization_id: organizationId,
      email,
      full_name: fullName,
      role: safeRole,
    });
  }

  return NextResponse.json({ success: true });
}
