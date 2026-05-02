import type { MetadataRoute } from "next";

// Resolved at build time. Picks up NEXT_PUBLIC_APP_URL when it's set,
// falls back to the production hostname. Kept here so robots.ts and
// sitemap.ts agree on the same base URL.
function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://kinroster.com";
}

// Block crawlers from auth, dashboard, and API surfaces. Everything
// behind the marketing site is either user-scoped (RLS-gated PHI) or an
// internal API and shouldn't compete with the landing page in search
// results. The sitemap line below points crawlers at the canonical
// list of indexable URLs.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
