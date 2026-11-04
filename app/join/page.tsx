import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accessFrom, loadBetaUntil } from "@/lib/access";
import { getLaunchOffer } from "@/lib/actions/billing";
import JoinForm from "./JoinForm";

export const metadata: Metadata = { title: "Join HumanSoul", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
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
  if (accessFrom(profile?.plan, betaUntil, Date.now(), profile?.role).full) redirect("/dashboard");

  await searchParams;
  return <JoinForm price={offer.price} left={offer.left} nextPrice={offer.nextPrice} />;
}
