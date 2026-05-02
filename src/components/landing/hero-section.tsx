import { Sparkles, Shield, Clock, ScrollText } from "lucide-react";
import { ConsultLauncher } from "./consult-launcher";

// Server-rendered: this is the LCP region for the landing page. The only
// interactive element is the CTA button, which is owned by the
// ConsultLauncher client island.
export function HeroSection() {
  return (
    <section className="relative py-12 md:py-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI-Powered Clinical Documentation</span>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Voice-First
          <br />
          <span className="text-primary">Patient Care</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Transform how you document patient care. Kinroster uses AI to convert voice notes
          into structured clinical documentation, saving time and improving accuracy.
        </p>

        {/* CTA — client island */}
        <ConsultLauncher variant="hero" />

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:gap-10">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>HIPAA-ready architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Save 2+ Hours Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            <span>Full audit trail</span>
          </div>
        </div>
      </div>
    </section>
  );
}
