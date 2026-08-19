"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";

const ALL = "All journeys";

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

  // The journey in progress already has its own card above the grid
  const visible = journeys
    .filter((j) => j.id !== activeJourneyId)
    .filter((j) => selected === ALL || j.category === selected);

  return (
    <>
      <div className="flex items-center gap-2 mt-9 mb-4 flex-wrap">
        <h2 className="text-[19px] font-semibold m-0">Explore</h2>
        <span className="flex-1" />
        <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
          {[ALL, ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                selected === cat
                  ? "border border-transparent bg-[var(--ds-accent-soft)] text-[var(--ds-text)] font-semibold"
                  : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)] p-8 text-center text-[13px] text-[var(--ds-text-muted)]">
          No journeys in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((journey) => {
            const locked = journey.premium && !subscribed;
            return (
              <Link
                key={journey.id}
                href={`/journeys/${journey.id}`}
                className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-text)] hover:text-[var(--ds-text)] hover:border-[var(--ds-line-strong)] transition-colors"
              >
                <span className="block relative aspect-video">
                  <span
                    className={`block w-full h-full bg-cover bg-center ${
                      locked ? "saturate-50 brightness-90" : ""
                    }`}
                    style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
                  />
                  <span className="absolute left-2.5 bottom-2.5 px-2.5 py-1 rounded-full bg-black/55 text-white text-[10.5px] font-semibold whitespace-nowrap">
                    {(journey.journey_days ?? []).length} days
                  </span>
                  {locked && (
                    <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ds-gold)] text-[var(--ds-on-gold)] text-[9.5px] font-bold tracking-[0.1em]">
                      <Lock className="w-[11px] h-[11px]" strokeWidth={2.2} />
                      PLUS
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-[5px] px-[15px] pt-3.5 pb-[15px] flex-1">
                  <span
                    className={`text-[10px] font-semibold tracking-[0.11em] uppercase ${
                      locked ? "text-[var(--ds-gold)]" : "text-[var(--ds-accent)]"
                    }`}
                  >
                    {journey.category}
                  </span>
                  <span className="text-[19px] font-semibold leading-[1.2]">{journey.title}</span>
                  <span className="text-[12.5px] leading-[1.45] text-[var(--ds-text-muted)]">
                    {journey.tagline}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
