import { notFound } from "next/navigation";
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

  const initialDay = day ? Number(day) : undefined;

  return (
    <JourneyDetailClient
      journey={journey}
      reflections={reflections}
      subscribed={subscribed}
      initialDay={Number.isFinite(initialDay) ? initialDay : undefined}
      suggestions={suggestions}
      returnTo={from === "journal" ? (r ? `/journal?r=${encodeURIComponent(r)}` : "/journal") : undefined}
      startEditing={edit === "1"}
    />
  );
}
