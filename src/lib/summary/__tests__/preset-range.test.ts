import { describe, it, expect } from "vitest";
import { presetToRange } from "../preset-range";

describe("presetToRange", () => {
  describe("today", () => {
    it("returns midnight in the org timezone for a Pacific facility", () => {
      // 2026-04-30 18:00 UTC = 2026-04-30 11:00 PDT — same calendar day in LA.
      const now = new Date("2026-04-30T18:00:00Z");
      const result = presetToRange("today", now, "America/Los_Angeles");

      // Midnight local LA on April 30 = 07:00 UTC during PDT.
      expect(result.start.toISOString()).toBe("2026-04-30T07:00:00.000Z");
      expect(result.end.toISOString()).toBe(now.toISOString());
      expect(result.rangeLabel).toBe("today");
    });

    it("respects facility timezone when UTC has rolled into the next day", () => {
      // 2026-05-01 03:00 UTC = 2026-04-30 20:00 PDT — still April 30 in LA.
      const now = new Date("2026-05-01T03:00:00Z");
      const result = presetToRange("today", now, "America/Los_Angeles");

      // Midnight local LA April 30 = April 30 07:00 UTC.
      expect(result.start.toISOString()).toBe("2026-04-30T07:00:00.000Z");
    });

    it("respects an Eastern timezone correctly", () => {
      // 2026-04-30 18:00 UTC = 2026-04-30 14:00 EDT.
      const now = new Date("2026-04-30T18:00:00Z");
      const result = presetToRange("today", now, "America/New_York");

      // Midnight local NY April 30 = April 30 04:00 UTC during EDT.
      expect(result.start.toISOString()).toBe("2026-04-30T04:00:00.000Z");
    });

    it("handles the spring-forward DST boundary without losing an hour", () => {
      // DST starts in LA on 2026-03-08 at 02:00 local. Use a `now` after
      // the transition so the local-midnight offset is the new (PDT) one.
      const now = new Date("2026-03-08T18:00:00Z");
      const result = presetToRange("today", now, "America/Los_Angeles");

      // Local midnight LA on March 8 was at 08:00 UTC (still PST that
      // instant, since the spring-forward happens at 02:00 local).
      expect(result.start.toISOString()).toBe("2026-03-08T08:00:00.000Z");
    });
  });

  describe("this_shift", () => {
    it("is the rolling 8 hours before now, regardless of timezone", () => {
      const now = new Date("2026-04-30T18:00:00Z");
      const result = presetToRange("this_shift", now, "America/Los_Angeles");

      expect(result.start.toISOString()).toBe("2026-04-30T10:00:00.000Z");
      expect(result.end.toISOString()).toBe(now.toISOString());
      expect(result.rangeLabel).toBe("the last 8 hours");
    });
  });

  describe("last_24h", () => {
    it("is the rolling 24 hours before now", () => {
      const now = new Date("2026-04-30T18:00:00Z");
      const result = presetToRange("last_24h", now, "America/New_York");

      expect(result.start.toISOString()).toBe("2026-04-29T18:00:00.000Z");
      expect(result.rangeLabel).toBe("the last 24 hours");
    });
  });

  describe("this_week", () => {
    it("is the rolling 7 days before now", () => {
      const now = new Date("2026-04-30T18:00:00Z");
      const result = presetToRange("this_week", now, "America/Los_Angeles");

      expect(result.start.toISOString()).toBe("2026-04-23T18:00:00.000Z");
      expect(result.rangeLabel).toBe("the last 7 days");
    });
  });
});
