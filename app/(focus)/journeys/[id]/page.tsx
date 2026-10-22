import { notFound, redirect } from "next/navigation";
import { getJourney, getJourneys } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { createClient } from "@/lib/supabase/server";
import JourneyDetailClient from "@/components/JourneyDetailClient";
import type { ReflectionRow } from "@/lib/journal";

export default async function JourneyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string; from?: string; r?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { day, from, r, edit } = await searchParams;
  const journey = await getJourney(id);

  if (!journey) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reflections: ReflectionRow[] = [];
  let subscribed = false;

  if (user) {
    const [{ data: reflectionRows }, { data: headerRows }, { data: profile }] = await Promise.all([
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .contains("tags", [journey.title])
        .order("created_at", { ascending: false }),
      /* Entries whose tags were changed later still carry the day's header in their text. */
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .like("content", `[${journey.title.replace(/[%_\\]/g, "\\$&")} - Day %`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    const byId = new Map<string, ReflectionRow>();
    for (const r of [...(reflectionRows ?? []), ...(headerRows ?? [])] as ReflectionRow[]) byId.set(r.id, r);
    reflections = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    subscribed = Boolean(profile?.plan && profile.plan !== "free");
  }

  /* Two journeys to offer when this one is complete: featured first. */
  const others = (await getJourneys().catch(() => [])).filter((j) => j.id !== journey.id);
  const suggestions = [...others.filter((j) => j.featured), ...others.filter((j) => !j.featured)]
    .slice(0, 2)
    .map((j) => ({ id: j.id, title: j.title, image: journeyImage(j) }));

  /* Days unlock in order: the first day without a reflection is open, later
     ones stay shut, and Plus journeys open only Day 1 without a subscription.
     Locked days reach the browser with their title only, and a ?day= link to a
     locked day goes back to the journey's overview. */
  const premiumLocked = Boolean(journey.premium) && !subscribed;
  const sortedDays = [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day);
  const hasEntry = (n: number) => {
    const header = `[${journey.title} - Day ${n}:`;
    return reflections.some((r) => {
      const tags = r.tags ?? [];
      const text = (r.content ?? "").trim();
      return (tags.includes(`Day ${n}`) && (tags.includes(journey.title) || text.startsWith(header))) || text.startsWith(header);
    });
  };
  const firstOpen = sortedDays.findIndex((d) => !hasEntry(d.day));
  const nextIndex = firstOpen === -1 ? sortedDays.length - 1 : firstOpen;
  const isOpen = (index: number) => {
    if (premiumLocked && index > 0) return false;
    return hasEntry(sortedDays[index].day) || index === nextIndex;
  };
  const openDays = new Set(sortedDays.filter((_, i) => isOpen(i)).map((d) => d.day));
  const safeJourney = {
    ...journey,
    journey_days: sortedDays.map((d) =>
      openDays.has(d.day) ? d : { ...d, prompt: "", purpose: "", deeper: null }
    ),
  };

  const requested = day ? Number(day) : undefined;
  if (requested !== undefined && Number.isFinite(requested) && !openDays.has(requested)) {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (r) qs.set("r", r);
    redirect(`/journeys/${journey.id}${qs.size ? `?${qs}` : ""}`);
  }
  const initialDay = requested;

  return (
    <JourneyDetailClient
      journey={safeJourney}
      reflections={reflections}
      subscribed={subscribed}
      initialDay={Number.isFinite(initialDay) ? initialDay : undefined}
      suggestions={suggestions}
      returnTo={from === "journal" ? (r ? `/journal?r=${encodeURIComponent(r)}` : "/journal") : undefined}
      startEditing={edit === "1"}
    />
  );
}
