"use client";

import React, { useState } from "react";

const FAQS: [string, string][] = [
  [
    "What does the free plan include?",
    "Day one of every journey, free writing whenever you want, and your whole journal kept and searchable. Only the days after day one need Plus.",
  ],
  [
    "What if I miss a day?",
    "Nothing is lost. The next day opens when you come back, and there is no streak to break.",
  ],
  [
    "How long does a day take?",
    "About seven minutes: a short reading and one question. You can always write more.",
  ],
  [
    "Is it available in Spanish?",
    "The journeys are written in English today. More languages are on the way.",
  ],
  [
    "What happens to my entries if I stop paying?",
    "They stay in your journal, readable and exportable. Only the unopened days of Plus journeys pause.",
  ],
];

export default function LandingFaq() {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <section className="py-16 md:py-[74px]">
      <div className="w-[min(820px,100%-36px)] md:w-[min(820px,100%-48px)] mx-auto">
        <h2 className="text-[26px] md:text-[33px] font-semibold leading-[1.2] tracking-[-0.02em] m-0 mb-2.5">
          Questions people ask first
        </h2>
        <div className="mt-5">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="border-b border-[var(--ds-line)]">
              <button
                onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                className="flex items-center gap-3.5 w-full px-0.5 py-[17px] text-left text-[15.5px] font-semibold text-[var(--ds-text)]"
              >
                <span className="flex-1 min-w-0">{q}</span>
                <span className="text-lg text-[var(--ds-text-muted)]">{open[i] ? "−" : "+"}</span>
              </button>
              {open[i] && (
                <p className="m-0 mb-[17px] pr-8 sm:pr-[70px] text-[14.5px] leading-[1.7] text-[var(--ds-text-mid)]">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
