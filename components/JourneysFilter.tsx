"use client";

import React, { useMemo, useState } from "react";
import { Compass, Search, Shield } from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { Button, EmptyState, Input } from "@/components/ds";
import { CatalogCard } from "@/components/journeys/glass-cards";

const ALL = "All";
const PAGE = 9;

/**
 * The Journeys page body: a compact header with search, the journey in
 * progress (passed in, only when there is one) and the glass catalog.
 */
export default function JourneysFilter({
  journeys,
  categories,
  activeJourneyId = null,
  subscribed = false,
  isAdmin = false,
  inProgress = null,
}: {
  journeys: JourneyRow[];
  categories: string[];
  activeJourneyId?: string | null;
  subscribed?: boolean;
  isAdmin?: boolean;
  inProgress?: React.ReactNode;
}) {
  const [selected, setSelected] = useState(ALL);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journeys
      .filter((j) => j.id !== activeJourneyId)
      .filter((j) => selected === ALL || j.category === selected)
      .filter((j) => !q || `${j.title} ${j.tagline ?? ""} ${j.category ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [journeys, activeJourneyId, selected, query]);

  const searching = query.trim().length > 0;

  return (
    <>
      <div className="jy-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <h1 className="text-h2" style={{ margin: 0 }}>
            Journeys
          </h1>
          <p className="text-body" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            A theme and a prompt for each day, over seven days.
          </p>
        </div>
        <div className="jy-tools">
          <Input
            icon={Search}
            placeholder="Search journeys"
            aria-label="Search journeys"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            className="w-full md:w-[320px]"
          />
          {isAdmin && (
            <Button variant="ghost" size="icon" icon={Shield} href="/admin/journeys" aria-label="Admin journeys" />
          )}
        </div>
      </div>

      {!searching && inProgress ? <section aria-label="Your journey in progress">{inProgress}</section> : null}

      <section className="hs-sec" aria-labelledby="journeys-all" style={{ gap: 20 }}>
        <div className="hs-sec-head" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <h2 id="journeys-all" className="text-h3" style={{ margin: 0 }}>
            {searching ? `Results for “${query.trim()}”` : "All journeys"}
          </h2>
          <div className="hs-tabs" role="tablist" aria-label="Filter by category">
            {[ALL, ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                className="hs-tab hs-focusable"
                aria-selected={selected === cat}
                onClick={() => {
                  setSelected(cat);
                  setShown(PAGE);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No journeys here yet"
            description={query ? "Try another word, or choose All." : "New journeys arrive regularly. Try another category."}
          />
        ) : (
          <>
            <div className="ct-grid">
              {visible.slice(0, shown).map((journey) => (
                <CatalogCard
                  key={journey.id}
                  href={`/journeys/${journey.id}`}
                  image={journeyImage(journey)}
                  category={journey.category}
                  title={journey.title}
                  tagline={journey.tagline}
                  days={(journey.journey_days ?? []).length}
                  time={journey.time_required}
                  featured={journey.featured}
                  premium={journey.premium && !subscribed}
                />
              ))}
            </div>
            {visible.length > shown ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                  Show more journeys
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
