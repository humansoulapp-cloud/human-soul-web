import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accessFrom, loadBetaUntil } from "@/lib/access";
import { PAYWALL } from "@/lib/plans";

/**
 * Paid launch: the app opens for people who paid, beta testers until their date, and the team.
 * Everyone else is sent to /join. Signed-out visitors are handled by proxy.ts.
 */
export async function requireAccess() {
  if (!PAYWALL) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const [{ data: profile }, betaUntil] = await Promise.all([
    supabase.from("profiles").select("plan, role").eq("user_id", user.id).maybeSingle(),
    loadBetaUntil(supabase, user.id),
  ]);
  if (!accessFrom(profile?.plan, betaUntil, Date.now(), profile?.role).full) redirect("/join");
}
