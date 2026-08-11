import React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import JourneysFilter from "@/components/JourneysFilter";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80";

export default async function JourneysPage() {
  const journeys = await getJourneys();
  const categories = Array.from(
    new Set(journeys.map((j) => j.category).filter(Boolean))
  ) as string[];

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

      <JourneysFilter journeys={journeys} categories={categories} />
    </div>
  );
}
