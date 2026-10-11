"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, PenLine, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { findActiveJourney, type Journey, type UserJournal } from "@/lib/journal";
import { journeyImage } from "@/lib/journey-images";
import {
  entryBody,
  entryLabels,
  entryTitle,
  inJournal,
  longDate,
  resolvePhotos,
  type Reflection,
} from "@/lib/reflections";
import { Button, Icon, ReflectionCard } from "@/components/ds";
import { CatalogCard, JourneyProgressCard } from "@/components/journeys/glass-cards";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

function isVisible(j: Journey) {
  const status = j.status || "published";
  if (status === "published") return true;
  return status === "scheduled" && !!j.scheduled_publish_at && new Date(j.scheduled_publish_at) <= new Date();
}

export default function HomePage() {
  const [name, setName] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [journals, setJournals] = useState<UserJournal[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: journeysData } = await supabase
        .from("journeys")
        .select("*, journey_days(*)")
        .order("created_at", { ascending: true });
      setJourneys(((journeysData ?? []) as Journey[]).filter(isVisible));

      if (user) {
        setName(user.user_metadata?.display_name || "");
        const [{ data: rows }, { data: journalRows }] = await Promise.all([
          supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("journals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        ]);
        const list = (rows ?? []) as Reflection[];
        setReflections(list);
        setJournals((journalRows ?? []) as UserJournal[]);
        setPhotos(await resolvePhotos(supabase, list.slice(0, 2)));
      }
      setLoading(false);
    }
    load();
  }, []);

  const active = useMemo(() => findActiveJourney(journeys, reflections), [journeys, reflections]);

  /** Journeys the person has not written in yet; featured ones first. */
  const forYou = useMemo(() => {
    const started = new Set<string>();
    for (const r of reflections) for (const t of r.tags ?? []) started.add(t);
    const pool = journeys.filter((j) => !started.has(j.title) && j.id !== active?.journey.id);
    return [...pool.filter((j) => j.featured), ...pool.filter((j) => !j.featured)].slice(0, 3);
  }, [journeys, reflections, active]);

  /** With no journey in progress, the journey card offers the first suggestion. */
  const offer = active ? null : forYou[0] ?? null;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const j of journals) map[j.id] = reflections.filter((r) => inJournal(r, j)).length;
    return map;
  }, [journals, reflections]);

  const toggleFavorite = async (entry: Reflection) => {
    const next = !entry.favorite;
    setReflections((prev) => prev.map((r) => (r.id === entry.id ? { ...r, favorite: next } : r)));
    await createClient().from("reflections").update({ favorite: next }).eq("id", entry.id);
  };

  if (loading) {
    return <p className="text-body-sm" style={{ color: "var(--muted-foreground)", padding: "80px 0", textAlign: "center" }}>Loading…</p>;
  }

  const recent = reflections.slice(0, 2);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
          {today}
        </span>
        <h1 className="text-h1" style={{ margin: 0 }}>
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="text-body-lg" style={{ margin: 0, color: "var(--muted-foreground)" }}>
          Whenever you&apos;re ready. There is nothing to catch up on.
        </p>
      </div>

      <section className="hs-sec" aria-labelledby="home-paths">
        <h2 id="home-paths" className="text-overline" style={{ margin: 0, color: "var(--muted-foreground)" }}>
          Two ways to write today
        </h2>
        <div className="hs-grid-2">
          {/* Journey: a prompt for each day */}
          {active ? (
            <JourneyProgressCard
              variant="home"
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
          ) : offer ? (
            <JourneyProgressCard
              variant="home"
              href={`/journeys/${offer.id}`}
              dayHref={`/journeys/${offer.id}?day=1`}
              image={journeyImage(offer)}
              category={offer.category}
              title={offer.title}
              tagline={offer.tagline}
              day={1}
              total={(offer.journey_days ?? []).length}
              done={0}
            />
          ) : null}

          {/* Journal: free writing */}
          <div className="hs-panel" style={{ padding: 24, gap: 12 }}>
            <span className="hs-kind">
              <Icon icon={BookOpen} size={16} />
              Journal · Free writing
            </span>
            <h3 className="text-h2" style={{ margin: 0 }}>
              Write freely
            </h3>
            <p className="text-body-lg" style={{ margin: 0, color: "var(--muted-foreground)" }}>
              No prompt and no theme. Whatever is on your mind today, in your own words.
            </p>
            <div style={{ marginTop: 4 }}>
              <Button size="lg" icon={PenLine} href="/journal/new">
                Reflect
              </Button>
            </div>
            <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="text-overline" style={{ color: "var(--muted-foreground)", paddingBottom: 6 }}>
                Your journals
              </span>
              {journals.map((j) => (
                <Link key={j.id} className="hs-row hs-focusable" href={`/journal?journal_id=${j.id}`}>
                  <Icon icon={BookOpen} size={20} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</span>
                  <span className="hs-count">
                    {counts[j.id] ?? 0} {counts[j.id] === 1 ? "reflection" : "reflections"}
                  </span>
                </Link>
              ))}
              <Link className="hs-row hs-focusable" href="/journal?new_journal=1" style={{ color: "var(--primary)" }}>
                <Icon icon={Plus} size={20} />
                <span style={{ flex: 1 }}>New journal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="hs-sec" aria-labelledby="home-recent">
          <div className="hs-sec-head">
            <h2 id="home-recent" className="text-h3" style={{ margin: 0 }}>
              Recent reflections
            </h2>
            <Link className="hs-more" href="/journal">
              See all
              <Icon icon={ChevronRight} size={16} />
            </Link>
          </div>
          <div className="hs-grid-2" style={{ alignItems: "start" }}>
            {recent.map((r) => (
              <ReflectionCard
                key={r.id}
                href={`/journal/${r.id}`}
                date={longDate(r.created_at)}
                title={entryTitle(r)}
                text={entryBody(r.content)}
                tags={entryLabels(r, journals)}
                photo={photos[r.id] || null}
                favorite={Boolean(r.favorite)}
                onToggleFavorite={() => toggleFavorite(r)}
              />
            ))}
          </div>
        </section>
      )}

      {forYou.length > 0 && (
        <section className="hs-sec" aria-labelledby="home-journeys">
          <div className="hs-sec-head">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 id="home-journeys" className="text-h3" style={{ margin: 0 }}>
                Journeys for you
              </h2>
              <p className="text-body-sm" style={{ margin: 0, color: "var(--muted-foreground)" }}>
                Start one whenever it feels right. Your current journey keeps its place.
              </p>
            </div>
            <Link className="hs-more" href="/journeys">
              Browse journeys
              <Icon icon={ChevronRight} size={16} />
            </Link>
          </div>
          <div className="ct-grid">
            {forYou.map((j) => (
              <CatalogCard
                key={j.id}
                href={`/journeys/${j.id}`}
                image={journeyImage(j)}
                category={j.category}
                title={j.title}
                tagline={j.tagline}
                days={(j.journey_days ?? []).length}
                time={j.time_required}
                featured={j.featured}
                premium={j.premium}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
