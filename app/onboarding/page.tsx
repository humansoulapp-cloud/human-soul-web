"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { journeyImage } from "@/lib/journey-images";
import type { Journey } from "@/lib/journal";

const PRIMARY =
  "px-6 py-3.5 rounded-[10px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-sm font-semibold transition-colors";
const GHOST =
  "px-[22px] py-3.5 rounded-[10px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-sm transition-colors";
const LINK = "text-[13px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]";
const H1 = "text-[26px] md:text-[32px] font-semibold leading-[1.22] tracking-[-0.018em] m-0 mb-2.5";
const LEAD = "text-[15px] leading-[1.65] text-[var(--ds-text-muted)] m-0";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [pick, setPick] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) setName(user.user_metadata.display_name);

      const { data } = await supabase
        .from("journeys")
        .select("*, journey_days(day)")
        .order("created_at", { ascending: true });

      const now = new Date();
      const visible = ((data ?? []) as Journey[]).filter((j) => {
        const status = j.status || "published";
        if (status === "published") return true;
        if (status === "scheduled" && j.scheduled_publish_at) {
          return new Date(j.scheduled_publish_at) <= now;
        }
        return false;
      });
      // Free journeys first — day one of a Plus journey is free, the rest is not
      setJourneys([...visible].sort((a, b) => Number(a.premium) - Number(b.premium)).slice(0, 3));
    }
    load();
  }, []);

  const chosen = journeys[pick];
  const preview = name.trim() || "friend";

  const saveName = async () => {
    if (!name.trim()) return;
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { display_name: name.trim() } });
  };

  const finish = () => localStorage.setItem("onboarding_done", "true");

  return (
    <div className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)]">
      <header className="flex items-center gap-4 px-6 md:px-[30px] py-4 border-b border-[var(--ds-line)]">
        <span className="text-[18px] font-bold tracking-[-0.015em]">
          Human<span className="font-normal">Soul</span>
        </span>
        <span className="flex-1" />
        <span className="text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]">
          STEP {step + 1} OF 3
        </span>
        <span className="block w-[120px] h-1 rounded-full bg-[var(--ds-line-strong)]">
          <span
            className="block h-full rounded-full bg-[var(--ds-accent)] transition-all"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </span>
      </header>

      <main className="w-[min(720px,100%-36px)] md:w-[min(720px,100%-48px)] mx-auto pt-14 pb-[70px]">
        {step === 0 && (
          <div>
            <h1 className={H1}>First, what should we call you?</h1>
            <p className={LEAD}>It appears in your greeting each day. Nothing else uses it.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full mt-[26px] px-[18px] py-4 rounded-xl border border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-[var(--ds-text)] text-xl"
            />
            <div className="mt-3 text-[13px] text-[var(--ds-text-muted)]">
              Good evening, {preview}
            </div>
            <div className="flex items-center gap-3 mt-[30px]">
              <button
                onClick={async () => {
                  await saveName();
                  setStep(1);
                }}
                className={PRIMARY}
              >
                Continue
              </button>
              <button onClick={() => setStep(1)} className={LINK}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className={H1}>Choose where to begin, {preview}</h1>
            <p className={LEAD}>
              One day at a time. You can change journey whenever you like.
            </p>

            <div className="flex flex-col gap-3 mt-[26px]">
              {journeys.map((journey, i) => (
                <button
                  key={journey.id}
                  onClick={() => setPick(i)}
                  className={`flex items-center gap-4 p-3.5 rounded-[14px] border text-left transition-colors ${
                    pick === i
                      ? "border-[var(--ds-accent)] bg-[var(--ds-accent-soft)]"
                      : "border-[var(--ds-line)] bg-[var(--ds-surface)]"
                  }`}
                >
                  <span
                    className="w-[84px] h-[60px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                    style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-semibold tracking-[0.11em] text-[var(--ds-accent)] uppercase">
                      {journey.category}
                    </span>
                    <span className="block text-[18px] font-semibold mt-1">{journey.title}</span>
                    <span className="block text-[12.5px] leading-[1.5] text-[var(--ds-text-muted)] mt-[3px]">
                      {journey.tagline}
                    </span>
                  </span>
                  <span
                    className={`w-4 h-4 flex-shrink-0 rounded-full box-border ${
                      pick === i
                        ? "border-[5px] border-[var(--ds-accent)]"
                        : "border border-[var(--ds-line-strong)]"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-7">
              <button onClick={() => setStep(2)} disabled={!chosen} className={PRIMARY}>
                {chosen ? `Start ${chosen.title}` : "Continue"}
              </button>
              <button onClick={() => setStep(0)} className={LINK}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center pt-5">
            <span className="w-[52px] h-[52px] mx-auto rounded-full grid place-items-center bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] border border-[var(--ds-accent)]">
              <Check className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <h1 className={`${H1} mt-[22px]`}>You are set, {preview}</h1>
            <p className={`${LEAD} mx-auto max-w-[46ch]`}>
              {chosen
                ? `Day one of ${chosen.title} is waiting. One day opens at a time, so there is nothing to catch up on.`
                : "One day opens at a time, so there is nothing to catch up on."}
            </p>

            {chosen && (
              <div className="flex items-center gap-4 mt-[26px] mx-auto max-w-[460px] p-[15px] rounded-[14px] border border-[var(--ds-line)] bg-[var(--ds-surface)] text-left">
                <span
                  className="w-[84px] h-[60px] flex-shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url("${journeyImage(chosen)}")` }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[10px] font-bold tracking-[0.11em] text-[var(--ds-text-muted)]">
                    DAY 1 · TODAY
                  </span>
                  <span className="block text-[18px] font-semibold mt-1.5">{chosen.title}</span>
                  <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-[3px]">
                    Reading, then a question
                  </span>
                </span>
              </div>
            )}

            <div className="flex gap-3 justify-center mt-[26px] flex-wrap">
              {chosen && (
                <Link href={`/journeys/${chosen.id}?day=1`} onClick={finish} className={PRIMARY}>
                  Open day 1
                </Link>
              )}
              <Link href="/dashboard" onClick={finish} className={GHOST}>
                Go to home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
