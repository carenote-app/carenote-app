import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendBillingEmail } from "@/lib/resend";

// Trial-ending reminder cadence:
//   T-7  -> "your trial ends in a week" nudge
//   T-1  -> "your trial ends tomorrow" nudge
//   T+0  (and after, while still on trial) -> "your trial has expired"
//
// Each org carries a billing_emails_sent JSONB so the cron is idempotent
// across daily firings without needing a separate events table.
//
// This job uses the service-role client because it's a backend cron and
// must bypass user-scoped RLS.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kinroster.com";

export type ReminderKey = "trial_7_day" | "trial_1_day" | "trial_expired";

interface OrgRow {
  id: string;
  name: string;
  trial_ends_at: string | null;
  subscription_status: string;
  billing_emails_sent: Record<string, string | null> | null;
}

interface AdminRow {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
}

// Pure helper: given how many days remain on the trial, decide which
// reminder (if any) is due. T-7 only fires when exactly 7 days remain;
// T-1 fires on the last day; T+0 fires once the trial has lapsed and
// the org is still in 'trial' status.
export function reminderDue(
  daysUntilEnd: number,
  status: string
): ReminderKey | null {
  if (status !== "trial") return null;
  if (daysUntilEnd <= 0) return "trial_expired";
  if (daysUntilEnd === 1) return "trial_1_day";
  if (daysUntilEnd === 7) return "trial_7_day";
  return null;
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function runTrialReminders(now: Date = new Date()): Promise<{
  considered: number;
  sent: number;
  errors: number;
}> {
  const supabase = getServiceClient();

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, trial_ends_at, subscription_status, billing_emails_sent")
    .eq("subscription_status", "trial");

  if (error) throw error;

  let sent = 0;
  let errors = 0;
  const considered = (orgs ?? []).length;

  for (const raw of (orgs ?? []) as OrgRow[]) {
    if (!raw.trial_ends_at) continue;

    const endDate = new Date(raw.trial_ends_at);
    const days = daysUntil(endDate, now);
    const due = reminderDue(days, raw.subscription_status);
    if (!due) continue;

    const alreadySent = (raw.billing_emails_sent ?? {})[due];
    if (alreadySent) continue;

    // Find the admin(s) for this org. We email all admins so that
    // bus-factor-of-one orgs aren't silently missed if a single admin
    // is on vacation.
    const { data: admins } = await supabase
      .from("users")
      .select("id, email, full_name, organization_id")
      .eq("organization_id", raw.id)
      .eq("role", "admin");

    if (!admins || admins.length === 0) continue;

    try {
      for (const a of admins as AdminRow[]) {
        await sendBillingEmail({
          to: a.email,
          adminName: a.full_name,
          facilityName: raw.name,
          reminder: due,
          billingUrl: `${APP_URL}/billing`,
        });
      }

      // Stamp the email as sent. This UPDATE is the only thing the cron
      // does to the org row; it's not racy with the webhook because the
      // webhook never touches billing_emails_sent.
      const nextStamp = {
        ...(raw.billing_emails_sent ?? {}),
        [due]: now.toISOString(),
      };
      await supabase
        .from("organizations")
        .update({ billing_emails_sent: nextStamp })
        .eq("id", raw.id);

      sent += admins.length;
    } catch (err) {
      errors += 1;
      // Don't rethrow — one org's email failure shouldn't kill the whole batch.
      console.error("trial-reminder send failed for org", raw.id, err);
    }
  }

  return { considered, sent, errors };
}
