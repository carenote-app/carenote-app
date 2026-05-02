import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  FaqPageJsonLd,
} from "../json-ld";

// Render the component to static HTML, pull the JSON out of the
// dangerouslySetInnerHTML payload, and parse. Lets us assert on the
// structured-data shape itself rather than the React tree wrapping it.
function extractJson(node: React.ReactElement): Record<string, unknown> {
  const html = renderToStaticMarkup(node);
  const match = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error("no ld+json script tag rendered");
  return JSON.parse(match[1]) as Record<string, unknown>;
}

describe("OrganizationJsonLd", () => {
  it("emits a valid Schema.org Organization with the canonical fields", () => {
    const data = extractJson(<OrganizationJsonLd />);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("Kinroster");
    expect(data.url).toMatch(/^https?:\/\/.+/);
    expect(data.logo).toMatch(/^https?:\/\/.+/);
  });

  it("includes a customer-support contactPoint for knowledge-panel eligibility", () => {
    const data = extractJson(<OrganizationJsonLd />);
    const contact = data.contactPoint as Record<string, unknown>;
    expect(contact["@type"]).toBe("ContactPoint");
    expect(contact.contactType).toBe("customer support");
    expect(contact.email).toMatch(/@/);
  });
});

describe("SoftwareApplicationJsonLd", () => {
  it("declares the right application category for healthcare-software SERPs", () => {
    const data = extractJson(<SoftwareApplicationJsonLd />);
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.applicationCategory).toBe("BusinessApplication");
    expect(data.applicationSubCategory).toBe("Healthcare");
    expect(data.operatingSystem).toBe("Web");
  });

  it("ships an Offer block with InStock availability so listings render", () => {
    const data = extractJson(<SoftwareApplicationJsonLd />);
    const offers = data.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.availability).toBe("https://schema.org/InStock");
    // Pricing is contact-us today; we still emit a placeholder so Google
    // does not reject the SoftwareApplication block for lacking offers.
    expect(offers.priceCurrency).toBe("USD");
  });
});

describe("FaqPageJsonLd", () => {
  it("maps each FAQ to a Question/acceptedAnswer pair", () => {
    const data = extractJson(
      <FaqPageJsonLd
        faqs={[
          { question: "How do I start a voice note?", answer: "Tap the mic." },
          { question: "Is my data secure?", answer: "Yes; RLS + audit log." },
        ]}
      />
    );
    expect(data["@type"]).toBe("FAQPage");
    const main = data.mainEntity as Array<Record<string, unknown>>;
    expect(main).toHaveLength(2);
    expect(main[0]["@type"]).toBe("Question");
    expect(main[0].name).toBe("How do I start a voice note?");
    const answer = main[0].acceptedAnswer as Record<string, unknown>;
    expect(answer["@type"]).toBe("Answer");
    expect(answer.text).toBe("Tap the mic.");
  });

  it("renders an empty mainEntity array when given no FAQs (still valid Schema.org)", () => {
    const data = extractJson(<FaqPageJsonLd faqs={[]} />);
    const main = data.mainEntity as Array<unknown>;
    expect(Array.isArray(main)).toBe(true);
    expect(main).toHaveLength(0);
  });
});
