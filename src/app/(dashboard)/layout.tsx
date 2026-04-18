import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { TrialBanner } from "@/components/trial-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch the app user profile with organization
  const { data: user } = await supabase
    .from("users")
    .select("*, organizations(*)")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    // User exists in auth but not in users table yet — may happen during signup flow
    redirect("/login");
  }

  const org = (user as { organizations: { subscription_status: string; trial_ends_at: string | null } }).organizations;

  return (
    <>
      <TrialBanner
        subscriptionStatus={org.subscription_status}
        trialEndsAt={org.trial_ends_at}
      />
      <AppShell user={user}>{children}</AppShell>
    </>
  );
}
