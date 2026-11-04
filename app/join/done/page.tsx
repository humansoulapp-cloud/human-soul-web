import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, type StripeCheckoutSession } from "@/lib/stripe";
import { syncSubscriptionById } from "@/lib/billing";

export const dynamic = "force-dynamic";

/** Back from Stripe Checkout: record the payment straight away (the webhook does it too) and open the app. */
export default async function JoinDone({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!session_id) redirect("/join");

  let ok = false;
  try {
    const session = await stripe<StripeCheckoutSession>("GET", `/checkout/sessions/${session_id}`);
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (session.client_reference_id === user.id && subId && session.status === "complete") {
      await syncSubscriptionById(subId, user.id);
      ok = true;
    }
  } catch {
    ok = false;
  }
  redirect(ok ? "/dashboard?welcome=1" : "/join");
}
