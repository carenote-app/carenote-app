"use client";

import { Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const PRICING_CONTACT_EMAIL = "generalpouya1984@gmail.com";

const MAILTO_HREF = `mailto:${PRICING_CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Kinroster pricing inquiry"
)}&body=${encodeURIComponent(
  "Hi,\n\nI'd like to learn more about Kinroster pricing for my facility.\n\nFacility name:\nNumber of residents:\nPreferred contact method:\n\nThanks!"
)}`;

interface ContactPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialExpired?: boolean;
}

export function ContactPricingDialog({
  open,
  onOpenChange,
  trialExpired = false,
}: ContactPricingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {trialExpired ? "Your trial has ended" : "Get pricing"}
          </DialogTitle>
          <DialogDescription>
            {trialExpired
              ? "Your 3-day free trial has ended. Email us to discuss a plan that fits your facility and continue using Kinroster."
              : "We tailor pricing to each facility. Send us a quick email and we'll get back to you with options that fit your team."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">Email us directly</p>
          <p className="font-medium break-all">{PRICING_CONTACT_EMAIL}</p>
        </div>

        <DialogFooter>
          <a href={MAILTO_HREF} className={buttonVariants({ variant: "default" })}>
            <Mail className="h-4 w-4" />
            Email for pricing
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
