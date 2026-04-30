"use client";

import { useState, useMemo } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactPricingDialog } from "@/components/contact-pricing-dialog";

interface TrialBannerProps {
  subscriptionStatus: string;
  trialEndsAt: string | null;
}

export function TrialBanner({ subscriptionStatus, trialEndsAt }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const { isExpired, daysRemaining } = useMemo(() => {
    const expired =
      subscriptionStatus === "canceled" ||
      (subscriptionStatus === "trial" &&
        trialEndsAt != null &&
        new Date(trialEndsAt).getTime() < now);

    const days = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
      : null;

    return { isExpired: expired, daysRemaining: days };
  }, [subscriptionStatus, trialEndsAt, now]);

  if (subscriptionStatus === "active" || dismissed) return null;

  if (isExpired) {
    return (
      <>
        <div className="border-b bg-destructive/10 px-4 py-2.5 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">
              Your trial has expired.
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs ml-1"
              onClick={() => setPricingOpen(true)}
            >
              Get Pricing
            </Button>
          </div>
        </div>
        <ContactPricingDialog
          open={pricingOpen}
          onOpenChange={setPricingOpen}
          trialExpired
        />
      </>
    );
  }

  if (subscriptionStatus === "trial" && daysRemaining !== null) {
    return (
      <>
        <div className="border-b bg-primary/5 px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Free trial ends in <span className="font-medium text-foreground">{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs ml-1"
              onClick={() => setPricingOpen(true)}
            >
              Get Pricing
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <ContactPricingDialog
          open={pricingOpen}
          onOpenChange={setPricingOpen}
        />
      </>
    );
  }

  return null;
}
