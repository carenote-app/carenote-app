import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, priceIdForTier, type SubscriptionTier } from "@/lib/stripe";

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  const orgId = (appUser as { organization_id: string; role: string } | null)
    ?.organization_id;
  const role = (appUser as { organization_id: string; role: string } | null)?.role;
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Pull the org plus the derived tier. bed_count gates the flow:
  // - NULL: admin must set bed count first.
  // - subscription_tier='enterprise' (21+ beds): contact-us path; no checkout.
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, name, bed_count, subscription_tier")
    .eq("id", orgId)
    .single();

  const typedOrg = org as {
    stripe_customer_id: string | null;
    name: string;
    bed_count: number | null;
    subscription_tier: SubscriptionTier | null;
  } | null;

  if (!typedOrg) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (typedOrg.bed_count == null) {
    return NextResponse.json(
      {
        error: "bed_count_required",
        message:
          "Please tell us how many beds your facility is licensed for before subscribing.",
      },
      { status: 400 }
    );
  }

  if (typedOrg.subscription_tier === "enterprise") {
    return NextResponse.json(
      {
        error: "enterprise_contact",
        message:
          "Facilities with 21 or more beds are on a custom plan. Contact us at billing@kinroster.com.",
      },
      { status: 400 }
    );
  }

  const priceId = priceIdForTier(typedOrg.subscription_tier);
  if (!priceId) {
    return NextResponse.json(
      { error: "No Stripe price configured for this tier" },
      { status: 503 }
    );
  }

  let customerId = typedOrg.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: typedOrg.name || undefined,
      metadata: { organization_id: orgId },
    });
    customerId = customer.id;

    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", orgId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organization_id: orgId,
        subscription_tier: typedOrg.subscription_tier ?? "",
        bed_count: String(typedOrg.bed_count),
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
