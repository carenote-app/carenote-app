import { describe, it, expect } from "vitest";
import { CLINICIAN_SUMMARY_SYSTEM_PROMPT } from "../clinician-summary";

// Regression guards. Unlike the weekly summary, this prompt's audience is
// a treating physician (HCP) — clinical register is appropriate. But the
// audience must remain unambiguously HCP for that to hold under the FDA
// Non-Device CDS exemption.

describe("CLINICIAN_SUMMARY_SYSTEM_PROMPT — HCP audience guard", () => {
  it("declares the recipient IS a medical professional", () => {
    expect(CLINICIAN_SUMMARY_SYSTEM_PROMPT).toMatch(
      /recipient IS a medical professional/i
    );
  });

  it("identifies the recipient as a treating physician", () => {
    expect(CLINICIAN_SUMMARY_SYSTEM_PROMPT).toMatch(/treating physician/i);
  });

  it("forbids speculation, diagnosis, and specific treatment recommendation", () => {
    expect(CLINICIAN_SUMMARY_SYSTEM_PROMPT).toMatch(
      /Do NOT speculate, diagnose, or recommend specific treatment/i
    );
  });

  it("preserves the caregiver's factual observations exactly", () => {
    expect(CLINICIAN_SUMMARY_SYSTEM_PROMPT).toMatch(
      /Preserve the caregiver's factual observations exactly/i
    );
  });

  it("scopes follow_up_recommended to care-team-flagged items, not Claude's own recommendations", () => {
    expect(CLINICIAN_SUMMARY_SYSTEM_PROMPT).toMatch(
      /NOT your own recommendations/i
    );
  });
});
