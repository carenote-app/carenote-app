import type { Metadata } from "next";

// Auth pages (login / signup / verify) are publicly reachable but have
// no SEO value. Block indexing here so the route group inherits it,
// rather than duplicating the metadata into each page (the form pages
// are `"use client"` and can't export metadata themselves).
//
// robots.ts also disallows these paths at the crawler-protocol level;
// this is the meta-tag belt to that suspenders.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
