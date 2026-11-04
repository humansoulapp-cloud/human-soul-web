"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [cardH, setCardH] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  const allSteps: Step[] = [
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

  const find = useCallback((s: Step) => {
    if (s.kind !== "spot" || typeof document === "undefined") return null;
    for (const sel of s.target) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
      }
    }
    return null;
  }, []);

  /* Only steps that point at something on this screen: on a phone the Reflect button isn't there, so that step goes. */
  const steps: Step[] = open ? allSteps.filter((s) => s.kind === "pick" || find(s)) : allSteps;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("tour") === "1";
    if (asked) window.history.replaceState(null, "", window.location.pathname);
    if (show || asked) setOpen(true);
  }, [show]);

  useEffect(() => {
    if (!selected && candidates[0]) setSelected(pickedId ?? candidates[0].id);
  }, [candidates, pickedId, selected]);

  const measure = useCallback(() => {
    const st = steps[Math.min(i, steps.length - 1)];
    const el = st ? find(st) : null;
    setRect(el ? el.getBoundingClientRect() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, find, journeyTitle, hasJourney, steps.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const st = steps[Math.min(i, steps.length - 1)];
    const el = st ? find(st) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      const fixed = getComputedStyle(el).position === "fixed" || el.closest(".hs-topbar, .hs-bottombar");
      if (!fixed) {
        if (window.innerWidth < 640) {
          /* Phone: the target goes just under the top bar, so the card docked below never covers it. */
          const bar = document.querySelector<HTMLElement>(".hs-topbar")?.getBoundingClientRect().height ?? 0;
          window.scrollTo({ top: window.scrollY + r.top - bar - 16, behavior: "instant" as ScrollBehavior });
        } else if (r.top < 80 || r.bottom > window.innerHeight - 260) {
          window.scrollTo({ top: window.scrollY + r.top - 120, behavior: "instant" as ScrollBehavior });
        }
      }
    }
    measure();
    card.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  /* The card's height decides how much of a tall target stays lit above it on a phone. */
  useLayoutEffect(() => {
    if (!open || !card.current) return;
    const h = card.current.offsetHeight;
    if (h !== cardH) setCardH(h);
  });

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

  if (steps.length === 0) return null;
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
    return createPortal(
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
      </div>,
      document.body,
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
  let spot = rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null;
  let docked = mobile || !rect;
  if (rect && mobile) {
    const gap = 12;
    if (rect.top > vh - 160) {
      /* Phone, target in the bottom bar: the card sits just above it and points down at it. */
      docked = false;
      pos = { left: 12, right: 12, bottom: vh - rect.top + pad + 22 };
      arrow = { bottom: -7, left: Math.max(20, Math.min(vw - 60, rect.left + rect.width / 2 - 20)) };
    } else if (spot && cardH) {
      /* Phone, target in the page: the card is docked at the bottom and only the part above it stays lit. */
      const limit = vh - cardH - gap - pad - 12;
      spot = { ...spot, height: Math.max(48, Math.min(spot.height, limit - spot.top)) };
    }
  }
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

  return createPortal(
    <div className="ht" role="presentation">
      {spot ? (
        <div
          className="ht-spot"
          style={{ top: spot.top - pad, left: spot.left - pad, width: spot.width + pad * 2, height: spot.height + pad * 2, borderRadius: Math.min(28, spot.height / 2 + pad) }}
        />
      ) : (
        <div className="ht-scrim" />
      )}
      <div
        key={i}
        ref={card}
        className={`ht-card${docked ? " sheet" : ""}`}
        style={docked ? undefined : mobile ? pos : { ...pos, width: W }}
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
    </div>,
    document.body,
  );
}
