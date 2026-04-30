import { describe, it, expect } from "vitest";
import {
  CAREGIVER_SUMMARY_SYSTEM_PROMPT,
  buildCaregiverSummaryUserPrompt,
} from "../caregiver-summary";

describe("CAREGIVER_SUMMARY_SYSTEM_PROMPT", () => {
  it("encodes the key invariants the route relies on", () => {
    // The route depends on these to keep summaries safe + readable.
    // If any of these change the route's downstream rendering may need
    // to update too, so we pin them via tests rather than snapshotting.
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/plain text only/i);
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/first name/i);
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/observational/i);
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/no clinical jargon/i);
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/no recommendations/i);
    expect(CAREGIVER_SUMMARY_SYSTEM_PROMPT).toMatch(/no markdown headers/i);
  });
});

describe("buildCaregiverSummaryUserPrompt", () => {
  it("includes the resident first name and range label", () => {
    const out = buildCaregiverSummaryUserPrompt({
      residentFirstName: "Dorothy",
      rangeLabel: "the last 8 hours",
      notes: [],
    });
    expect(out).toContain("Resident first name: Dorothy");
    expect(out).toContain("Period being summarised: the last 8 hours");
    expect(out).toContain("Note count: 0");
  });

  it("formats each note in [timestamp — author — shift] shape", () => {
    const out = buildCaregiverSummaryUserPrompt({
      residentFirstName: "Dorothy",
      rangeLabel: "today",
      notes: [
        {
          created_at: "2026-04-30T09:00:00Z",
          author_name: "James Wilson",
          shift: "morning",
          structured_output: "{\"summary\":\"Calm morning.\"}",
        },
        {
          created_at: "2026-04-30T18:00:00Z",
          author_name: "Maria Santos",
          shift: null,
          structured_output: "{\"summary\":\"Quiet evening.\"}",
        },
      ],
    });

    expect(out).toContain("[2026-04-30T09:00:00Z — James Wilson — morning]");
    expect(out).toContain("[2026-04-30T18:00:00Z — Maria Santos — unspecified]");
    // Each note's structured output appears next to its header
    expect(out).toContain("Calm morning.");
    expect(out).toContain("Quiet evening.");
    // Notes are separated by --- so the model can tell them apart
    expect(out.match(/^---$/gm)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("renders the empty-set case with a stable placeholder", () => {
    const out = buildCaregiverSummaryUserPrompt({
      residentFirstName: "Dorothy",
      rangeLabel: "today",
      notes: [],
    });
    expect(out).toContain("(no notes)");
  });
});
