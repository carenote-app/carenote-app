import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { RoleSelection } from "@/components/landing/role-selection";
import { Features } from "@/components/landing/features";
import { FeatureDetails } from "@/components/landing/feature-details";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { Footer } from "@/components/landing/footer";

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
      <LandingHeader />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <HeroSection />

        <RoleSelection />

        <Features />

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
