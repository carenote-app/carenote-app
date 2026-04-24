"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export default function BillingPage() {
  const [org, setOrg] = useState<{
    subscription_status: string;
    trial_ends_at: string | null;
    stripe_customer_id: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
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
        .select("subscription_status, trial_ends_at, stripe_customer_id")
        .eq("id", (appUser as { organization_id: string }).organization_id)
        .single();

      if (orgData) {
        setOrg(
          orgData as {
            subscription_status: string;
            trial_ends_at: string | null;
            stripe_customer_id: string | null;
          }
        );
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSubscribe() {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch {
      toast.error("Failed to connect to billing");
    }
  }

  async function handleManage() {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
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

  return (
    <div className="px-4 py-6">
      <h2 className="mb-6 text-xl font-semibold">Billing</h2>

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
          {org?.subscription_status === "trial" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft > 0
                  ? `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}.`
                  : "Your free trial has expired."}
              </p>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium">Kinroster Pro</p>
                <p className="text-2xl font-bold">
                  $149<span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlimited residents, notes, and family updates
                </p>
              </div>
              <Button onClick={handleSubscribe} className="w-full">
                Subscribe Now
              </Button>
            </div>
          )}

          {org?.subscription_status === "active" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your subscription is active. Thank you for using Kinroster.
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
              <Button onClick={handleSubscribe}>Resubscribe</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
