"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  Monitor,
  Clock,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Calendar,
  Layers,
  Eye,
} from "lucide-react";
import type { JourneyInput, JourneyRow, JourneyDayInput } from "@/lib/actions/journeys";

interface JourneyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Partial<JourneyRow | JourneyInput>;
}

export default function JourneyPreviewModal({
  isOpen,
  onClose,
  journey,
}: JourneyPreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [sampleReflection, setSampleReflection] = useState("");

  if (!isOpen) return null;

  const days: JourneyDayInput[] =
    (journey as JourneyRow).journey_days ??
    (journey as JourneyInput).days ??
    [];

  const currentDay = days[activeDayIndex] ?? days[0] ?? {
    day: 1,
    title: "Day 1",
    prompt: "No prompt content provided yet.",
    purpose: "Reflection purpose will appear here.",
  };

  const status = journey.status || "draft";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div
        className="flex flex-col bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden w-full max-w-5xl h-[92vh] transition-all"
        style={{
          background: "var(--bg-surface, #141715)",
          borderColor: "var(--border-subtle, rgba(255,255,255,0.1))",
        }}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--bg-surface-secondary,rgba(255,255,255,0.03))] border-[var(--border-subtle,rgba(255,255,255,0.1))] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#8BA58F]/20 text-[#8BA58F] flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8BA58F]">
                  User Experience Preview
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase bg-white/10 text-[var(--text-secondary)]">
                  {status}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-sm sm:max-w-md">
                {journey.title || "Untitled Journey"}
              </p>
            </div>
          </div>

          {/* Viewport Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/20 dark:bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  device === "desktop"
                    ? "bg-[#8BA58F] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  device === "mobile"
                    ? "bg-[#8BA58F] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-black/40">
          <div
            className={`w-full transition-all duration-300 ${
              device === "mobile"
                ? "max-w-[390px] bg-[var(--bg-surface,#181b19)] border-4 border-zinc-700/60 rounded-[36px] p-5 shadow-2xl my-auto min-h-[680px]"
                : "max-w-3xl"
            }`}
          >
            {/* Simulation of User Journey Details */}
            <div className="space-y-6">
              {/* Back navigation preview */}
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary,#9ba39d)] opacity-70">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All journeys</span>
              </div>

              {/* Journey Header Card */}
              <div className="bg-[var(--bg-surface-secondary,rgba(255,255,255,0.04))] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-3xl p-6 sm:p-7 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary,#9ba39d)]">
                  <span className="text-[#8BA58F] font-semibold uppercase tracking-wider">
                    {journey.category || "Uncategorized"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{journey.time_required || "5-10 min/day"}</span>
                  </div>
                </div>

                <h1 className="font-serif-editorial text-2xl sm:text-3xl text-[var(--text-primary,#f3f4f3)] leading-snug">
                  {journey.title || "Untitled Journey"}
                </h1>

                {journey.tagline && (
                  <p className="text-sm font-serif-editorial italic text-[#8BA58F]">
                    {journey.tagline}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-[var(--text-secondary,#9ba39d)] font-light leading-relaxed whitespace-pre-line">
                  {journey.intro || journey.purpose || "No introduction description provided."}
                </p>
              </div>

              {/* Day Selector Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif-editorial text-lg sm:text-xl text-[var(--text-primary,#f3f4f3)]">
                    Day {currentDay?.day || 1} of {days.length || 1}: {currentDay?.title || "Overview"}
                  </h2>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {days.map((d, idx) => (
                    <button
                      key={d.day || idx}
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        idx === activeDayIndex
                          ? "bg-[#8BA58F] text-white shadow-sm"
                          : "bg-[var(--bg-surface-secondary,rgba(255,255,255,0.04))] text-[var(--text-secondary,#9ba39d)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] hover:border-[#8BA58F]"
                      }`}
                    >
                      Day {d.day || idx + 1}
                    </button>
                  ))}
                  {days.length === 0 && (
                    <span className="text-xs text-[var(--text-secondary)] italic">
                      No days added to this journey yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Daily Prompt Card */}
              <div className="bg-[var(--bg-surface,rgba(255,255,255,0.02))] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-[var(--text-primary,#f3f4f3)] font-light leading-relaxed whitespace-pre-line">
                    {currentDay?.prompt || "Daily reflection prompt will appear here."}
                  </p>

                  {currentDay?.purpose && (
                    <div className="p-3.5 bg-[var(--bg-surface-secondary,rgba(255,255,255,0.04))] rounded-2xl border border-[var(--border-subtle,rgba(255,255,255,0.08))] text-xs text-[var(--text-secondary,#9ba39d)] italic">
                      &ldquo;{currentDay.purpose}&rdquo;
                    </div>
                  )}

                  {currentDay?.deeper && (
                    <div className="p-3 bg-[#8BA58F]/10 rounded-2xl border border-[#8BA58F]/20 text-xs text-[#8BA58F] leading-relaxed">
                      <span className="font-semibold block mb-0.5">Going deeper:</span>
                      {currentDay.deeper}
                    </div>
                  )}
                </div>

                {/* Reflection Input Form Simulation */}
                <div className="space-y-3.5 pt-4 border-t border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary,#f3f4f3)] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8BA58F]" />
                      <span>Your reflection for Day {currentDay?.day || 1}:</span>
                    </label>
                    <textarea
                      rows={4}
                      value={sampleReflection}
                      onChange={(e) => setSampleReflection(e.target.value)}
                      placeholder="Simulated user journal entry..."
                      className="w-full p-3.5 bg-[var(--bg-surface-secondary,rgba(255,255,255,0.04))] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl text-sm text-[var(--text-primary,#f3f4f3)] placeholder-zinc-500 focus:outline-none focus:border-[#8BA58F] font-light leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 bg-[#8BA58F] text-white text-xs font-medium rounded-xl opacity-90 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Save to my Journal (Preview Only)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
