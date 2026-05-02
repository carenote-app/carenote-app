import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { RoleSelection } from "@/components/landing/role-selection";
import { Features } from "@/components/landing/features";
import { FeatureDetails } from "@/components/landing/feature-details";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { Footer } from "@/components/landing/footer";
import { SoftwareApplicationJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Kinroster — Voice-First Documentation for Care Homes",
  description:
    "Turn caregiver voice notes into structured shift logs, incident reports, and family updates in seconds. Built for residential care homes with HIPAA-ready architecture, audit ledgers, and 42 CFR Part 2 segregation.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kinroster — Voice-First Documentation for Care Homes",
    description:
      "Turn caregiver voice notes into structured shift logs, incident reports, and family updates in seconds.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "Kinroster — Voice-First Documentation for Care Homes",
    description:
      "Turn caregiver voice notes into structured shift logs, incident reports, and family updates in seconds.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SoftwareApplicationJsonLd />
      <LandingHeader />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <HeroSection />

        <RoleSelection />

        <Features />

        {/* Trust strip — short visual band that lives between Features and
            FeatureDetails. Doubles as the highest-value internal link from
            the landing page (search engines treat in-content links as
            stronger ranking signals than footer-only links). */}
        <section className="my-8 rounded-2xl border border-border bg-secondary/30 px-6 py-5 md:my-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center md:flex-row md:gap-4 md:text-left">
            <ShieldCheck
              className="h-6 w-6 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground md:flex-1">
              Built for HIPAA-aware operators. Append-only audit ledger,
              42 CFR Part 2 segregation, revocable clinician portals, and a
              data-export path for portability requests.
            </p>
            <Link
              href="/hipaa"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              See HIPAA readiness →
            </Link>
          </div>
        </section>

        <FeatureDetails />

        {/* Waitlist capture */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Get Early Access
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join caregivers who are transforming how they document patient care.
              Be the first to know when new features launch.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
