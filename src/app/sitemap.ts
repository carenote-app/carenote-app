import type { MetadataRoute } from "next";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://kinroster.com";
}

// Hand-maintained list of indexable URLs. Public surface is small and
// stable (landing + 4 legal/info pages), so a static array is correct
// for v1 — no need to walk the filesystem. Auth and dashboard routes
// are intentionally absent; they're also disallowed in robots.ts.
//
// `lastModified` is the build time, which is acceptable: a redeploy
// implies content may have changed. If we ever ship a blog or docs
// section, switch to per-page mtime from the source files.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const lastModified = new Date();
  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/hipaa`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/support`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
