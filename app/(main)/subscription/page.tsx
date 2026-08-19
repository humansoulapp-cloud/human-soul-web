"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";

/** Only the differences the app actually enforces today. */
const ROWS = [
  {
    title: "Day one of every journey",
    meta: "Read, write and keep it, on any journey in the library.",
    free: "Included",
    plus: "Included",
  },
  {
    title: "All the days of a journey",
    meta: "Days open one at a time until the journey ends.",
    free: "—",
    plus: "Included",
  },
  {
    title: "The full library",
    meta: "Every guided journey, new ones as they are added.",
    free: "Previews",
    plus: "Everything",
  },
  {
    title: "Journal history",
    meta: "Search, revisit and export what you wrote.",
    free: "Kept",
    plus: "Kept",
  },
];

const FAQS = [
  {
    q: "What do I get for paying?",
    a: "Every day of every journey. On the free plan you can read and write day one of any journey; the rest of the days stay closed.",
  },
  {
    q: "Can I cancel whenever I want?",
    a: "Yes. Plus stays active until the end of the period you already paid for, and everything you wrote stays readable and exportable.",
  },
  {
    q: "Is my journal private?",
    a: "Entries are private by default, never shown to anyone, and never used to train anything. You can export or delete everything at any time from Profile.",
  },
];

export default function SubscriptionPage() {
  const [plan, setPlan] = useState<string>("year");
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const [plus, setPlus] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setPlus(Boolean(data?.plan && data.plan !== "free"));
    }
    load();
  }, []);

  const selected = PLANS.find((p) => p.key === plan) ?? PLANS[1];

  return (
    <div className="w-full max-w-[980px] mx-auto">
      <div className="flex items-center gap-4 pb-4 border-b border-[var(--ds-line)]">
        <span className="text-[18px] font-bold tracking-[-0.015em]">
          Human<span className="font-normal">Soul</span>
        </span>
        <span className="flex-1" />
        <Link href="/dashboard" className="text-[13px] text-[var(--ds-text-muted)]">
          Not now
        </Link>
      </div>

      <div className="text-center mt-11">
        <span
          className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] ${
            plus
              ? "bg-[var(--ds-gold-soft)] text-[var(--ds-gold)]"
              : "bg-[var(--ds-accent-soft)] text-[var(--ds-accent)]"
          }`}
        >
          {plus ? "PLUS IS ACTIVE" : "FREE PLAN"}
        </span>
        <h1 className="text-[28px] md:text-[34px] font-semibold leading-[1.2] tracking-[-0.02em] mt-4 mb-2">
          Keep every journey open
        </h1>
        <p className="text-[15px] leading-[1.65] text-[var(--ds-text-muted)] mx-auto max-w-[52ch]">
          Day one of every journey is free. Plus opens the days that follow, and the whole library
          as it grows.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 mt-[30px]">
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlan(p.key)}
            className={`text-left px-[22px] py-5 rounded-[15px] border transition-colors ${
              plan === p.key
                ? "border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]"
                : "border-[var(--ds-line)] bg-[var(--ds-surface)]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`w-[15px] h-[15px] rounded-full box-border ${
                  plan === p.key
                    ? "border-[5px] border-[var(--ds-gold)]"
                    : "border border-[var(--ds-line-strong)]"
                }`}
              />
              <span className="text-[10.5px] font-bold tracking-[0.12em] text-[var(--ds-text-muted)]">
                {p.label}
              </span>
              <span className="flex-1" />
              {p.key === "year" && (
                <span className="text-[9.5px] font-bold tracking-[0.1em] text-[var(--ds-gold)]">
                  SAVE 35%
                </span>
              )}
            </span>
            <span className="flex items-baseline gap-2 mt-3.5">
              <span className="text-[34px] font-semibold tracking-[-0.02em]">{p.price}</span>
              <span className="text-[13px] text-[var(--ds-text-muted)]">
                {p.key === "year" ? "per year" : "per month"}
              </span>
            </span>
            <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-2 leading-[1.5]">
              {p.key === "year"
                ? "€3.25 a month, billed once."
                : "Cancel any time, keeps everything you wrote."}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-[22px] rounded-[15px] border border-[var(--ds-line)] bg-[var(--ds-surface)] overflow-hidden">
        <div className="flex items-center gap-3.5 px-5 py-3 border-b border-[var(--ds-line)] text-[9.5px] font-bold tracking-[0.11em] text-[var(--ds-text-muted)]">
          <span className="flex-1 min-w-0">WHAT YOU GET</span>
          <span className="w-[90px] sm:w-[110px] text-right flex-shrink-0">FREE</span>
          <span className="w-[90px] sm:w-[110px] text-right flex-shrink-0 text-[var(--ds-gold)]">
            PLUS
          </span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={r.title}
            className={`flex items-center gap-3.5 px-5 py-4 ${
              i < ROWS.length - 1 ? "border-b border-[var(--ds-line)]" : ""
            }`}
          >
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold">{r.title}</span>
              <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-0.5 leading-[1.5]">
                {r.meta}
              </span>
            </span>
            <span className="w-[90px] sm:w-[110px] flex-shrink-0 text-right text-[12.5px] text-[var(--ds-text-muted)]">
              {r.free}
            </span>
            <span className="w-[90px] sm:w-[110px] flex-shrink-0 text-right text-[13px] font-semibold">
              {r.plus}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          disabled
          className="w-[min(360px,100%)] p-4 rounded-[11px] bg-[var(--ds-gold)] text-[var(--ds-on-gold)] text-[14.5px] font-semibold opacity-60 cursor-not-allowed"
        >
          {plus
            ? "Plus is active"
            : `Continue with ${selected.key === "year" ? "yearly" : "monthly"}, ${selected.price}`}
        </button>
        <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-3">
          {plus
            ? "Manage or cancel any time from Profile."
            : "Payments are not connected yet, so nothing can be charged from here."}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3.5 mt-[26px]">
        {[
          ["Your words stay yours", "Cancel and your journal remains readable and exportable."],
          ["One quiet reminder", "No streak pressure, no badges, no notifications you did not ask for."],
          ["Private by default", "Entries are never shown to anyone and never used to train anything."],
        ].map(([title, body]) => (
          <div
            key={title}
            className="px-5 py-4 rounded-[13px] border border-[var(--ds-line)] bg-[var(--ds-surface)]"
          >
            <div className="text-[13.5px] font-semibold">{title}</div>
            <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-1.5 leading-[1.55]">
              {body}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[30px]">
        {FAQS.map((f, i) => (
          <div key={f.q} className="border-b border-[var(--ds-line)]">
            <button
              onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
              className="flex items-center gap-3.5 w-full px-0.5 py-4 text-left text-[15px] font-semibold text-[var(--ds-text)]"
            >
              <span className="flex-1 min-w-0">{f.q}</span>
              <span className="text-[17px] text-[var(--ds-text-muted)]">{open[i] ? "−" : "+"}</span>
            </button>
            {open[i] && (
              <p className="m-0 mb-4 pr-8 sm:pr-16 text-sm leading-[1.7] text-[var(--ds-text-mid)]">
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
