import { describe, it, expect } from "vitest";
import { WEEKLY_SUMMARY_SYSTEM_PROMPT } from "../weekly-summary";

// Regression guards. The weekly summary is read by facility administrators
// (not licensed clinicians), so under FDA Non-Device CDS analysis its
// language must stay observational / documentation-focused. These tests
// catch silent re-introductions of clinical-recommendation phrasing.

describe("WEEKLY_SUMMARY_SYSTEM_PROMPT — non-clinical phrasing guard", () => {
  it("declares the reader is NOT a treating clinician", () => {
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toMatch(/NOT a treating clinician/i);
  });

  it("explicitly flags itself as documentation, not clinical assessment", () => {
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toMatch(/NOT a clinical assessment/i);
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toMatch(/documentation aid/i);
  });

  it("forbids the clinical-flavored words we audited out", () => {
    const forbidden = [
      "concerning",
      "elevated risk",
      "deteriorating",
      "requires intervention",
      "warrants monitoring",
      "should be evaluated for",
      "indicative of",
    ];
    for (const phrase of forbidden) {
      expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toContain(phrase);
    }
  });

  it("blocks medical diagnoses, treatment recommendations, and risk classifications", () => {
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toMatch(
      /Do NOT make medical diagnoses, treatment recommendations, or risk classifications/i
    );
  });

  it("keeps the 'concerns' JSON key for backward compatibility with stored data", () => {
    // The DB column is named `concerns text[]`; renaming would be a
    // breaking change. The regulatory fix is in the *content*, not the key.
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toContain('"concerns"');
  });

  it("instructs Claude to quantify ('falls documented: 2', 'meal intake below 50% on 4 of 7 days') rather than evaluate severity", () => {
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).toMatch(/Quantify when you can/i);
  });

  it("does not contain the old 'concerning patterns that warrant continued monitoring' framing", () => {
    expect(WEEKLY_SUMMARY_SYSTEM_PROMPT).not.toMatch(
      /concerning patterns that warrant continued monitoring/i
    );
  });
});
