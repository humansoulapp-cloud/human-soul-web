import React from "react";
import Link from "next/link";
import { getJourneys } from "@/lib/actions/journeys";
import { createClient } from "@/lib/supabase/server";
import JourneysFilter from "@/components/JourneysFilter";
import { journeyImage } from "@/lib/journey-images";
import { findActiveJourney, type Journey, type ReflectionRow } from "@/lib/journal";

export default async function JourneysPage() {
  const journeys = await getJourneys();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reflections: ReflectionRow[] = [];
  let subscribed = false;

  if (user) {
    const [{ data: reflectionRows }, { data: profile }] = await Promise.all([
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    reflections = (reflectionRows ?? []) as ReflectionRow[];
    subscribed = Boolean(profile?.plan && profile.plan !== "free");
  }

  const active = findActiveJourney(journeys as unknown as Journey[], reflections);
  const categories = Array.from(
    new Set(journeys.map((j) => j.category).filter(Boolean))
  ) as string[];

  const progressPct = active
    ? Math.round((active.completedDays / active.totalDays) * 100)
    : 0;

  return (
    <div>
      <h1 className="text-[28px] md:text-[37px] font-semibold tracking-[-0.015em] m-0 mb-1.5">
        Guided Journeys
      </h1>
      <p className="text-sm text-[var(--ds-text-muted)] m-0">
        Multi-day guided experiences. One day opens at a time.
      </p>

      {/* Continue where the person left off */}
      {active && (
        <div className="flex flex-col sm:flex-row gap-5 p-4 mt-[22px] rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
          <span
            className="w-full h-32 sm:w-[150px] sm:h-auto sm:min-h-[114px] flex-shrink-0 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url("${journeyImage(active.journey)}")` }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]">
              CONTINUE · DAY {active.nextDay.day} OF {active.totalDays}
            </div>
            <div className="text-2xl font-semibold leading-[1.2] mt-[5px] mb-[3px]">
              {active.journey.title}
            </div>
            <div className="text-[12.5px] text-[var(--ds-text-muted)]">
              Today · {active.nextDay.title}
            </div>
            <span className="block h-1 rounded-full bg-[var(--ds-line-strong)] mt-3 max-w-[340px]">
              <span
                className="block h-full rounded-full bg-[var(--ds-accent)]"
                style={{ width: `${progressPct}%` }}
              />
            </span>
          </div>
          <div className="flex sm:flex-col gap-2 self-center">
            <Link
              href={`/journeys/${active.journey.id}?day=${active.nextDay.day}`}
              className="px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold text-center whitespace-nowrap transition-colors"
            >
              Open today
            </Link>
            <Link
              href={`/journeys/${active.journey.id}`}
              className="px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px] text-center whitespace-nowrap transition-colors"
            >
              Overview
            </Link>
          </div>
        </div>
      )}

      <JourneysFilter
        journeys={journeys}
        categories={categories}
        activeJourneyId={active?.journey.id ?? null}
        subscribed={subscribed}
      />
    </div>
  );
}
