import { notFound, permanentRedirect, redirect } from "next/navigation";
import { legacyJourneyId } from "@/lib/journey-redirects";
import { getJourney, getJourneys } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { createClient } from "@/lib/supabase/server";
import JourneyDetailClient from "@/components/JourneyDetailClient";
import type { ReflectionRow } from "@/lib/journal";
import { journeyInfo, type Reflection } from "@/lib/reflections";
import { EARLIEST_TIME_ZONE, nextDayHasOpened } from "@/lib/journey-days";
import { accessFrom, loadBetaUntil } from "@/lib/access";

export default async function JourneyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string; from?: string; r?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { day, from, r, edit } = await searchParams;
  const supabase = await createClient();
  // Everything that doesn't depend on the user loads side by side. The proxy has
  // already checked the session, so the user id comes from its verified token.
  const othersPromise = getJourneys().catch(() => []);
  const [journey, { data: auth }] = await Promise.all([getJourney(id), supabase.auth.getClaims()]);

  if (!journey) {
    /* An old code (HS-J-001) or a different capitalisation of the address goes to
       the journey's current address, keeping ?day= and the other parameters. */
    const lower = decodeURIComponent(id).toLowerCase();
    const target = legacyJourneyId(id) ?? (lower !== id ? lower : null);
    if (target && target !== id) {
      const qs = new URLSearchParams();
      if (day) qs.set("day", day);
      if (from) qs.set("from", from);
      if (r) qs.set("r", r);
      if (edit) qs.set("edit", edit);
      permanentRedirect(`/journeys/${target}${qs.size ? `?${qs}` : ""}`);
    }
    notFound();
  }
  const userId = auth?.claims.sub ?? null;

  let reflections: ReflectionRow[] = [];
  let subscribed = false;
  let profileTimeZone: string | null = null;

  if (userId) {
    const [{ data: reflectionRows }, { data: headerRows }, { data: profile }, betaUntil] = await Promise.all([
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", userId)
        .contains("tags", [journey.title])
        .order("created_at", { ascending: false }),
      /* Entries whose tags were changed later still carry the day's header in their text. */
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", userId)
        .like("content", `[${journey.title.replace(/[%_\\]/g, "\\$&")} - Day %`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      loadBetaUntil(supabase, userId),
    ]);

    const byId = new Map<string, ReflectionRow>();
    for (const r of [...(reflectionRows ?? []), ...(headerRows ?? [])] as ReflectionRow[]) byId.set(r.id, r);
    /* The reflection opened from Journal, even when its tags and header no longer
       match the queries above (it is then recognised by its journey fields). */
    if (from === "journal" && r && !byId.has(r)) {
      const { data: opened } = await supabase.from("reflections").select("*").eq("user_id", userId).eq("id", r).maybeSingle();
      if (opened && journeyInfo(opened as Reflection)?.title === journey.title) byId.set(opened.id, opened as ReflectionRow);
    }
    reflections = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    subscribed = accessFrom(profile?.plan, betaUntil).full;
    profileTimeZone = (profile?.timezone as string | null | undefined) ?? null;
  }

  /* Two journeys to offer when this one is complete: featured first. */
  const others = (await othersPromise).filter((j) => j.id !== journey.id);
  const suggestions = [...others.filter((j) => j.featured), ...others.filter((j) => !j.featured)]
    .slice(0, 2)
    .map((j) => ({ id: j.id, title: j.title, image: journeyImage(j) }));

  /* Days unlock in order, one each morning: the first day without a reflection
     opens once a new morning has come since the day before it was written.
     Plus journeys stay closed without Plus or beta access. Locked days reach the
     browser with their title only, and a ?day= link to a locked day goes back
     to the journey's overview. */
  const premiumLocked = Boolean(journey.premium) && !subscribed;
  const sortedDays = [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day);
  const entryFor = (n: number) => {
    const header = `[${journey.title} - Day ${n}:`;
    return reflections.find((r) => {
      const tags = r.tags ?? [];
      const text = (r.content ?? "").trim();
      if ((tags.includes(`Day ${n}`) && (tags.includes(journey.title) || text.startsWith(header))) || text.startsWith(header)) return true;
      const info = journeyInfo(r as Reflection);
      return Boolean(info && info.title === journey.title && info.day === n);
    });
  };
  const firstOpen = sortedDays.findIndex((d) => !entryFor(d.day));
  const nextIndex = firstOpen === -1 ? sortedDays.length - 1 : firstOpen;
  const timeZone = profileTimeZone ?? EARLIEST_TIME_ZONE;
  const isOpen = (index: number) => {
    if (premiumLocked) return false;
    if (entryFor(sortedDays[index].day)) return true;
    if (index !== nextIndex) return false;
    if (index === 0) return true;
    const previous = entryFor(sortedDays[index - 1].day);
    return !previous || nextDayHasOpened(previous.created_at, timeZone);
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
      timeZone={profileTimeZone}
      initialDay={Number.isFinite(initialDay) ? initialDay : undefined}
      suggestions={suggestions}
      returnTo={from === "journal" ? (r ? `/journal?r=${encodeURIComponent(r)}` : "/journal") : undefined}
      entryId={from === "journal" ? r : undefined}
      startEditing={edit === "1"}
    />
  );
}
