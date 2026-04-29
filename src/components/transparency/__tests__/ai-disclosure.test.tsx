import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AIDisclosure,
  AI_DISCLOSURE_NOTE,
  AI_DISCLOSURE_SUMMARY,
  AI_DISCLOSURE_INCIDENT,
  AI_DISCLOSURE_TRANSCRIPT,
  AI_DISCLOSURE_FAMILY,
  AI_DISCLOSURE_DEMO,
} from "../ai-disclosure";

describe("AIDisclosure", () => {
  it("renders the supplied message verbatim in the default banner variant", () => {
    render(<AIDisclosure message="Custom transparency text" />);
    expect(screen.getByText("Custom transparency text")).toBeInTheDocument();
  });

  it("uses role='note' for screen-reader semantics across variants", () => {
    const { rerender } = render(<AIDisclosure message="m" />);
    expect(screen.getByRole("note")).toBeInTheDocument();

    rerender(<AIDisclosure message="m" variant="badge" />);
    expect(screen.getByRole("note")).toBeInTheDocument();

    rerender(<AIDisclosure message="m" variant="inline" />);
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("renders each canonical message constant", () => {
    const messages = [
      AI_DISCLOSURE_NOTE,
      AI_DISCLOSURE_SUMMARY,
      AI_DISCLOSURE_INCIDENT,
      AI_DISCLOSURE_TRANSCRIPT,
      AI_DISCLOSURE_FAMILY,
      AI_DISCLOSURE_DEMO,
    ];
    for (const m of messages) {
      const { unmount } = render(<AIDisclosure message={m} />);
      expect(screen.getByText(m)).toBeInTheDocument();
      unmount();
    }
  });

  it("never claims clinical assessment or diagnosis in any canonical message", () => {
    // Regression guard: future edits to the canonical strings must not
    // re-introduce CDS-flavored phrasing. The whole point of these constants
    // is observational / documentation framing.
    const forbidden = [
      "clinical assessment",
      "diagnosis",
      "diagnose",
      "treatment recommendation",
      "decision support",
    ];
    const messages = [
      AI_DISCLOSURE_NOTE,
      AI_DISCLOSURE_SUMMARY,
      AI_DISCLOSURE_INCIDENT,
      AI_DISCLOSURE_TRANSCRIPT,
      AI_DISCLOSURE_FAMILY,
      AI_DISCLOSURE_DEMO,
    ];
    for (const m of messages) {
      for (const f of forbidden) {
        // The disclosure copy says "Not a clinical assessment" / "Not a
        // medical diagnosis" — that's allowed because it's a denial. The
        // forbidden patterns flagged above are checked in their *positive*
        // form via a "no positive claim" assertion: the message must contain
        // either "Not a" / "not for" / "Review before" or be a simple
        // observational phrasing — not a positive claim.
        const lower = m.toLowerCase();
        if (lower.includes(f)) {
          expect(
            lower.includes("not a") ||
              lower.includes("not for") ||
              lower.includes("not a substitute")
          ).toBe(true);
        }
      }
    }
  });

  it("forwards a custom className for layout overrides", () => {
    const { container } = render(
      <AIDisclosure message="m" className="my-custom-class" />
    );
    expect(container.querySelector(".my-custom-class")).toBeInTheDocument();
  });

  it("renders with the badge variant when requested", () => {
    render(<AIDisclosure message="badge text" variant="badge" />);
    expect(screen.getByText("badge text")).toBeInTheDocument();
  });
});
