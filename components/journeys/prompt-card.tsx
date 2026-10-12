"use client";

import { createClient } from "@/lib/supabase/client";

export type JourneyPrompt = {
  journeyId: string;
  journeyTitle: string;
  day: number;
  title: string;
  prompt: string;
  purpose?: string | null;
  deeper?: string | null;
};

const cache = new Map<string, Promise<JourneyPrompt | null>>();

/** The day a journey entry was written for, looked up by the journey's title (cached). */
export function loadJourneyPrompt(journeyTitle: string, day: number): Promise<JourneyPrompt | null> {
  const key = `${journeyTitle}|${day}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const { data } = await createClient()
          .from("journeys")
          .select("id, title, journey_days(day, title, prompt, purpose, deeper)")
          .eq("title", journeyTitle)
          .limit(1)
          .maybeSingle();
        const row = data as { id: string; title: string; journey_days?: { day: number; title: string; prompt: string; purpose?: string | null; deeper?: string | null }[] } | null;
        const d = row?.journey_days?.find((x) => Number(x.day) === day);
        if (!row || !d) return null;
        return { journeyId: row.id, journeyTitle: row.title, day, title: d.title, prompt: d.prompt ?? "", purpose: d.purpose, deeper: d.deeper };
      })().catch(() => null)
    );
  }
  return cache.get(key)!;
}
