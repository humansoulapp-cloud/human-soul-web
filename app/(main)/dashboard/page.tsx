"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, PenTool, Compass, BookOpen, Plus, Flame, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { JOURNEYS } from "@/lib/content";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [reflectionsCount, setReflectionsCount] = useState<number>(0);
  const [journals, setJournals] = useState<any[]>([]);
  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setUserName(name);

        // Fetch reflections count
        const { count } = await supabase
          .from("reflections")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setReflectionsCount(count || 0);

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

  const featuredJourney = JOURNEYS[0];

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
          <span>Write Now</span>
        </Link>
      </div>

      {/* Featured Journey Banner */}
      {featuredJourney && (
        <Link
          href={`/journeys/${featuredJourney.id}`}
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] flex flex-col justify-between min-h-[360px] transition-all hover:border-[var(--brand-primary)] hover:shadow-lg shadow-sm block w-full"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 bg-[var(--bg-surface)] dark:bg-[#1F1D1B]">
            <img 
              src={JOURNEY_IMAGES[featuredJourney.id] || "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80"}
              alt={featuredJourney.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-30 dark:opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-[var(--bg-surface)]/80 dark:from-[#1F1D1B] dark:via-[#1F1D1B]/70 to-transparent" />
          </div>

          {/* Top Badge */}
          <div className="relative z-10 p-8 md:p-10">
            <span className="inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-[var(--bg-surface)]/60 dark:bg-black/30 backdrop-blur-md rounded-full border border-[var(--border-subtle)] dark:border-white/20 text-[var(--text-primary)] dark:text-white shadow-sm">
              {featuredJourney.category}
            </span>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 p-8 md:p-10 pt-0 space-y-4 text-[var(--text-primary)] dark:text-white mt-auto">
            {/* Title & Description */}
            <div className="max-w-2xl">
              <h3 className="font-serif-editorial text-4xl sm:text-5xl mb-3 leading-tight">
                {featuredJourney.title}
              </h3>
              <p className="text-base font-light text-[var(--text-secondary)] dark:text-white/80">
                {featuredJourney.tagline}
              </p>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border-subtle)] dark:border-white/20">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] dark:text-white/90">
                <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)] dark:opacity-80" />
                <span>{featuredJourney.days.length} days</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] dark:text-white dark:group-hover:text-white/80 transition-colors">
                <span>Begin Journey</span>
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
            Your Notebooks
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Notebook</span>
          </button>
        </div>

        {journals.length === 0 ? (
          <div className="bg-[var(--bg-surface-secondary)]/60 border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm text-[var(--text-secondary)]">
              You don't have any custom notebooks yet.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2 px-4 bg-[var(--brand-primary)]/20 text-[var(--text-primary)] text-xs font-medium rounded-xl hover:bg-[var(--brand-primary)]/30 transition-colors"
            >
              Create your first notebook
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
              New Notebook
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Give your notebook a name to organize your reflections.
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
