import { describe, it, expect } from "vitest";
import { redactPhi, redactPhiText, hasRedactions } from "@/lib/redaction";

describe("redaction", () => {
  it("redacts Taiwan ROC IDs", () => {
    const { text, stats } = redactPhi(
      "Patient ID A123456789. Backup card B287654321."
    );
    expect(text).not.toContain("A123456789");
    expect(text).not.toContain("B287654321");
    expect(text).toContain("[ROC_ID_REDACTED]");
    expect(stats.rocId).toBe(2);
  });

  it("redacts Vietnamese CCCD (12-digit)", () => {
    const { text, stats } = redactPhi("CCCD: 012345678901 cấp ngày...");
    expect(text).not.toContain("012345678901");
    expect(text).toContain("[CCCD_REDACTED]");
    expect(stats.cccd).toBe(1);
  });

  it("redacts Indonesian NIK (16-digit) before CCCD", () => {
    const { text, stats } = redactPhi("NIK 1234567890123456 born 1942-03-22");
    expect(text).toContain("[NIK_REDACTED]");
    expect(text).not.toContain("1234567890123456");
    expect(stats.nik).toBe(1);
    expect(stats.cccd).toBe(0);
  });

  it("redacts ISO and US-style DOBs into year bands", () => {
    const result = redactPhi("DOB 1942-12-01. Sister born 03/22/1985.");
    expect(result.text).toContain("early 1940s");
    expect(result.text).toContain("mid 1980s");
    expect(result.stats.dob).toBe(2);
  });

  it("redacts US street addresses", () => {
    const result = redactPhi("Family lives at 123 Main Street, Apt 4.");
    expect(result.text).toContain("[ADDRESS_REDACTED]");
    expect(result.text).not.toContain("123 Main Street");
    expect(result.stats.street).toBe(1);
  });

  it("redacts SSNs", () => {
    const result = redactPhi("SSN 123-45-6789 on file.");
    expect(result.text).toContain("[SSN_REDACTED]");
    expect(result.stats.ssn).toBe(1);
  });

  it("preserves resident first names and clinical content", () => {
    const text =
      "Dorothy was in good spirits, ate full lunch, walked 15 minutes in garden. Pain 4/10 in left hip.";
    const { text: out, stats } = redactPhi(text);
    expect(out).toBe(text);
    expect(hasRedactions(stats)).toBe(false);
  });

  it("redactPhiText returns just the redacted string", () => {
    const out = redactPhiText("ROC ID A123456789");
    expect(out).toContain("[ROC_ID_REDACTED]");
  });

  it("hasRedactions reports zero for clean text", () => {
    const { stats } = redactPhi("nothing sensitive here, ate cereal");
    expect(hasRedactions(stats)).toBe(false);
  });

  it("handles empty input", () => {
    const { text, stats } = redactPhi("");
    expect(text).toBe("");
    expect(stats.rocId).toBe(0);
  });
});
