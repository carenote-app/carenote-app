import { describe, it, expect } from "vitest";
import { reminderDue, daysUntil } from "../trial-reminders";

describe("daysUntil", () => {
  it("returns 7 when the target is exactly 7 days away (ceil rounds up partial-day deltas)", () => {
    const now = new Date("2026-04-28T09:00:00Z");
    const target = new Date("2026-05-05T09:00:00Z");
    expect(daysUntil(target, now)).toBe(7);
  });

  it("returns 1 when the target is exactly tomorrow", () => {
    const now = new Date("2026-04-28T09:00:00Z");
    const target = new Date("2026-04-29T09:00:00Z");
    expect(daysUntil(target, now)).toBe(1);
  });

  it("returns 0 when target is the same instant", () => {
    const now = new Date("2026-04-28T09:00:00Z");
    expect(daysUntil(now, now)).toBe(0);
  });

  it("returns 0 (or negative) once the target has passed", () => {
    const now = new Date("2026-04-28T09:00:00Z");
    const target = new Date("2026-04-27T09:00:00Z");
    expect(daysUntil(target, now)).toBeLessThanOrEqual(0);
  });

  it("rounds up partial days (a target 6 days + 6 hours away counts as 7)", () => {
    const now = new Date("2026-04-28T09:00:00Z");
    const target = new Date("2026-05-04T15:00:00Z");
    expect(daysUntil(target, now)).toBe(7);
  });
});

describe("reminderDue", () => {
  it("returns 'trial_7_day' when exactly 7 days remain on a trial", () => {
    expect(reminderDue(7, "trial")).toBe("trial_7_day");
  });

  it("returns 'trial_1_day' on the last day of a trial", () => {
    expect(reminderDue(1, "trial")).toBe("trial_1_day");
  });

  it("returns 'trial_expired' once the trial has lapsed but org is still in trial status", () => {
    expect(reminderDue(0, "trial")).toBe("trial_expired");
    expect(reminderDue(-3, "trial")).toBe("trial_expired");
  });

  it("returns null on days other than T-7 / T-1 / expired (doesn't spam)", () => {
    expect(reminderDue(14, "trial")).toBeNull();
    expect(reminderDue(8, "trial")).toBeNull();
    expect(reminderDue(6, "trial")).toBeNull();
    expect(reminderDue(5, "trial")).toBeNull();
    expect(reminderDue(2, "trial")).toBeNull();
  });

  it("returns null for any non-trial subscription status", () => {
    // Active / past_due / canceled orgs don't get trial reminders even if
    // their old trial_ends_at would qualify.
    expect(reminderDue(7, "active")).toBeNull();
    expect(reminderDue(1, "past_due")).toBeNull();
    expect(reminderDue(0, "canceled")).toBeNull();
    expect(reminderDue(-5, "active")).toBeNull();
  });
});
