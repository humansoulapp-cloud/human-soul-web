import { NextResponse } from "next/server";
import { verifyWebhook, type StripeCheckoutSession, type StripeSubscription } from "@/lib/stripe";
import { syncSubscription, syncSubscriptionById } from "@/lib/billing";

/** Stripe → HumanSoul: keeps public.subscriptions and profiles.plan in step with payments. */
export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyWebhook(payload, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: unknown } };
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as StripeCheckoutSession;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (subId) await syncSubscriptionById(subId, s.client_reference_id ?? s.metadata?.user_id);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as StripeSubscription);
        break;
    }
  } catch (e) {
    // A 500 makes Stripe retry later.
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
