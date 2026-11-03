"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Heart, PenLine, Plus } from "lucide-react";
import { createClient, currentUser } from "@/lib/supabase/client";
import { findJourneysInProgress, type Journey, type UserJournal } from "@/lib/journal";
import { journeyImage } from "@/lib/journey-images";
import { accessFrom, loadBetaUntil } from "@/lib/access";
import {
  entryBody,
  entryLabels,
  entryTitle,
  inJournal,
  type Reflection,
} from "@/lib/reflections";
import { Icon } from "@/components/ds";
import { CarouselSection } from "@/components/carousel";
import { CatalogCard, JourneyProgressCard } from "@/components/journeys/glass-cards";
import PageLoader from "@/components/PageLoader";
import HomeTour from "@/components/home-tour";

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const [loading, setLoading] = useState(true);
  /* With full access (Plus, beta or team) the Plus lock means nothing. */
  const [fullAccess, setFullAccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const user = await currentUser(supabase);

      const { data: journeysData } = await supabase
        .from("journeys")
        .select("*, journey_days(*)")
        .order("created_at", { ascending: true });
      setJourneys(((journeysData ?? []) as Journey[]).filter(isVisible));

      if (user) {
        setName(user.user_metadata?.display_name || "");
        const [{ data: rows }, { data: journalRows }, { data: profile }, betaUntil] = await Promise.all([
          supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("journals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("profiles").select("plan, role").eq("user_id", user.id).maybeSingle(),
          loadBetaUntil(supabase, user.id),
        ]);
        const p = profile as { plan?: string | null; role?: string | null } | null;
        setFullAccess(accessFrom(p?.plan, betaUntil, Date.now(), p?.role).full);
        const list = (rows ?? []) as Reflection[];
        setReflections(list);
        setJournals((journalRows ?? []) as UserJournal[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* Home runs in the browser, so the device's time zone decides when the next day opens. */
  /* The aim of Home is to finish what was started: the latest journey leads,
     other unfinished ones follow, and new journeys come last. */
  const inProgress = useMemo(() => findJourneysInProgress(journeys, reflections), [journeys, reflections]);
  const active = inProgress[0] ?? null;
  const alsoInProgress = inProgress.slice(1);

  /** Journeys the person has not written in yet; featured ones first. */
  const forYou = useMemo(() => {
    const started = new Set<string>();
    for (const r of reflections) for (const t of r.tags ?? []) started.add(t);
    const pool = journeys.filter((j) => !started.has(j.title) && j.id !== active?.journey.id);
    return [...pool.filter((j) => j.featured), ...pool.filter((j) => !j.featured)].slice(0, 8);
  }, [journeys, reflections, active]);

  /** With no journey in progress, the journey card offers the first suggestion. */
  const offer = active ? null : forYou[0] ?? null;
  /** The carousel never repeats the journey the card above already offers. */
  const more = offer ? forYou.slice(1) : forYou;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const j of journals) map[j.id] = reflections.filter((r) => inJournal(r, j)).length;
    return map;
  }, [journals, reflections]);

  if (loading) {
    return <PageLoader />;
  }

  const recent = reflections.slice(0, 8);

  return (
    <div className="hc">
      <h1 className="text-h2 hc-hello">
        {greeting()}
        {name ? `, ${name}` : ""}
      </h1>

      <div className="hc-top">
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
            waitingForMorning={active.waitingForMorning}
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

        <section className="hc-journal" aria-labelledby="home-write" data-tour="write">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="home-write" className="text-h3" style={{ margin: 0 }}>
              Write freely
            </h2>
            <p className="text-body-sm" style={{ margin: 0, color: "var(--muted-foreground)" }}>
              A space for whatever comes to mind.
            </p>
          </div>
          <Link className="hc-prompt" href="/journal/new">
            <span className="hc-prompt-ico" aria-hidden="true">
              <Icon icon={PenLine} size={20} />
            </span>
            Start writing…
          </Link>
          <div className="hc-journals">
            <span className="text-overline" style={{ color: "var(--muted-foreground)", paddingBottom: 4 }}>
              Your journals
            </span>
            {journals.map((j) => (
              <Link key={j.id} className="hs-row hs-focusable" href={`/journal?journal_id=${j.id}`}>
                <Icon icon={BookOpen} size={20} />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</span>
                <span className="hs-count">{counts[j.id] ?? 0}</span>
              </Link>
            ))}
            <Link className="hs-row hs-focusable" href="/journal?new_journal=1" style={{ color: "var(--primary)" }}>
              <Icon icon={Plus} size={20} />
              <span style={{ flex: 1 }}>New journal</span>
            </Link>
          </div>
        </section>
      </div>

      {recent.length > 0 && (
        <CarouselSection id="home-recent" title="Recent reflections" moreHref="/journal" moreLabel="See all" variant="notes">
          {recent.map((r) => (
            <Link key={r.id} className="rc" href={`/journal?r=${r.id}`}>
              <span className="rc-title">{entryTitle(r)}</span>
              <span className="rc-text">{entryBody(r.content)}</span>
              <span className="rc-meta">
                {shortDate(r.created_at)}
                <span aria-hidden="true">·</span>
                <span className="rc-label">{entryLabels(r, journals)[0]}</span>
                {r.favorite ? (
                  <span className="rc-fav" aria-label="Favorite">
                    <Heart size={14} fill="currentColor" aria-hidden="true" />
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </CarouselSection>
      )}

      {alsoInProgress.length > 0 && (
        <CarouselSection id="home-progress" title="Also in progress" moreHref="/journeys" moreLabel="All journeys">
          {alsoInProgress.map((a) => (
            <CatalogCard
              key={a.journey.id}
              href={a.waitingForMorning ? `/journeys/${a.journey.id}` : `/journeys/${a.journey.id}?day=${a.nextDay.day}`}
              image={journeyImage(a.journey)}
              category={a.journey.category}
              title={a.journey.title}
              tagline={a.waitingForMorning ? `Tomorrow: ${a.nextDay.title}` : `Next: ${a.nextDay.title}`}
              days={a.totalDays}
              progress={a.completedDays}
            />
          ))}
        </CarouselSection>
      )}

      {more.length > 0 && (
        <CarouselSection
          id="home-journeys"
          title={active ? "Or start another" : "Journeys for you"}
          moreHref="/journeys"
          moreLabel="Browse"
        >
          {more.map((j) => (
            <CatalogCard
              key={j.id}
              href={`/journeys/${j.id}`}
              image={journeyImage(j)}
              category={j.category}
              title={j.title}
              tagline={j.tagline}
              days={(j.journey_days ?? []).length}
              featured={j.featured}
              premium={j.premium && !fullAccess}
            />
          ))}
        </CarouselSection>
      )}

      <HomeTour
        journeyTitle={(active?.journey ?? offer)?.title}
        dayHref={active ? (active.waitingForMorning ? `/journeys/${active.journey.id}` : `/journeys/${active.journey.id}?day=${active.nextDay.day}`) : offer ? `/journeys/${offer.id}?day=1` : "/journeys"}
      />
    </div>
  );
}
