"use client"

import { Mic, Brain, FileText, Zap, Share2, Lock, Check } from "lucide-react"
import { VoiceRecordingIllustration } from "./illustrations/voice-recording"
import { AiProcessingIllustration } from "./illustrations/ai-processing"
import { SmartDocsIllustration } from "./illustrations/smart-docs"
import { TranscriptionIllustration } from "./illustrations/transcription"
import { SharingIllustration } from "./illustrations/sharing"
import { SecurityIllustration } from "./illustrations/security"

const featureDetails = [
  {
    id: "voice-recording",
    icon: Mic,
    title: "Voice Recording",
    headline: "Speak naturally. We handle the rest.",
    description:
      "Just talk about your patient like you would to a colleague. Kinroster's AI assistant guides you through the key areas — mood, meals, medications, mobility — so nothing gets missed. No forms, no typing, no learning curve.",
    benefits: [
      "Conversational AI that adapts to your pace",
      "Covers all required documentation areas automatically",
      "Works on any device with a microphone",
      "Average session under 2 minutes",
    ],
    Illustration: VoiceRecordingIllustration,
  },
  {
    id: "ai-processing",
    icon: Brain,
    title: "AI Processing",
    headline: "Clinical-grade intelligence behind every note.",
    description:
      "Your voice recording is processed by Claude AI, which understands medical context, extracts key observations, and flags anything that needs attention — from missed medications to behavioral changes.",
    benefits: [
      "Understands medical terminology and context",
      "Automatically detects incidents and anomalies",
      "Separates observations into structured categories",
      "Grounded in caregiver observations — never invents details not in the input",
    ],
    Illustration: AiProcessingIllustration,
  },
  {
    id: "smart-documentation",
    icon: FileText,
    title: "Smart Documentation",
    headline: "Professional shift notes from a casual conversation.",
    description:
      "Your free-form voice observations become structured, professional clinical documentation. Each note is organized into relevant sections — mood, nutrition, mobility, medications — with a summary, follow-up items, and incident flags.",
    benefits: [
      "Structured sections match regulatory requirements",
      "Automatic incident flagging with one-click report generation",
      "Consistent format across all caregivers",
      "Full audit trail from raw voice to final note",
    ],
    Illustration: SmartDocsIllustration,
  },
  {
    id: "instant-transcription",
    icon: Zap,
    title: "Real-Time Conversation",
    headline: "Talk to an AI that actually listens.",
    description:
      "Unlike dictation tools that just transcribe, Kinroster has a real conversation with you. It asks follow-up questions, clarifies details, and ensures you've covered everything the next shift needs to know.",
    benefits: [
      "Streaming voice recognition for real-time back-and-forth",
      "Sub-second response time for natural conversation",
      "Asks follow-up questions when details are missing",
      "Handles accents and medical terminology",
    ],
    Illustration: TranscriptionIllustration,
  },
  {
    id: "easy-sharing",
    icon: Share2,
    title: "Easy Sharing",
    headline: "The right people see the right information.",
    description:
      "Structured notes flow automatically to where they're needed. Families get friendly updates, doctors get clinical summaries, and your team gets shift handoff context — all from the same voice conversation.",
    benefits: [
      "Auto-generated family-friendly updates via email",
      "Team handoff notes for shift changes",
      "Incident reports with one-click escalation",
      "EMR-compatible export formats (coming soon)",
    ],
    Illustration: SharingIllustration,
  },
  {
    id: "security",
    icon: Lock,
    title: "Compliance-Ready",
    headline: "Built for healthcare from day one.",
    description:
      "Patient data deserves the highest protection. Kinroster ships concrete compliance primitives — not generic encryption promises — so your security review has real code to inspect, not marketing copy. Every disclosure is logged, every sensitive note is segregated, every clinician share is revocable.",
    benefits: [
      "Row-Level Security on every PHI table",
      "Append-only audit + disclosure ledgers",
      "42 CFR Part 2 segregation with explicit-unlock workflow",
      "Revocable magic-link clinician portals + resident data export",
    ],
    Illustration: SecurityIllustration,
  },
]

export function FeatureDetails() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-20 md:space-y-28">
        {featureDetails.map((feature, index) => {
          const Icon = feature.icon
          const isReversed = index % 2 === 1

          return (
            <div
              key={feature.id}
              id={feature.id}
              className={`flex flex-col items-center gap-8 scroll-mt-20 md:flex-row md:gap-12 ${
                isReversed ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Illustration */}
              <div className="w-full max-w-sm text-primary md:w-1/2">
                <feature.Illustration />
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {feature.title}
                  </span>
                </div>

                <h3 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
                  {feature.headline}
                </h3>

                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
