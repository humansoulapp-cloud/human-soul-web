"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { journeyImage } from "@/lib/journey-images";
import { sendEmail } from "@/lib/email/send";
import { absolute, finishedEmail, welcomeEmail } from "@/lib/email/templates";

type Prefs = Record<string, unknown>;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function readPrefs(service: ReturnType<typeof createServiceClient>, userId: string): Promise<Prefs> {
  const { data } = await service.from("profiles").select("preferences").eq("user_id", userId).maybeSingle();
  return ((data?.preferences as Prefs) ?? {}) || {};
}

async function writePrefs(service: ReturnType<typeof createServiceClient>, userId: string, patch: Prefs) {
  const prefs = await readPrefs(service, userId);
  await service.from("profiles").update({ preferences: { ...prefs, ...patch } }).eq("user_id", userId);
}

/** Sent once, when someone finishes or skips onboarding. */
export async function sendWelcomeEmail(): Promise<{ ok: boolean; error?: string }> {
  const user = await currentUser();
  if (!user?.email) return { ok: false, error: "Not signed in" };

  const service = createServiceClient();
  const prefs = await readPrefs(service, user.id);
  if (prefs.welcome_sent) return { ok: true };

  const chosen = (prefs.onboarding as { journey?: string } | undefined)?.journey;
  let journey: { id: string; title: string; image: string | null } | null = null;
  if (chosen) {
    const { data } = await service.from("journeys").select("id, title, image_url").eq("id", chosen).maybeSingle();
    if (data) journey = { id: data.id, title: data.title, image: absolute(journeyImage(data)) };
  }

  const name = ((user.user_metadata?.display_name as string) || "").trim().split(/\s+/)[0] || "";
  const res = await sendEmail({ to: user.email, tag: "welcome", ...welcomeEmail({ name, journey }) });
  if (!res.ok) return { ok: false, error: res.error };
  await writePrefs(service, user.id, { welcome_sent: true });
  return { ok: true };
}

const DAY_TAG = /^Day (\d+)$/;

/** Sent once per journey, after its last day is written. The server checks that it really is finished. */
export async function sendJourneyFinishedEmail(journeyId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await currentUser();
  if (!user?.email) return { ok: false, error: "Not signed in" };

  const service = createServiceClient();
  const prefs = await readPrefs(service, user.id);
  const sent = Array.isArray(prefs.finished_sent) ? (prefs.finished_sent as string[]) : [];
  if (sent.includes(journeyId)) return { ok: true };

  const [{ data: journey }, { data: all }] = await Promise.all([
    service.from("journeys").select("id, title, image_url, journey_days(day)").eq("id", journeyId).maybeSingle(),
    service.from("journeys").select("id, title, image_url, premium, featured, status, journey_days(day)"),
  ]);
  if (!journey) return { ok: false, error: "Unknown journey" };

  const { data: rows } = await service
    .from("reflections")
    .select("content, tags, created_at")
    .eq("user_id", user.id)
    .contains("tags", [journey.title]);
  const entries = (rows ?? []) as { content: string; tags: string[] | null; created_at: string }[];
  const days = (journey.journey_days ?? []) as { day: number }[];
  const written = new Set(entries.flatMap((r) => (r.tags ?? []).map((t) => DAY_TAG.exec(t)?.[1]).filter(Boolean)));
  if (!days.length || days.some((d) => !written.has(String(d.day)))) return { ok: false, error: "Not finished yet" };

  const words = entries.reduce((n, r) => n + r.content.replace(/^\[[^\]]*\]\s*/, "").split(/\s+/).filter(Boolean).length, 0);
  const times = entries.map((r) => new Date(r.created_at).getTime());
  const span = Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000) + 1);

  // Suggest a live journey they haven't started, free ones first.
  const { data: mine } = await service.from("reflections").select("tags").eq("user_id", user.id);
  const started = new Set(((mine ?? []) as { tags: string[] | null }[]).flatMap((r) => r.tags ?? []));
  type Row = { id: string; title: string; image_url: string | null; premium: boolean | null; featured: boolean | null; status: string | null; journey_days: { day: number }[] };
  const pool = ((all ?? []) as Row[])
    .filter((j) => j.id !== journey.id && (j.status ?? "published") === "published" && !started.has(j.title))
    .sort((a, b) => Number(Boolean(a.premium)) - Number(Boolean(b.premium)) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const n = pool[0];

  const res = await sendEmail({
    to: user.email,
    tag: "journey_finished",
    ...finishedEmail({
      journey: { id: journey.id, title: journey.title, image: absolute(journeyImage(journey)) },
      days: days.length,
      words,
      span,
      next: n ? { id: n.id, title: n.title, image: absolute(journeyImage(n)), days: (n.journey_days ?? []).length || 7 } : null,
    }),
  });
  if (!res.ok) return { ok: false, error: res.error };
  await writePrefs(service, user.id, { finished_sent: [...sent, journeyId] });
  return { ok: true };
}
