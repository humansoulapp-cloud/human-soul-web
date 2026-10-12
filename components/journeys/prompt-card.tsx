"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Compass, Sparkles } from "lucide-react";
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

function paragraphs(text: string) {
  return text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The journey day behind a reflection, folded above the person's text:
 * journey · day and its title, the first lines of the prompt, «Read the prompt»
 * to unfold it all, and a way back to the day inside the journey.
 */
export function JourneyPromptCard({ data, defaultOpen = false }: { data: JourneyPrompt; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const paras = paragraphs(data.prompt);
  return (
    <section className={`jp${open ? " open" : ""}`} aria-label={`The prompt for ${data.journeyTitle}, Day ${data.day}`}>
      <span className="jp-over">
        <Compass size={14} aria-hidden="true" />
        {data.journeyTitle} · Day {data.day}
      </span>
      <span className="jp-title">{data.title}</span>
      <div id={bodyId} className="jp-body">
        {(open ? paras : paras.slice(0, 1)).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {open && data.purpose ? (
          <div className="jp-why">
            <span>Why this day</span>
            <p>{data.purpose}</p>
          </div>
        ) : null}
        {open && data.deeper ? (
          <p className="jp-deeper">
            <Sparkles size={14} aria-hidden="true" />
            {data.deeper}
          </p>
        ) : null}
      </div>
      <div className="jp-foot">
        {paras.length > 1 || data.purpose || data.deeper ? (
          <button type="button" className="jp-btn" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
            {open ? "Show less" : "Read the prompt"}
            <ChevronDown size={16} aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined }} />
          </button>
        ) : (
          <span />
        )}
        <Link className="jp-link" href={`/journeys/${data.journeyId}?day=${data.day}`}>
          Open Day {data.day} in the journey
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
