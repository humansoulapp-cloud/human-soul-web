"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Slide = {
  title: string;
  lines?: string[];
  subtitle?: string;
  cta: string;
  choice?: boolean;
};

const SLIDES: Slide[] = [
  { title: "The Human Soul", subtitle: "A quiet place to notice yourself.", cta: "Continue" },
  { title: "There are", lines: ["No streaks.", "No scores.", "No pressure."], cta: "Continue" },
  {
    title: "Your reflections belong to you.",
    subtitle: "Private by default.",
    cta: "Continue",
  },
  {
    title: "Would you like gentle reminders?",
    cta: "Yes",
    choice: true,
  },
  { title: "Welcome.", subtitle: "Whenever you're ready.", cta: "Begin" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const finish = () => {
    localStorage.setItem("onboarding_done", "true");
    router.push("/dashboard");
  };

  const advance = () => {
    if (index === SLIDES.length - 1) {
      finish();
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const onReminderChoice = (yes: boolean) => {
    localStorage.setItem("reminders_enabled", String(yes));
    advance();
  };

  const slide = SLIDES[index];

  return (
    <main className="min-h-screen bg-[var(--bg-surface)] flex flex-col justify-between items-center px-6 py-12 text-center max-w-md mx-auto">
      {/* Dots Indicator */}
      <div className="flex gap-2 justify-center pt-4">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-[var(--brand-primary)]" : "w-1.5 bg-[var(--border-subtle)]"
            }`}
          />
        ))}
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col justify-center items-center my-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <h1 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-[var(--text-primary)] leading-tight">
              {slide.title}
            </h1>

            {slide.lines?.map((l) => (
              <p
                key={l}
                className="font-serif-editorial text-2xl sm:text-3xl text-[var(--text-secondary)] font-light"
              >
                {l}
              </p>
            ))}

            {slide.subtitle && (
              <p className="text-base text-[var(--text-secondary)] font-light mt-2 max-w-xs">
                {slide.subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="w-full space-y-3 pb-4">
        {slide.choice ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onReminderChoice(true)}
              className="w-full py-3.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              Yes, I would
            </button>
            <button
              onClick={() => onReminderChoice(false)}
              className="w-full py-3 px-4 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Not now
            </button>
          </div>
        ) : (
          <button
            onClick={advance}
            className="w-full py-3.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {slide.cta}
          </button>
        )}
      </div>
    </main>
  );
}
