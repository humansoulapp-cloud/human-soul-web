"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe, stripeReady } from "@/lib/stripe";
import { foundingSales } from "@/lib/billing";
import { launchOffer } from "@/lib/plans";
import { SITE_URL } from "@/lib/email/templates";

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** The price the next person pays and how many spots are left at it. */
export async function getLaunchOffer() {
  return launchOffer(await foundingSales());
}

/** Opens Stripe Checkout for a yearly subscription at the current launch price. */
export async function startCheckout(): Promise<{ error: string } | never> {
  const user = await signedIn();
  if (!stripeReady()) return { error: "Payments aren't switched on yet. Please try again soon." };

  const offer = launchOffer(await foundingSales());
  const service = createServiceClient();
  const { data: existing } = await service.from("subscriptions").select("stripe_customer_id, status").eq("user_id", user.id).maybeSingle();
  if (existing && ["active", "past_due", "trialing"].includes(existing.status as string)) redirect("/dashboard");

  let url: string;
  try {
    const session = await stripe<{ url: string }>("POST", "/checkout/sessions", {
      mode: "subscription",
      client_reference_id: user.id,
      ...(existing?.stripe_customer_id ? { customer: existing.stripe_customer_id } : { customer_email: user.email }),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: offer.cents,
            recurring: { interval: "year" },
            product_data: { name: `HumanSoul · ${offer.name}` },
          },
        },
      ],
      metadata: { user_id: user.id, tier: offer.tier },
      subscription_data: { metadata: { user_id: user.id, tier: offer.tier } },
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/join/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/join`,
    });
    url = session.url;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Checkout couldn't open. Please try again." };
  }
  redirect(url);
}

/** Stripe's own page to update the card, see invoices or cancel. */
export async function openBillingPortal(): Promise<{ error: string } | never> {
  const user = await signedIn();
  const { data } = await createServiceClient().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data?.stripe_customer_id) return { error: "There's no payment on this account yet." };
  let url: string;
  try {
    const portal = await stripe<{ url: string }>("POST", "/billing_portal/sessions", {
      customer: data.stripe_customer_id,
      return_url: `${SITE_URL}/profile`,
    });
    url = portal.url;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Billing couldn't open. Please try again." };
  }
  redirect(url);
}
