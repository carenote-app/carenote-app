import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const origin = request.nextUrl.origin;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Handle email confirmation (PKCE token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email",
    });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
    }
    await recordLoginSuccess(supabase, request);
    return NextResponse.redirect(`${origin}/today`);
  }

  // Handle OAuth callback (code flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    await recordLoginSuccess(supabase, request);
    return NextResponse.redirect(`${origin}/today`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}

// Look up the newly-authenticated user's org (via the service-role client so
// this works even if cookies haven't been fully set on the response object
// yet) and log a login_success audit event. Fire-and-forget: failure here
// must not block the redirect into the app.
async function recordLoginSuccess(
  supabase: ReturnType<typeof createServerClient>,
  request: NextRequest
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createAdminClient();
    const { data: appUser } = await admin
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (appUser as { organization_id: string } | null)
      ?.organization_id;
    if (!orgId) return;

    await logAudit({
      organizationId: orgId,
      userId: user.id,
      eventType: "login_success",
      objectType: "user",
      objectId: user.id,
      request,
    });
  } catch {
    // Swallow — login must not depend on audit.
  }
}
