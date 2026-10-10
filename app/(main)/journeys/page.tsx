import React from "react";
import { Compass, Shield } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import { createClient } from "@/lib/supabase/server";
import JourneysFilter from "@/components/JourneysFilter";
import { journeyImage } from "@/lib/journey-images";
import { findActiveJourney, type Journey, type ReflectionRow } from "@/lib/journal";
import { Button, Icon, SegmentProgress } from "@/components/ds";

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

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span className="hs-kind">
            <Icon icon={Compass} size={16} />
            Guided writing
          </span>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Journeys
          </h1>
          <p className="text-body-lg" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            A theme and a prompt for each day. Start whenever it feels right.
          </p>
        </div>
        {isAdmin && (
          <Button variant="secondary" size="sm" icon={Shield} href="/admin/journeys">
            Admin journeys
          </Button>
        )}
      </div>

      {active && (
        <section className="hs-sec" aria-labelledby="journeys-now">
          <h2 id="journeys-now" className="text-overline" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            In progress
          </h2>
          <div className="hs-panel md:!flex-row md:items-center md:gap-6 md:p-4 md:pr-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={journeyImage(active.journey)}
              alt=""
              className="hs-media-169 md:!w-[176px] md:!h-[110px] md:!aspect-auto md:rounded-2xl md:flex-none"
            />
            <div className="flex flex-col gap-2.5 p-5 md:p-0 md:flex-1 md:min-w-0 md:flex-row md:flex-wrap md:items-center md:gap-6">
              <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
                  {active.journey.category ? `${active.journey.category} · ` : ""}Day {active.nextDay.day} of {active.totalDays}
                </span>
                <span className="text-h3">{active.journey.title}</span>
                <span className="hs-meta">Today: {active.nextDay.title}</span>
              </div>
              <SegmentProgress
                total={active.totalDays}
                done={active.completedDays}
                current={active.nextDay.day}
                width={140}
                label={`Day ${active.nextDay.day} of ${active.totalDays}`}
              />
              <Button href={`/journeys/${active.journey.id}?day=${active.nextDay.day}`}>Begin Day {active.nextDay.day}</Button>
            </div>
          </div>
        </section>
      )}

      <JourneysFilter
        journeys={journeys}
        categories={categories}
        activeJourneyId={active?.journey.id ?? null}
        subscribed={subscribed}
      />
    </>
  );
}
