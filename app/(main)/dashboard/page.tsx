"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, PenTool, BookOpen, Plus, CheckCircle2, ChevronRight, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80";

const JOURNEY_IMAGES: Record<string, string> = {
  "becoming-more-human": "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80",
  "art-of-paying-attention": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
  "meeting-yourself": "https://images.unsplash.com/photo-1508226068252-0f5ba68cfa36?auto=format&fit=crop&w=1200&q=80",
  "questions-that-matter": "https://images.unsplash.com/photo-1434458994784-eb5c7f8a7e0c?auto=format&fit=crop&w=1200&q=80",
  "beginning-again": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
  "becoming-present": "https://images.unsplash.com/photo-1499244571948-7cc805844d18?auto=format&fit=crop&w=1200&q=80",
  "art-of-reflection": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "everyday-wonder": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
  "everyday-sacred": "https://images.unsplash.com/photo-1444464666168-49b626f11c0e?auto=format&fit=crop&w=1200&q=80",
  "living-with-curiosity": "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=1200&q=80"
};

function journeyImage(j: { id: string; image_url?: string | null }) {
  return j.image_url || JOURNEY_IMAGES[j.id] || FALLBACK_IMAGE;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

type JourneyDay = { day: number; title: string; prompt: string };
type Journey = {
  id: string;
  title: string;
  category: string | null;
  tagline: string | null;
  image_url: string | null;
  status?: string | null;
  scheduled_publish_at?: string | null;
  featured?: boolean | null;
  journey_days: JourneyDay[];
};

type ActiveJourney = {
  journey: Journey;
  completedDays: number;
  totalDays: number;
  nextDay: JourneyDay;
};

const DAY_TAG = /^Day (\d+)$/;

/**
 * Progress lives implicitly in `reflections`: each journey reflection is tagged
 * with the journey title and `Day N` (see JourneyDetailClient). We derive the
 * furthest day reached per journey, and how recently it was touched.
 */
type ReflectionTags = { tags: string[] | null };

function findActiveJourney(journeys: Journey[], reflections: ReflectionTags[]): ActiveJourney | null {
  const byTitle = new Map(journeys.map((j) => [j.title, j]));
  const seen = new Set<string>();

  // reflections arrive newest-first, so the first match is the latest activity
  for (const r of reflections) {
    const tags: string[] = r.tags ?? [];
    const journey = tags.map((t) => byTitle.get(t)).find(Boolean);
    if (!journey || seen.has(journey.id)) continue;
    seen.add(journey.id);

    const days = [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day);
    if (days.length === 0) continue;

    const daysDone = reflections
      .filter((x) => (x.tags ?? []).includes(journey.title))
      .map((x) => {
        const tag = (x.tags ?? []).map((t) => DAY_TAG.exec(t)).find(Boolean);
        return tag ? Number(tag[1]) : 0;
      });

    const completedDays = Math.max(0, ...daysDone);
    const nextDay = days.find((d) => d.day > completedDays);

    // finished journeys are no longer "in progress" — keep looking
    if (!nextDay) continue;

    return { journey, completedDays, totalDays: days.length, nextDay };
  }

  return null;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [journals, setJournals] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [active, setActive] = useState<ActiveJourney | null>(null);
  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Journeys are public content — load them whether or not there's a session
      const { data: journeysData } = await supabase
        .from("journeys")
        .select("*, journey_days(*)")
        .order("created_at", { ascending: true });

      const now = new Date();
      const visible = ((journeysData ?? []) as Journey[]).filter((j) => {
        const status = j.status || "published";
        if (status === "published") return true;
        if (status === "scheduled" && j.scheduled_publish_at) {
          return new Date(j.scheduled_publish_at) <= now;
        }
        return false;
      });
      setJourneys(visible);

      if (user) {
        const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setUserName(name);

        const { data: reflectionsData } = await supabase
          .from("reflections")
          .select("id, tags, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setActive(findActiveJourney(visible, reflectionsData ?? []));

        // Fetch journals
        const { data: journalsData } = await supabase
          .from("journals")
          .select("*")
          .order("created_at", { ascending: false });

        setJournals(journalsData || []);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalTitle.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("journals")
      .insert([
        {
          title: newJournalTitle.trim(),
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data) {
      setJournals((prev) => [data[0], ...prev]);
      setNewJournalTitle("");
      setShowModal(false);
    }
  };

  // Showcase a journey the user isn't already working through
  const showcaseJourney = useMemo(() => {
    const pool = journeys.filter((j) => j.id !== active?.journey.id);
    return pool.find((j) => j.featured) || pool[0] || null;
  }, [journeys, active]);

  const progressPct = active
    ? Math.round((active.completedDays / active.totalDays) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-medium">
          {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <h1 className="font-serif-editorial text-4xl sm:text-5xl font-normal text-[var(--text-primary)]">
          {getGreeting()}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-base text-[var(--text-secondary)] font-light">
          What's on your mind today?
        </p>
      </div>

      {/* Quick Reflection Card */}
      <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[var(--brand-primary)]/50 transition-colors shadow-sm">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--brand-primary)]/15 rounded-full text-xs text-[var(--brand-primary)] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Reflection</span>
          </div>
          <h2 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
            "A quiet space to pause and listen to your thoughts."
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Write a few lines about what you've noticed today.
          </p>
        </div>

        <Link
          href="/journal/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <PenTool className="w-4 h-4" />
          <span>Reflect</span>
        </Link>
      </div>

      {/* Continue where you left off */}
      {active && (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--brand-primary)]/15 rounded-full text-xs text-[var(--brand-primary)] font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Current Journey</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
              Day {active.completedDays} of {active.totalDays}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={journeyImage(active.journey)}
              alt={active.journey.title}
              className="w-full sm:w-40 h-32 sm:h-28 object-cover rounded-2xl border border-[var(--border-subtle)]"
            />

            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
                {active.journey.title}
              </h3>
              <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-medium">
                Up next — Day {active.nextDay.day}: {active.nextDay.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed line-clamp-2">
                {active.nextDay.prompt}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-primary)] rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <Link
            href={`/journeys/${active.journey.id}?day=${active.nextDay.day}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <span>Continue Journey</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Journey showcase → Journey Library */}
      {showcaseJourney && (
        <Link
          href="/journeys"
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] flex flex-col justify-between min-h-[360px] transition-all hover:border-[var(--brand-primary)] hover:shadow-lg shadow-sm block w-full"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] dark:bg-[#1F1D1B]">
            <img
              src={journeyImage(showcaseJourney)}
              alt={showcaseJourney.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-30 dark:opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-[var(--bg-surface)]/80 dark:from-[#1F1D1B] dark:via-[#1F1D1B]/70 to-transparent" />
          </div>

          {/* Top Badge */}
          <div className="relative z-10 p-8 md:p-10">
            <span className="inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-[var(--bg-surface)]/60 dark:bg-black/30 backdrop-blur-md rounded-full border border-[var(--border-subtle)] dark:border-white/20 text-[var(--text-primary)] dark:text-white shadow-sm">
              {showcaseJourney.category}
            </span>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 p-8 md:p-10 pt-0 space-y-4 text-[var(--text-primary)] dark:text-white mt-auto">
            {/* Title & Description */}
            <div className="max-w-2xl">
              <h3 className="font-serif-editorial text-4xl sm:text-5xl mb-3 leading-tight">
                {showcaseJourney.title}
              </h3>
              <p className="text-base font-light text-[var(--text-secondary)] dark:text-white/80">
                {showcaseJourney.tagline}
              </p>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border-subtle)] dark:border-white/20">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] dark:text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)] dark:opacity-80" />
                <span>{(showcaseJourney.journey_days ?? []).length} days</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] dark:text-white dark:group-hover:text-white/80 transition-colors">
                <span>Browse Journeys</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* User Journals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
            Your Journals
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal</span>
          </button>
        </div>

        {journals.length === 0 ? (
          <div className="bg-[var(--bg-surface-secondary)]/60 border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm text-[var(--text-secondary)]">
              You don't have any custom journals yet.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2 px-4 bg-[var(--brand-primary)]/20 text-[var(--text-primary)] text-xs font-medium rounded-xl hover:bg-[var(--brand-primary)]/30 transition-colors"
            >
              Create Your First Journal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {journals.map((j) => (
              <Link
                key={j.id}
                href={`/journal?journal_id=${j.id}`}
                className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] p-5 rounded-2xl hover:border-[var(--brand-primary)] transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="font-serif-editorial text-lg text-[var(--text-primary)]">
                    {j.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(j.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>
                <BookOpen className="w-5 h-5 text-[var(--brand-primary)]" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Journal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
              New Journal
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Give your journal a name to organize your reflections.
            </p>

            <form onSubmit={handleCreateJournal} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                value={newJournalTitle}
                onChange={(e) => setNewJournalTitle(e.target.value)}
                placeholder="e.g. Morning Thoughts, Gratitude..."
                className="w-full px-4 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-4 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-xs font-medium rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
