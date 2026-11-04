import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accessFrom, loadBetaUntil } from "@/lib/access";
import { getLaunchOffer } from "@/lib/actions/billing";
import JoinForm from "./JoinForm";

export const metadata: Metadata = { title: "Join HumanSoul", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: profile }, betaUntil, offer] = await Promise.all([
    supabase.from("profiles").select("plan, role").eq("user_id", user.id).maybeSingle(),
    loadBetaUntil(supabase, user.id),
    getLaunchOffer(),
  ]);
  // The team can look at the page with ?preview=1 even though they already have access.
  const { preview } = await searchParams;
  const teamPreview = preview === "1" && profile?.role === "admin";
  if (!teamPreview && accessFrom(profile?.plan, betaUntil, Date.now(), profile?.role).full) redirect("/dashboard");

  return <JoinForm price={offer.price} left={offer.left} nextPrice={offer.nextPrice} />;
}
