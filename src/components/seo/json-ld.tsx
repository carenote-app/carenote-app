// Server-rendered JSON-LD blocks. Each helper returns a <script
// type="application/ld+json"> element that emits a Schema.org graph.
// Mount in server components; the JSON gets baked into the static HTML
// so crawlers see it on first byte.
//
// Why three separate helpers (vs. one big graph): the audiences differ.
// Organization belongs in the root layout (every page advertises the
// company). SoftwareApplication is landing-only (it's the product
// surface). FAQPage is /support-only (rich-result eligibility depends
// on the page actually containing the Q&A markup the schema describes).

import type { ReactElement } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://kinroster.com";
const SITE_NAME = "Kinroster";

interface JsonLdProps<T> {
  data: T;
}

// Render the JSON without any pretty-printing — fewer bytes shipped to
// every visitor. Crawlers don't care about whitespace.
function JsonLd<T>({ data }: JsonLdProps<T>): ReactElement {
  return (
    <script
      type="application/ld+json"
      // The dangerously prefix is the standard React escape hatch for
      // raw HTML. The data here is structured under our control (no
      // user input), so no XSS surface.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd(): ReactElement {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/apple-touch-icon.png`,
        description:
          "AI-powered documentation for residential care homes. Voice-first capture, structured shift logs, incident reports, and family updates.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@kinroster.com",
          contactType: "customer support",
          areaServed: "US",
          availableLanguage: ["English"],
        },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd(): ReactElement {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Healthcare",
        operatingSystem: "Web",
        description:
          "Voice-first documentation tool for residential care homes. Turn caregiver shift observations into structured notes, incident reports, and family updates with HIPAA-ready architecture.",
        // Pricing is contact-us today; signal availability without
        // committing to a public number. Once published pricing exists
        // we should migrate this to a real Offer with priceCurrency +
        // price.
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
          price: "0",
        },
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
      }}
    />
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqPageJsonLd({ faqs }: { faqs: FaqItem[] }): ReactElement {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      }}
    />
  );
}
