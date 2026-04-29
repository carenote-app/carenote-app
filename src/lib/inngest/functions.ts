import { inngest } from "./client";
import { runWeeklySummaries } from "@/lib/jobs/weekly-summaries";
import { runTrialReminders } from "@/lib/jobs/trial-reminders";

// Hourly trigger. The job itself filters per-org for "Sunday 6 PM in this
// org's local time", so each timezone gets its summary once a week without
// needing per-org schedules.
export const weeklySummariesCron = inngest.createFunction(
  {
    id: "weekly-summaries",
    name: "Weekly summaries",
    triggers: [{ cron: "0 * * * *" }],
  },
  async () => runWeeklySummaries()
);

// Daily at 09:00 UTC. The job is idempotent — it stamps each reminder
// it sends in organizations.billing_emails_sent, so re-firing on the
// same day (or replays from Inngest) won't double-send.
export const trialRemindersCron = inngest.createFunction(
  {
    id: "trial-reminders",
    name: "Trial-ending reminders",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async () => runTrialReminders()
);
