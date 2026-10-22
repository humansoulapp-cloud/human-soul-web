import React from "react";
import { getJourneys } from "@/lib/actions/journeys";
import { createClient } from "@/lib/supabase/server";
import JourneysFilter from "@/components/JourneysFilter";
import { journeyImage } from "@/lib/journey-images";
import { findActiveJourney, type Journey, type ReflectionRow } from "@/lib/journal";
import { JourneyProgressCard } from "@/components/journeys/glass-cards";

export default async function JourneysPage() {
  const journeys = await getJourneys();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let reflections: ReflectionRow[] = [];
  let subscribed = false;
  let isAdmin = false;

  if (user) {
    const [{ data: reflectionRows }, { data: profile }] = await Promise.all([
      supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    reflections = (reflectionRows ?? []) as ReflectionRow[];
    subscribed = Boolean(profile?.plan && profile.plan !== "free");
    isAdmin = profile?.role === "admin";
  }

  const active = findActiveJourney(journeys as unknown as Journey[], reflections);
  const categories = Array.from(new Set(journeys.map((j) => j.category).filter(Boolean))) as string[];

  const activeCard = active ? (
    <JourneyProgressCard
      href={`/journeys/${active.journey.id}`}
      dayHref={`/journeys/${active.journey.id}?day=${active.nextDay.day}`}
      image={journeyImage(active.journey)}
      category={active.journey.category}
      title={active.journey.title}
      day={active.nextDay.day}
      total={active.totalDays}
      done={active.completedDays}
      todayTitle={active.nextDay.title}
    />
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <JourneysFilter
        journeys={journeys}
        categories={categories}
        activeJourneyId={active?.journey.id ?? null}
        subscribed={subscribed}
        isAdmin={isAdmin}
        inProgress={activeCard}
      />
    </div>
  );
}
