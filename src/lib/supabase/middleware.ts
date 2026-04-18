import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicPrefixes = ["/login", "/signup", "/verify", "/privacy", "/terms", "/hipaa", "/support", "/auth/callback"];
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    publicPrefixes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Enforce email verification — redirect unverified users to /verify
  const isVerifyPage = request.nextUrl.pathname.startsWith("/verify");
  if (user && !user.email_confirmed_at && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (not landing or public content pages)
  const authPages = ["/login", "/signup"];
  const isAuthPage = authPages.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  if (user && user.email_confirmed_at && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  // Verified users on /verify should go to dashboard
  if (user && user.email_confirmed_at && isVerifyPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
