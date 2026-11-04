"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient, currentUser } from "@/lib/supabase/client";
import { journeyImage } from "@/lib/journey-images";
import type { Journey } from "@/lib/journal";

type Spot = { kind: "spot"; target: string[]; title: string; body: string };
type Pick = { kind: "pick" };
type Step = Spot | Pick;

async function savePrefs(patch: (prefs: Record<string, unknown>) => Record<string, unknown>) {
  const supabase = createClient();
  const user = await currentUser(supabase);
  if (!user) return;
  const { data } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
  const prefs = ((data?.preferences as Record<string, unknown>) ?? {}) || {};
  await supabase.from("profiles").update({ preferences: patch(prefs) }).eq("user_id", user.id);
}

/**
 * The Home tour, shown to everyone until they finish or skip it
 * (profiles.preferences.toured), wherever they went first. `/dashboard?tour=1`
 * opens it again.
 *
 * Without a journey in progress, it starts by choosing the first journey
 * (suggested from the onboarding answers); then four coachmarks spotlight the
 * journey card, free writing, Reflect and the Journal.
 */
export default function HomeTour({
  show,
  hasJourney,
  journeyTitle,
  dayHref,
  candidates,
  pickedId,
  onPick,
}: {
  /** The person hasn't finished or skipped the tour yet. */
  show: boolean;
  /** A journey is already in progress, so there's nothing to choose. */
  hasJourney: boolean;
  journeyTitle?: string;
  dayHref: string;
  /** Up to three suggested first journeys, best fit first. */
  candidates: Journey[];
  pickedId: string | null;
  onPick: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [selected, setSelected] = useState<string | null>(pickedId ?? candidates[0]?.id ?? null);
  const card = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    ...(hasJourney || candidates.length === 0 ? [] : [{ kind: "pick" } as Pick]),
    {
      kind: "spot",
      target: [".hc-top > .gl-card", '[data-tour="journey"]'],
      title: "Your journey lives here",
      body: hasJourney
        ? `Pick up ${journeyTitle ?? "your journey"} here. A new day opens each morning after you write the one before.`
        : journeyTitle
          ? `Day 1 of ${journeyTitle} is open now. A new day opens each morning after you write the one before.`
          : "Your journey shows here. A new day opens each morning after you write the one before.",
    },
    {
      kind: "spot",
      target: ['[data-tour="write"]'],
      title: "Write about anything",
      body: "No prompt, no theme. Start a free entry here, or keep separate journals like Gratitude.",
    },
    {
      kind: "spot",
      target: [".hs-reflect", '[data-tour="reflect"]', ".hs-fab"],
      title: "Reflect from anywhere",
      body: "This button is always there. Tap it whenever something is worth writing down.",
    },
    {
      kind: "spot",
      target: ['.hs-nav a[href="/journal"]', '.hs-bottomnav a[href="/journal"]', 'a[href="/journal"]'],
      title: "Everything you write, in one place",
      body: "Your Journal keeps every entry, private to you. Search it, favorite what matters, export it any time.",
    },
  ];

  /* Open for everyone who hasn't finished or skipped it, or when asked with ?tour=1. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("tour") === "1";
    if (asked) window.history.replaceState(null, "", window.location.pathname);
    if (show || asked) setOpen(true);
  }, [show]);

  useEffect(() => {
    if (!selected && candidates[0]) setSelected(pickedId ?? candidates[0].id);
  }, [candidates, pickedId, selected]);

  const find = useCallback((s: Step) => {
    if (s.kind !== "spot") return null;
    for (const sel of s.target) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
      }
    }
    return null;
  }, []);

  const measure = useCallback(() => {
    const el = find(steps[i]);
    setRect(el ? el.getBoundingClientRect() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, find, journeyTitle, hasJourney]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = find(steps[i]);
    if (el) {
      const r = el.getBoundingClientRect();
      const fixed = getComputedStyle(el).position === "fixed" || el.closest(".hs-topbar");
      if (!fixed && (r.top < 80 || r.bottom > window.innerHeight - 260)) {
        window.scrollTo({ top: window.scrollY + r.top - 120, behavior: "instant" as ScrollBehavior });
      }
    }
    measure();
    card.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const on = () => measure();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on);
    };
  }, [open, measure]);

  /* Finished or skipped: never shown again on its own. */
  const close = useCallback(async () => {
    setOpen(false);
    try {
      localStorage.setItem("hs_tour_done", "true");
    } catch {}
    await savePrefs((p) => ({ ...p, toured: true }));
  }, []);

  /* The chosen journey becomes the one Home offers, and the tour moves on to it. */
  const confirmPick = useCallback(() => {
    if (!selected) return;
    onPick(selected);
    setI((v) => v + 1);
    savePrefs((p) => ({ ...p, onboarding: { ...((p.onboarding as Record<string, unknown>) ?? {}), journey: selected } })).catch(() => null);
  }, [selected, onPick]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (steps[i]?.kind === "pick") return;
      if (e.key === "ArrowRight") setI((v) => Math.min(steps.length - 1, v + 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(steps[0].kind === "pick" ? 1 : 0, v - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close, i, steps.length]);

  if (!open) return null;

  const s = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  const counter = (
    <div className="ht-n">
      {i + 1} of {steps.length}
    </div>
  );
  const closeX = (
    <button type="button" className="ht-x" aria-label="Close tour" onClick={close}>
      <X size={18} aria-hidden="true" />
    </button>
  );

  /* ── Step 1 without a journey: choose it ── */
  if (s.kind === "pick") {
    return (
      <div className="ht" role="presentation">
        <div className="ht-scrim" />
        <div ref={card} className="ht-card ht-pick" role="dialog" aria-modal="true" aria-labelledby="ht-t" aria-describedby="ht-p" tabIndex={-1}>
          {closeX}
          {counter}
          <h2 className="ht-t" id="ht-t">
            Choose your first journey
          </h2>
          <p className="ht-p" id="ht-p">
            Seven days, one each morning. We picked these from what you told us. You can start another any time.
          </p>
          <div className="ht-opts" role="radiogroup" aria-label="First journey">
            {candidates.map((j) => {
              const on = selected === j.id;
              return (
                <button key={j.id} type="button" role="radio" aria-checked={on} className="ht-opt" onClick={() => setSelected(j.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={journeyImage(j)} alt="" />
                  <span className="ht-opt-t">
                    {j.category ? <small>{j.category}</small> : null}
                    <b>{j.title}</b>
                    {j.tagline ? <span>{j.tagline}</span> : null}
                  </span>
                  <span className="ht-opt-ck" aria-hidden="true">
                    {on ? <Check size={14} strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ht-acts">
            <Link className="ht-btn ghost" href="/journeys">
              See all journeys
            </Link>
            <button type="button" className="ht-btn pri" disabled={!selected} onClick={confirmPick}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Coachmarks ── */
  const pad = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const mobile = vw < 640;
  const W = Math.min(380, vw - 32);
  const firstSpot = steps[0].kind === "pick" ? 1 : 0;

  let pos: React.CSSProperties = {};
  let arrow: React.CSSProperties | null = null;
  if (rect && !mobile) {
    const below = vh - rect.bottom > 260 || rect.top < 260;
    const left = Math.max(16, Math.min(vw - W - 16, rect.left + rect.width / 2 - W / 2));
    const ax = Math.max(24, Math.min(W - 40, rect.left + rect.width / 2 - left - 8));
    if (below) {
      pos = { top: rect.bottom + pad + 16, left };
      arrow = { top: -7, left: ax };
    } else {
      pos = { bottom: vh - rect.top + pad + 16, left };
      arrow = { bottom: -7, left: ax };
    }
  }

  return (
    <div className="ht" role="presentation">
      {rect ? (
        <div
          className="ht-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: Math.min(28, rect.height / 2 + pad) }}
        />
      ) : (
        <div className="ht-scrim" />
      )}
      <div
        ref={card}
        className={`ht-card${mobile || !rect ? " sheet" : ""}`}
        style={mobile || !rect ? undefined : { ...pos, width: W }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ht-t"
        aria-describedby="ht-p"
        tabIndex={-1}
      >
        {arrow && <span className="ht-arrow" style={arrow} aria-hidden="true" />}
        {closeX}
        {counter}
        <h2 className="ht-t" id="ht-t">
          {s.title}
        </h2>
        <p className="ht-p" id="ht-p">
          {s.body}
        </p>
        <div className="ht-acts">
          {i === firstSpot ? (
            <button type="button" className="ht-btn ghost" onClick={close}>
              Skip tour
            </button>
          ) : (
            <button type="button" className="ht-btn ghost" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          {last ? (
            <button
              type="button"
              className="ht-btn pri"
              onClick={async () => {
                await close();
                router.push(dayHref);
              }}
            >
              {hasJourney ? "Continue your journey" : "Begin Day 1"}
            </button>
          ) : (
            <button type="button" className="ht-btn pri" onClick={() => setI(i + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
