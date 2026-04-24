import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HIPAA Readiness - Kinroster",
  description: "Current state of Kinroster's HIPAA readiness program — what's built, what's pending, and how BAAs are handled at customer onboarding.",
}

export default function HipaaCompliancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">HIPAA Readiness</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        Kinroster is built with HIPAA (Health Insurance Portability and Accountability Act) and
        42 CFR Part 2 requirements in mind. This page describes our technical architecture, the
        safeguards we have shipped, and the compliance program items we finalize at the time of
        customer onboarding. We aim to be explicit about current state rather than making blanket
        compliance claims.
      </p>

      <section className="space-y-3 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Current Compliance Posture</h2>
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">What&apos;s shipped (architecture):</span>{" "}
          A 9-phase compliance architecture covering the data model, append-only audit and
          disclosure ledgers, role-based access with ops/billing blocked from clinical content,
          sensitive-data segregation (42 CFR Part 2 and psychotherapy), session controls, and
          resident data rights (synchronous JSON export, two-step delete with tombstone ledger).
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">What&apos;s finalized at onboarding:</span>{" "}
          Business Associate Agreements with Kinroster and our upstream vendor stack, qualified
          healthcare counsel review tailored to the customer&apos;s state regulatory profile,
          Notice of Privacy Practices, incident response runbook, and workforce training
          tracking. We do not use &ldquo;HIPAA Compliant&rdquo; as a self-certification label;
          HIPAA has no certification body. Organizations planning to handle real PHI should
          contact us so we can align on BAA status and counsel review before go-live.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Our Approach to HIPAA</h2>
        <p className="text-muted-foreground leading-relaxed">
          As a platform that processes protected health information on behalf of healthcare
          organizations, Kinroster implements technical, administrative, and physical safeguards
          designed to meet the requirements of the HIPAA Security Rule and Privacy Rule. Our
          approach is additive: we ship the technical primitives in software first, then layer
          the administrative program (policies, training, BAAs, counsel review) at the point of
          each customer&apos;s onboarding so the compliance artifacts match that organization&apos;s
          specific vendor stack and state regulatory environment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Technical Safeguards</h2>
        <p className="text-muted-foreground leading-relaxed">
          We implement the following technical measures to protect PHI. Each item is a
          concrete primitive shipped in code, not a design intent:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Encryption:</span> All data is encrypted
            in transit using TLS. Data at rest is encrypted by our database provider (Supabase)
            using AES-256.
          </li>
          <li>
            <span className="font-medium text-foreground">Row-Level Security (RLS):</span> Database-level
            security policies ensure that each organization can only access its own data. RLS is enforced
            on every PHI table at the database layer, preventing unauthorized cross-organization data
            access even in the event of an application-level vulnerability.
          </li>
          <li>
            <span className="font-medium text-foreground">Role-Based Access:</span> Six roles —
            admin, caregiver, nurse reviewer, operations staff, billing staff, compliance admin
            — with different access scopes. Operations and billing roles are blocked from
            clinical content at the RLS layer.
          </li>
          <li>
            <span className="font-medium text-foreground">Sensitive Data Segregation:</span>{" "}
            Notes touching 42 CFR Part 2 substance-use content or psychotherapy notes are
            automatically flagged and hidden from the general org view. Access requires an
            explicit per-user grant or an explicit unlock by an admin during external sharing.
          </li>
          <li>
            <span className="font-medium text-foreground">Append-Only Audit Log:</span> All
            security-relevant actions — logins, share creation and opens, share revokes,
            note changes, sensitive-access grants and revokes — are written to an append-only
            audit ledger with no update or delete path. Admins can filter, review, and export
            the log via a dedicated page.
          </li>
          <li>
            <span className="font-medium text-foreground">Disclosure Ledger:</span> Every
            outbound disclosure of PHI — to a clinician via the portal, to a family contact
            via email — is recorded on a separate append-only disclosure ledger with the
            recipient, legal basis, data categories shared, and source note references.
            This supports the HIPAA &ldquo;accounting of disclosures&rdquo; requirement.
          </li>
          <li>
            <span className="font-medium text-foreground">Session Controls:</span> Authenticated
            sessions auto-expire after 15 minutes idle. The clinician magic-link portal is
            rate-limited per token and per IP to block token-guessing attempts.
          </li>
          <li>
            <span className="font-medium text-foreground">Secure APIs:</span> All API endpoints
            require authentication and enforce authorization checks before processing requests
            involving PHI.
          </li>
          <li>
            <span className="font-medium text-foreground">Data Subject Rights:</span> Admins
            can export a full resident record as a downloadable JSON bundle and run a
            two-step deletion flow (soft-delete with optional restore, then manual purge
            with a required reason and tombstone ledger entry).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. Administrative Safeguards</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our administrative controls include:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Organization-Scoped Data:</span> All patient
            data is strictly scoped to the organization that created it. There is no shared data
            environment between organizations.
          </li>
          <li>
            <span className="font-medium text-foreground">Role-Based Access:</span> Users are assigned
            roles (administrator, caregiver, etc.) that determine their level of access to patient
            records and system features.
          </li>
          <li>
            <span className="font-medium text-foreground">Security Policies:</span> We maintain
            documented security policies and procedures covering data handling, incident response,
            and workforce training.
          </li>
          <li>
            <span className="font-medium text-foreground">Minimum Necessary Standard:</span> Access
            to PHI is limited to the minimum amount of information necessary for each user to perform
            their job functions.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Physical Safeguards</h2>
        <p className="text-muted-foreground leading-relaxed">
          Kinroster operates on cloud infrastructure provided by third-party vendors. The
          HIPAA-grade configuration of each vendor (HIPAA-eligible tier, signed BAA with
          Kinroster, appropriate data residency) is finalized at customer onboarding based on
          the customer&apos;s own regulatory environment:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Supabase</span> (database infrastructure):
            runs on AWS data centers with physical access controls and environmental protections.
            HIPAA-eligible tier enablement and BAA signing are part of onboarding for customers
            handling real PHI.
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel</span> (application hosting):
            secure hosting infrastructure with encrypted storage and network isolation. HIPAA
            configuration follows the customer&apos;s deployment tier and BAA terms.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Voice Data Handling</h2>
        <p className="text-muted-foreground leading-relaxed">
          Voice documentation is a core feature of Kinroster, and we take special care in how voice
          data is handled:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Voice interactions are processed by Vapi, our voice AI infrastructure provider, which
            handles real-time audio streaming and call orchestration.</li>
          <li>For standalone transcription (outside the Vapi conversational flow), speech-to-text
            is performed by OpenAI&apos;s Whisper API. Audio blobs are streamed directly to the
            transcription endpoint and are not persisted by Kinroster.</li>
          <li>Transcripts are stored in encrypted form within the organization&apos;s data scope and
            are subject to all RLS and access control policies.</li>
          <li>Raw audio recordings are not persistently stored by Kinroster.</li>
          <li>An organization-level setting allows turn-by-turn transcript retention to be turned
            off; when off, transcripts are deleted after the structured note is produced, while
            the note itself (source of truth) is retained.</li>
          <li>Every voice-generated note is additionally passed through a fast sanity check that
            flags over-capture (financial detail, references to other residents, unrelated personal
            content) so admins can review before external sharing. The warning is informational
            and does not block save.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. AI Processing</h2>
        <p className="text-muted-foreground leading-relaxed">
          Kinroster uses Anthropic&apos;s Claude AI to process transcripts and generate structured care
          documentation. Our AI processing is designed with the following safeguards:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Claude processes transcript data to generate structured notes but does not retain or
            store patient data after processing is complete.</li>
          <li>AI processing occurs through secure API connections with encryption in transit.</li>
          <li>Patient data sent for AI processing is limited to the minimum necessary for documentation
            purposes.</li>
          <li>AI-generated outputs are stored within the organization&apos;s secure, RLS-protected
            data environment.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Business Associate Agreements</h2>
        <p className="text-muted-foreground leading-relaxed">
          HIPAA requires covered entities to enter into Business Associate Agreements (BAAs)
          with service providers that handle PHI. BAAs are finalized at customer onboarding
          alongside the vendor-stack alignment: Kinroster signs with the customer, and we align
          upstream BAAs with each sub-processor (Supabase, Anthropic, OpenAI, Vapi, Resend,
          Stripe, Vercel) whose HIPAA-eligible tier is in play for that customer. We do not
          publish BAAs before customer conversations because the right vendor terms depend on
          the customer&apos;s chosen tier and deployment profile.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Organizations planning to handle real PHI and requiring a signed BAA should contact us at{" "}
          <a href="mailto:support@kinroster.app" className="text-primary underline hover:no-underline">
            support@kinroster.app
          </a>{" "}
          to discuss your compliance timeline and vendor requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Incident Response</h2>
        <p className="text-muted-foreground leading-relaxed">
          Kinroster commits to the following incident response obligations with any organization
          that signs a BAA with us:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Immediate containment and investigation of suspected breaches.</li>
          <li>Notification to affected organizations within the timeframes required by HIPAA
            (no later than 60 days from discovery).</li>
          <li>Cooperation with affected organizations in their own breach notification obligations.</li>
          <li>Documentation and analysis of incidents to prevent recurrence.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          The formal incident response runbook and periodic tabletop exercises are finalized as
          part of the customer onboarding compliance program; ask us for the current state when
          you contact us about a BAA.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          This page describes current state, not an aspirational compliance label. Organizations
          planning to handle real PHI should contact us at{" "}
          <a href="mailto:support@kinroster.app" className="text-primary underline hover:no-underline">
            support@kinroster.app
          </a>{" "}
          so we can align on BAA status, counsel review, and vendor-tier configuration before
          go-live. For questions about the shipped architecture or the items finalized at
          onboarding, please reach out.
        </p>
      </section>
    </div>
  )
}
