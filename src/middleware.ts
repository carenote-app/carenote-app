import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Path prefixes that should never be indexed even if a link leaks. The
// robots.ts file already declares these as Disallow, but a Disallow only
// stops well-behaved crawlers — once a URL is discovered (e.g. shared
// in a public Slack channel), bad-actor crawlers can ignore robots.txt.
// X-Robots-Tag is the response-header equivalent and is honoured at the
// indexing layer, not the crawl layer.
const NOINDEX_PREFIXES = [
  "/api",
  "/auth",
  "/login",
  "/signup",
  "/verify",
  "/today",
  "/dashboard",
  "/residents",
  "/voice-sessions",
  "/incidents",
  "/clinicians",
  "/assignments",
  "/team",
  "/billing",
  "/data-requests",
  "/family",
  "/sensitive-access",
  "/audit-log",
  "/settings",
  "/portal",
  "/summaries",
];

function shouldNoIndex(pathname: string): boolean {
  for (const prefix of NOINDEX_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (shouldNoIndex(request.nextUrl.pathname)) {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes handle their own auth)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
