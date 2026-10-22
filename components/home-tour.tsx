"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = { target: string[]; title: string; body: string };

/**
 * Four coachmarks on Home, shown once after onboarding (`/dashboard?tour=1`).
 * Each step spotlights the first visible element matching its selectors.
 */
export default function HomeTour({ journeyTitle, dayHref }: { journeyTitle?: string; dayHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      target: ['.hc-top > .gl-card', '[data-tour="journey"]'],
      title: "Your journey lives here",
      body: journeyTitle
        ? `Day 1 of ${journeyTitle} is open now. Each new day opens the morning after you write the one before.`
        : "Your journey shows here. Each new day opens the morning after you write the one before.",
    },
    {
      target: ['[data-tour="write"]'],
      title: "Write about anything",
      body: "No prompt, no theme. Start a free entry here, or keep separate journals like Gratitude.",
    },
    {
      target: [".hs-reflect", '[data-tour="reflect"]'],
      title: "Reflect from anywhere",
      body: "This button is always at the top. Tap it whenever something is worth writing down.",
    },
    {
      target: ['.hs-nav a[href="/journal"]', '.hs-bottomnav a[href="/journal"]', 'a[href="/journal"]'],
      title: "Everything you write, in one place",
      body: "Your Journal keeps every entry, private to you. Search it, favorite what matters, export it any time.",
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") !== "1") return;
    let seen = false;
    try {
      seen = localStorage.getItem("hs_tour_done") === "true";
    } catch {}
    window.history.replaceState(null, "", window.location.pathname);
    if (!seen) setOpen(true);
  }, []);

  const find = useCallback((s: Step) => {
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
  }, [i, find, journeyTitle]);

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

  const close = useCallback(async () => {
    setOpen(false);
    try {
      localStorage.setItem("hs_tour_done", "true");
    } catch {}
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
    await supabase
      .from("profiles")
      .update({ preferences: { ...((data?.preferences as Record<string, unknown>) ?? {}), toured: true } })
      .eq("user_id", user.id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((v) => Math.min(steps.length - 1, v + 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, steps.length]);

  if (!open) return null;

  const s = steps[i];
  const last = i === steps.length - 1;
  const pad = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const mobile = vw < 640;
  const W = Math.min(380, vw - 32);

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
        <button type="button" className="ht-x" aria-label="Close tour" onClick={close}>
          <X size={18} aria-hidden="true" />
        </button>
        <div className="ht-n">
          {i + 1} of {steps.length}
        </div>
        <h2 className="ht-t" id="ht-t">
          {s.title}
        </h2>
        <p className="ht-p" id="ht-p">
          {s.body}
        </p>
        <div className="ht-acts">
          {i === 0 ? (
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
              Begin Day 1
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
