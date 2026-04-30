// Resolves a date-range preset for the on-demand caregiver summary into
// concrete start/end UTC instants plus a human-readable label. Pure
// function — no I/O, easy to unit-test in isolation.
//
// Timezone matters for "today" only: midnight depends on which calendar
// day is "today" in the facility's local time. The other presets are
// rolling windows expressed in absolute hours, so timezone is a no-op
// for them.

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfDay, subDays, subHours } from "date-fns";

export type SummaryPreset = "today" | "this_shift" | "last_24h" | "this_week";

export const SUMMARY_PRESETS: SummaryPreset[] = [
  "this_shift",
  "today",
  "last_24h",
  "this_week",
];

export interface RangeResult {
  start: Date;
  end: Date;
  rangeLabel: string;
}

export function presetToRange(
  preset: SummaryPreset,
  now: Date,
  timezone: string
): RangeResult {
  switch (preset) {
    case "today": {
      // Midnight at the start of the local calendar day containing `now`.
      // Use date-fns-tz so this is correct across DST boundaries.
      const local = toZonedTime(now, timezone);
      const localMidnight = startOfDay(local);
      const start = fromZonedTime(localMidnight, timezone);
      return { start, end: now, rangeLabel: "today" };
    }
    case "this_shift": {
      // Shifts are facility-specific; for v1 we approximate as the
      // previous 8 rolling hours. If we later add per-org shift schedules
      // we can swap this implementation without touching callers.
      return {
        start: subHours(now, 8),
        end: now,
        rangeLabel: "the last 8 hours",
      };
    }
    case "last_24h":
      return {
        start: subHours(now, 24),
        end: now,
        rangeLabel: "the last 24 hours",
      };
    case "this_week":
      return {
        start: subDays(now, 7),
        end: now,
        rangeLabel: "the last 7 days",
      };
  }
}
