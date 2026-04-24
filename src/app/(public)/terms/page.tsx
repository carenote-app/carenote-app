import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Kinroster",
  description: "Kinroster Terms of Service. Review the terms governing your use of our platform.",
}

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Kinroster
        application and related services (collectively, the &quot;Service&quot;) provided by Kinroster
        (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using the Service, you
        agree to be bound by these Terms.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          By creating an account or otherwise accessing the Service, you acknowledge that you have
          read, understood, and agree to be bound by these Terms, as well as our Privacy Policy and
          HIPAA Compliance documentation. If you are using the Service on behalf of an organization,
          you represent and warrant that you have the authority to bind that organization to these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
        <p className="text-muted-foreground leading-relaxed">
          Kinroster is an AI-powered clinical voice documentation platform designed for residential care
          facilities, including RCFEs, home care agencies, and similar healthcare settings. The Service
          enables caregivers to create structured clinical documentation through voice interaction with
          an AI assistant, which automatically organizes spoken observations into standardized care notes,
          detects potential incidents, and facilitates care coordination.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. User Accounts and Responsibilities</h2>
        <p className="text-muted-foreground leading-relaxed">
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activities that occur under your account. You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Provide accurate and complete registration information.</li>
          <li>Notify us immediately of any unauthorized access to or use of your account.</li>
          <li>Ensure that your use of the Service complies with all applicable laws and regulations,
            including healthcare privacy and data protection laws.</li>
          <li>Not share your account credentials with unauthorized individuals.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service is intended exclusively for healthcare documentation purposes within authorized
          care settings. You agree not to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Use the Service for any purpose other than legitimate healthcare documentation and care
            coordination.</li>
          <li>Attempt to access data belonging to other organizations or users.</li>
          <li>Reverse engineer, decompile, or otherwise attempt to derive the source code of the Service.</li>
          <li>Use the Service to store or transmit malicious code or content.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Use the Service in violation of any applicable healthcare regulations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. AI-Generated Content Disclaimer</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service uses artificial intelligence to process voice input and generate structured care
          documentation. You acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>AI-generated notes are intended as documentation aids and do not constitute medical advice,
            diagnosis, or treatment recommendations.</li>
          <li>All AI-generated content must be reviewed by a qualified caregiver or healthcare professional
            before being relied upon for clinical decision-making.</li>
          <li>The accuracy of AI-generated documentation depends on the quality and clarity of the voice
            input provided.</li>
          <li>Incident flags generated by the AI are advisory in nature and do not replace professional
            clinical judgment.</li>
          <li>You retain full responsibility for the accuracy and completeness of all care documentation
            submitted through the Service.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Service, including its software, design, features, and documentation, is owned by Kinroster
          and is protected by intellectual property laws. Your use of the Service does not grant you
          ownership of any intellectual property rights in the Service or its content. You retain
          ownership of the care documentation and data you create through the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
        <p className="text-muted-foreground leading-relaxed">
          To the maximum extent permitted by applicable law, Kinroster shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or any loss of profits
          or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
          or other intangible losses resulting from:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Your access to or use of, or inability to access or use, the Service.</li>
          <li>Any errors, inaccuracies, or omissions in AI-generated content.</li>
          <li>Unauthorized access to or alteration of your data or transmissions.</li>
          <li>Any third-party conduct or content on the Service.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          In no event shall our aggregate liability exceed the amount you paid us in the twelve (12)
          months preceding the claim.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Termination</h2>
        <p className="text-muted-foreground leading-relaxed">
          We may suspend or terminate your access to the Service at any time, with or without cause,
          upon reasonable notice. You may terminate your account at any time by contacting us. Upon
          termination, your right to use the Service will cease immediately, and we will handle your
          data in accordance with our Privacy Policy and applicable data retention requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
        <p className="text-muted-foreground leading-relaxed">
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by posting the updated Terms on the Service and updating the &quot;Last updated&quot;
          date. Your continued use of the Service after such changes constitutes your acceptance of the
          revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
        <p className="text-muted-foreground leading-relaxed">
          These Terms shall be governed by and construed in accordance with the laws of the State of
          California, without regard to its conflict of law provisions. Any disputes arising under or
          in connection with these Terms shall be subject to the exclusive jurisdiction of the state
          and federal courts located in the State of California.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">11. Contact Us</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you have questions about these Terms, please contact us at:
        </p>
        <p className="text-muted-foreground">
          Email:{" "}
          <a href="mailto:support@kinroster.app" className="text-primary underline hover:no-underline">
            support@kinroster.app
          </a>
        </p>
      </section>
    </div>
  )
}
