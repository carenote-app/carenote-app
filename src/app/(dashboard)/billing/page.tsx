"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { TIER_DISPLAY, type SubscriptionTier } from "@/lib/stripe";

type OrgRow = {
  subscription_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  bed_count: number | null;
  subscription_tier: SubscriptionTier | null;
};

export default function BillingPage() {
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [bedInput, setBedInput] = useState("");
  const [savingBeds, setSavingBeds] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appUser } = await supabase
        .from("users")
        .select("organization_id, role")
        .eq("id", user.id)
        .single();

      if (!appUser || (appUser as { role: string }).role !== "admin") {
        router.push("/today");
        return;
      }

      const { data: orgData } = await supabase
        .from("organizations")
        .select(
          "subscription_status, trial_ends_at, stripe_customer_id, bed_count, subscription_tier"
        )
        .eq("id", (appUser as { organization_id: string }).organization_id)
        .single();

      if (orgData) {
        const typed = orgData as OrgRow;
        setOrg(typed);
        setBedInput(typed.bed_count != null ? String(typed.bed_count) : "");
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSubscribe() {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "bed_count_required") {
        toast.error(data.message ?? "Please set your bed count first.");
      } else if (data.error === "enterprise_contact") {
        toast.error(data.message ?? "Please contact us for enterprise plans.");
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch {
      toast.error("Failed to connect to billing");
    }
  }

  async function handleManage() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to open billing portal");
      }
    } catch {
      toast.error("Failed to connect to billing");
    }
  }

  async function handleSaveBedCount(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseInt(bedInput, 10);
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      toast.error("Enter a number between 1 and 99.");
      return;
    }
    setSavingBeds(true);
    try {
      const res = await fetch("/api/organizations/me/bed-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bed_count: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save bed count.");
      } else {
        toast.success("Bed count saved.");
        setOrg((prev) =>
          prev
            ? {
                ...prev,
                bed_count: data.bed_count,
                subscription_tier: data.subscription_tier,
              }
            : prev
        );
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingBeds(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const trialDaysLeft = org?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(org.trial_ends_at), new Date()))
    : 0;

  const needsBedCount = org?.bed_count == null;
  const isEnterprise = org?.subscription_tier === "enterprise";
  const tierConfig =
    org?.subscription_tier === "small" || org?.subscription_tier === "standard"
      ? TIER_DISPLAY[org.subscription_tier]
      : null;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h2 className="mb-6 text-xl font-semibold">Billing</h2>

      {/* Bed count: required before any paid flow, and editable any time
          before subscription activation. After Stripe is active, plan
          changes happen via Customer Portal — we don't let admins flip
          the tier here without resubscribing. */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Facility size</CardTitle>
        </CardHeader>
        <CardContent>
          {org?.subscription_status === "active" && org?.bed_count != null ? (
            <p className="text-sm text-muted-foreground">
              {org.bed_count} bed{org.bed_count === 1 ? "" : "s"} on file. To
              change your bed count, contact us — your plan tier may need to
              change.
            </p>
          ) : (
            <form
              onSubmit={handleSaveBedCount}
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="bed-count">Number of licensed beds</Label>
                <Input
                  id="bed-count"
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  value={bedInput}
                  onChange={(e) => setBedInput(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used to assign your plan tier (Small for 1–10, Standard for
                  11–20). 21+ beds are on a custom plan — contact us.
                </p>
              </div>
              <Button type="submit" disabled={savingBeds}>
                {savingBeds ? "Saving…" : "Save"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Subscription Status
            <Badge
              variant={
                org?.subscription_status === "active"
                  ? "default"
                  : org?.subscription_status === "trial"
                  ? "secondary"
                  : "destructive"
              }
              className="capitalize"
            >
              {org?.subscription_status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Trial: show pricing for the org's tier (if known) and the
              Subscribe affordance. If bed_count is missing or tier is
              enterprise, show the appropriate gate instead. */}
          {org?.subscription_status === "trial" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft > 0
                  ? `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}.`
                  : "Your free trial has expired."}
              </p>

              {needsBedCount ? (
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  Set your facility&rsquo;s bed count above to see your plan
                  pricing.
                </div>
              ) : isEnterprise ? (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="font-medium">Custom plan</p>
                  <p className="text-sm text-muted-foreground">
                    Facilities with 21 or more beds are on a custom plan.
                    Contact us at{" "}
                    <a
                      href="mailto:billing@kinroster.com"
                      className="underline"
                    >
                      billing@kinroster.com
                    </a>{" "}
                    and we&rsquo;ll get you set up.
                  </p>
                </div>
              ) : tierConfig ? (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="font-medium">
                    Kinroster {tierConfig.label}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({tierConfig.bedRange})
                    </span>
                  </p>
                  <p className="text-2xl font-bold">
                    ${tierConfig.monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlimited residents, notes, and family updates for your
                    facility.
                  </p>
                </div>
              ) : null}

              {tierConfig && (
                <Button onClick={handleSubscribe} className="w-full">
                  Subscribe Now
                </Button>
              )}
            </div>
          )}

          {org?.subscription_status === "active" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {tierConfig
                  ? `Your Kinroster ${tierConfig.label} subscription is active.`
                  : "Your subscription is active. Thank you for using Kinroster."}
              </p>
              <Button variant="outline" onClick={handleManage}>
                Manage Subscription
              </Button>
            </div>
          )}

          {org?.subscription_status === "past_due" && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                Your payment is past due. Please update your payment method to
                continue using Kinroster.
              </p>
              <Button variant="destructive" onClick={handleManage}>
                Update Payment
              </Button>
            </div>
          )}

          {org?.subscription_status === "canceled" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your subscription has been canceled. Subscribe again to regain
                full access.
              </p>
              {needsBedCount ? (
                <p className="text-sm text-muted-foreground">
                  Set your bed count above first.
                </p>
              ) : isEnterprise ? (
                <p className="text-sm text-muted-foreground">
                  Contact{" "}
                  <a
                    href="mailto:billing@kinroster.com"
                    className="underline"
                  >
                    billing@kinroster.com
                  </a>{" "}
                  for enterprise plan pricing.
                </p>
              ) : (
                <Button onClick={handleSubscribe}>Resubscribe</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
