import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use service role for webhook (no user session)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Idempotency: Stripe retries deliveries on non-2xx responses (and
  // occasionally on transient successes). Without dedupe, a retry can
  // re-flap subscription status or repeat side effects. We INSERT the
  // event id into stripe_processed_events; a unique-violation means we
  // already handled it.
  const dedupe = await supabase
    .from("stripe_processed_events")
    .insert({ event_id: event.id });

  if (dedupe.error) {
    // 23505 = unique_violation -> already processed; ack so Stripe stops retrying.
    if ((dedupe.error as { code?: string }).code === "23505") {
      return NextResponse.json({ received: true, deduped: true });
    }
    // Any other error means we don't know if we processed it — surface a 500
    // so Stripe will retry, rather than silently swallowing.
    return NextResponse.json(
      { error: "Failed to record event for dedupe" },
      { status: 500 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.subscription
        ? (
            await stripe.subscriptions.retrieve(
              session.subscription as string
            )
          ).metadata.organization_id
        : null;

      if (orgId) {
        await supabase
          .from("organizations")
          .update({
            subscription_status: "active",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // subscription can be string or object depending on expansion
      const subRef = (invoice as unknown as Record<string, unknown>).subscription;
      const subId = typeof subRef === "string" ? subRef : null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const orgId = sub.metadata.organization_id;
        if (orgId) {
          await supabase
            .from("organizations")
            .update({ subscription_status: "past_due" })
            .eq("id", orgId);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata.organization_id;
      if (orgId) {
        await supabase
          .from("organizations")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", orgId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
