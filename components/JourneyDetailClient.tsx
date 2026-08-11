"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Check, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { JourneyRow } from "@/lib/actions/journeys";

export default function JourneyDetailClient({ journey }: { journey: JourneyRow }) {
  const days = journey.journey_days ?? [];
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const currentDay = days[activeDayIndex] ?? days[0];

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setSaving(true);
    setSuccessMsg("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const formattedContent = `[${journey.title} - Day ${currentDay.day}: ${currentDay.title}]\n\n${answer.trim()}`;

    const { error } = await supabase.from("reflections").insert([
      {
        user_id: user.id,
        content: formattedContent,
        tags: [journey.title, `Day ${currentDay.day}`],
        favorite: false,
      },
    ]);

    setSaving(false);

    if (!error) {
      setSuccessMsg("Reflection saved to your journal!");
      setAnswer("");
      setTimeout(() => {
        if (activeDayIndex < days.length - 1) {
          setActiveDayIndex(activeDayIndex + 1);
          setSuccessMsg("");
        }
      }, 1500);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/journeys"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All journeys</span>
      </Link>

      {/* Header Info */}
      <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span className="text-[var(--brand-primary)] font-medium uppercase tracking-wider">
            {journey.category}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{journey.time_required}</span>
          </div>
        </div>

        <h1 className="font-serif-editorial text-3xl sm:text-4xl text-[var(--text-primary)]">
          {journey.title}
        </h1>

        <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-line">
          {journey.intro || journey.purpose}
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
            Day {currentDay?.day} of {days.length}: {currentDay?.title}
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {days.map((d, idx) => (
            <button
              key={d.day}
              onClick={() => {
                setActiveDayIndex(idx);
                setSuccessMsg("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                idx === activeDayIndex
                  ? "bg-[var(--brand-primary)] text-[var(--bg-surface)]"
                  : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]"
              }`}
            >
              Day {d.day}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Prompt Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-6">
        <div className="space-y-3">
          <p className="text-base text-[var(--text-primary)] font-light leading-relaxed whitespace-pre-line">
            {currentDay?.prompt}
          </p>

          <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-2xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] italic">
            &ldquo;{currentDay?.purpose}&rdquo;
          </div>
        </div>

        {/* Reflection Input Form */}
        <form
          onSubmit={handleSaveReflection}
          className="space-y-4 pt-4 border-t border-[var(--border-subtle)]"
        >
          {successMsg && (
            <div className="p-3 bg-[#A3B8A7]/20 border border-[#A3B8A7] text-[var(--text-primary)] text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Your reflection for Day {currentDay?.day}:</span>
            </label>
            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your response and what you've noticed today..."
              className="w-full p-4 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] font-light leading-relaxed resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !answer.trim()}
            className="w-full py-3 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save to my Journal"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
