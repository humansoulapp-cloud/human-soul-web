"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Clock, CheckCircle2, ChevronRight, Tag } from "lucide-react";
import { JOURNEYS, CATEGORIES } from "@/lib/content";

const JOURNEY_IMAGES: Record<string, string> = {
  "becoming-more-human": "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80",
  "art-of-paying-attention": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
  "meeting-yourself": "https://images.unsplash.com/photo-1508226068252-0f5ba68cfa36?auto=format&fit=crop&w=1200&q=80",
  "questions-that-matter": "https://images.unsplash.com/photo-1434458994784-eb5c7f8a7e0c?auto=format&fit=crop&w=1200&q=80",
  "beginning-again": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
  "becoming-present": "https://images.unsplash.com/photo-1499244571948-7cc805844d18?auto=format&fit=crop&w=1200&q=80",
  "art-of-reflection": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "everyday-wonder": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
  "everyday-sacred": "https://images.unsplash.com/photo-1444464666168-49b626f11c0e?auto=format&fit=crop&w=1200&q=80",
  "living-with-curiosity": "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=1200&q=80"
};

export default function JourneysPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredJourneys = JOURNEYS.filter((j) => {
    if (selectedCategory === "All") return true;
    return j.category === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif-editorial text-4xl text-[var(--text-primary)]">
          Guided Journeys
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-light mt-1">
          Multi-day guided experiences to explore different areas of your life.
        </p>
      </div>

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
        {CATEGORIES.map((cat) => (
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
            <div className="absolute inset-0 z-0 bg-[#1F1D1B]">
              <img 
                src={JOURNEY_IMAGES[journey.id] || "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80"}
                alt={journey.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1B] via-[#1F1D1B]/70 to-transparent" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 p-6">
              <span className="inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-black/30 backdrop-blur-md rounded-full border border-white/20 text-white shadow-sm">
                {journey.category}
              </span>
            </div>

            {/* Content overlay */}
            <div className="relative z-10 p-6 pt-0 space-y-4 text-white mt-auto">
              {/* Title & Description */}
              <div>
                <h3 className="font-serif-editorial text-3xl mb-2 drop-shadow-sm leading-tight">
                  {journey.title}
                </h3>
                <p className="text-sm font-light text-white/80 line-clamp-2">
                  {journey.tagline}
                </p>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />
                  <span>{journey.days.length} days</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white uppercase tracking-wider group-hover:text-white/80 transition-colors">
                  Begin <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
