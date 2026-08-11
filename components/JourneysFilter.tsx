"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80";

export default function JourneysFilter({
  journeys,
  categories,
}: {
  journeys: JourneyRow[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredJourneys = journeys.filter((j) => {
    if (selectedCategory === "All") return true;
    return j.category === selectedCategory;
  });

  return (
    <>
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === "All"
              ? "bg-[var(--brand-primary)] text-[var(--bg-surface)]"
              : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]"
          }`}
        >
          All journeys
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-[var(--brand-primary)] text-[var(--bg-surface)]"
                : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Journey Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJourneys.map((journey) => (
          <Link
            key={journey.id}
            href={`/journeys/${journey.id}`}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] flex flex-col justify-between min-h-[340px] transition-all hover:border-[var(--brand-primary)] hover:shadow-lg shadow-sm"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] dark:bg-[#1F1D1B]">
              <img
                src={
                  journey.image_url ||
                  FALLBACK_IMAGE
                }
                alt={journey.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-30 dark:opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-[var(--bg-surface)]/80 dark:from-[#1F1D1B] dark:via-[#1F1D1B]/70 to-transparent" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 p-6">
              <span className="inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-[var(--bg-surface)]/60 dark:bg-black/30 backdrop-blur-md rounded-full border border-[var(--border-subtle)] dark:border-white/20 text-[var(--text-primary)] dark:text-white shadow-sm">
                {journey.category}
              </span>
            </div>

            {/* Content overlay */}
            <div className="relative z-10 p-6 pt-0 space-y-4 text-[var(--text-primary)] dark:text-white mt-auto">
              <div>
                <h3 className="font-serif-editorial text-3xl mb-2 leading-tight">
                  {journey.title}
                </h3>
                <p className="text-sm font-light text-[var(--text-secondary)] dark:text-white/80 line-clamp-2">
                  {journey.tagline}
                </p>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] dark:border-white/20">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)] dark:text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-secondary)] dark:text-white/80" />
                  <span>{journey.journey_days?.length ?? 0} days</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] dark:text-white dark:group-hover:text-white/80 transition-colors">
                  Begin <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
