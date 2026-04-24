import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Support - Kinroster",
  description: "Get help with Kinroster. Find answers to common questions and contact our support team.",
}

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Support</h1>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          We are here to help you get the most out of Kinroster. Find answers to common questions
          below, or reach out to our support team directly.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
        <p className="text-muted-foreground leading-relaxed">
          For questions, issues, or feedback, please contact our support team:
        </p>
        <p className="text-muted-foreground">
          Email:{" "}
          <a href="mailto:support@kinroster.app" className="text-primary underline hover:no-underline">
            support@kinroster.app
          </a>
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We aim to respond to all inquiries within one business day.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">How do I start a voice note?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Navigate to a resident&apos;s profile and tap the voice note button to begin a new
            documentation session. Speak naturally about your observations, care activities, and any
            concerns. The AI assistant will guide you through the conversation and ask clarifying
            questions as needed. When you are finished, the system will automatically generate a
            structured care note from your voice input.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">
            Why was my note flagged as an incident?
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Kinroster&apos;s AI automatically analyzes care notes for potential incidents such as falls,
            behavioral changes, skin integrity concerns, medication issues, or other events that may
            require follow-up. When the AI detects language or descriptions that match incident
            criteria, it flags the note for review. This is an advisory feature designed to help
            ensure important events are not overlooked. You can review, confirm, or dismiss flagged
            incidents from the notes detail view.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Can I edit a structured note?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Yes. After the AI generates a structured note from your voice input, you can review and
            edit any section before finalizing it. We encourage all caregivers to review AI-generated
            notes for accuracy and completeness. Edits are tracked to maintain documentation integrity.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">How do I add a new resident?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Administrators and authorized staff can add new residents from the Residents section of
            the dashboard. Click the &quot;Add Resident&quot; button and fill in the required
            information including name, date of birth, and any relevant care details. Once added,
            the resident will be available for voice documentation sessions.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">Is my data secure?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Yes. Kinroster implements multiple layers of security to protect your data, including
            encryption at rest and in transit, row-level security policies that isolate organization
            data, role-based access controls, and secure authentication. For detailed information
            about our security practices, please visit our{" "}
            <Link href="/hipaa" className="text-primary underline hover:no-underline">
              HIPAA Compliance
            </Link>{" "}
            page.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-foreground">How does the AI work?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Kinroster uses a multi-step AI pipeline to transform your voice into structured
            documentation. First, your speech is transcribed into text using advanced speech
            recognition. Then, the AI analyzes the transcript to extract clinical observations,
            care activities, and other relevant details, organizing them into a standardized care
            note format. The AI also checks for potential incidents and flags them for your review.
            Throughout this process, the AI is designed to assist and augment your documentation
            workflow, not replace your clinical judgment.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Learn More</h2>
        <p className="text-muted-foreground leading-relaxed">
          Explore more about what Kinroster offers:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <Link href="/#features" className="text-primary underline hover:no-underline">
              Features
            </Link>{" "}
            -- See all the ways Kinroster helps streamline care documentation.
          </li>
          <li>
            <Link href="/#how-it-works" className="text-primary underline hover:no-underline">
              How it Works
            </Link>{" "}
            -- Understand the voice-to-documentation workflow.
          </li>
          <li>
            <Link href="/hipaa" className="text-primary underline hover:no-underline">
              HIPAA Compliance
            </Link>{" "}
            -- Learn about our security and compliance measures.
          </li>
          <li>
            <Link href="/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </Link>{" "}
            -- Review how we handle your data.
          </li>
        </ul>
      </section>
    </div>
  )
}
