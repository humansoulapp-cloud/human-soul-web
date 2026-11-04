import { createServiceClient } from "@/lib/supabase/service";
import { stripe, type StripeSubscription } from "@/lib/stripe";

/** Statuses that count as paid access. past_due keeps access while Stripe retries the card. */
const ACTIVE = new Set(["active", "past_due", "trialing"]);

export async function foundingSales(): Promise<number> {
  try {
    const { data, error } = await createServiceClient().rpc("founding_sales");
    if (error) return 0;
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

/** Writes the Stripe subscription into public.subscriptions and profiles.plan. Idempotent. */
export async function syncSubscription(sub: StripeSubscription, userIdHint?: string | null) {
  const service = createServiceClient();
  let userId = userIdHint || sub.metadata?.user_id || null;
  if (!userId) {
    const { data } = await service.from("subscriptions").select("user_id").eq("stripe_subscription_id", sub.id).maybeSingle();
    userId = (data?.user_id as string | undefined) ?? null;
  }
  if (!userId) return;

  const active = ACTIVE.has(sub.status);
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null;
  const { data: existing } = await service.from("subscriptions").select("first_paid_at").eq("user_id", userId).maybeSingle();
  const row = {
    user_id: userId,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_cents: sub.items?.data?.[0]?.price?.unit_amount ?? null,
    tier: sub.metadata?.tier ? Number(sub.metadata.tier) : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    first_paid_at: existing?.first_paid_at ?? (active ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
  };
  await service.from("subscriptions").upsert(row, { onConflict: "user_id" });
  await service.from("profiles").update({ plan: active ? "founding" : "free" }).eq("user_id", userId);
}

export async function syncSubscriptionById(id: string, userIdHint?: string | null) {
  const sub = await stripe<StripeSubscription>("GET", `/subscriptions/${id}`);
  await syncSubscription(sub, userIdHint);
  return sub;
}
