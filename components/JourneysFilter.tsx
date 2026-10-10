"use client";

import React, { useMemo, useState } from "react";
import { Compass, Search } from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { Button, Chip, EmptyState, Input, JourneyCard } from "@/components/ds";

const ALL = "All";
const PAGE = 9;

export default function JourneysFilter({
  journeys,
  categories,
  activeJourneyId = null,
  subscribed = false,
}: {
  journeys: JourneyRow[];
  categories: string[];
  activeJourneyId?: string | null;
  subscribed?: boolean;
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

  return (
    <section className="hs-sec" aria-labelledby="journeys-all" style={{ gap: 20 }}>
      <div className="hs-sec-head" style={{ alignItems: "center" }}>
        <h2 id="journeys-all" className="text-h3" style={{ margin: 0 }}>
          All journeys
        </h2>
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
      </div>

      <div className="hs-scroll-row" role="group" aria-label="Filter by category">
        {[ALL, ...categories].map((cat) => (
          <Chip
            key={cat}
            selected={selected === cat}
            onClick={() => {
              setSelected(cat);
              setShown(PAGE);
            }}
          >
            {cat}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No journeys here yet"
          description={query ? "Try another word, or choose All." : "New journeys arrive regularly. Try another category."}
        />
      ) : (
        <>
          <div className="hs-grid-cards">
            {visible.slice(0, shown).map((journey) => (
              <JourneyCard
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
  );
}
