import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    })
  : null;

// Two-tier billing per Track G. The actual price IDs come from Stripe
// Dashboard products configured manually before launch (see plan G-8).
// During development the env vars can be left unset; the checkout route
// returns 503 if the price ID for the requested tier is missing.
export const PRICE_ID_SMALL = process.env.STRIPE_PRICE_ID_SMALL ?? "";
export const PRICE_ID_STANDARD = process.env.STRIPE_PRICE_ID_STANDARD ?? "";

// Display pricing — pure UI copy. Real billing amounts come from Stripe
// (the source of truth at checkout / invoice time). Keeping these here
// in dollars lets the billing page render predictable copy without an
// extra Stripe API call. Update when the Stripe Price object changes.
export const TIER_DISPLAY = {
  small: { label: "Small", bedRange: "1–10 beds", monthlyPrice: 149 },
  standard: { label: "Standard", bedRange: "11–20 beds", monthlyPrice: 249 },
} as const;

export type SubscriptionTier = "small" | "standard" | "enterprise";

// Maps a stored subscription_tier value to the correct Stripe price ID.
// Returns null for tiers without a paid SKU (enterprise / null) so
// callers can branch on the contact-us / set-bed-count flows.
export function priceIdForTier(tier: SubscriptionTier | null): string | null {
  if (tier === "small") return PRICE_ID_SMALL || null;
  if (tier === "standard") return PRICE_ID_STANDARD || null;
  return null;
}
