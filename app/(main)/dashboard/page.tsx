"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  PenTool,
  BookOpen,
  Plus,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  X
} from "lucide-react";
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

const TITLE_SUGGESTIONS = [
  "Morning Pages",
  "Gratitude & Joy",
  "Mindful Moments",
  "Creative Sparks",
  "Travel & Wonder",
  "Life Lessons",
  "Deep Questions",
  "Daily Musings"
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("");
  const [journals, setJournals] = useState<any[]>([]);
  const [journalEntryCounts, setJournalEntryCounts] = useState<Record<string, number>>({});
  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
      setUserName(name);

      // Fetch user's journals
      const { data: journalsData } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch reflection counts grouped by journal_id
      const { data: reflectionsData } = await supabase
        .from("reflections")
        .select("id, journal_id")
        .eq("user_id", user.id);

      const counts: Record<string, number> = {};
      if (reflectionsData) {
        reflectionsData.forEach((r) => {
          if (r.journal_id) {
            counts[r.journal_id] = (counts[r.journal_id] || 0) + 1;
          }
        });
      }

      setJournalEntryCounts(counts);
      setJournals(journalsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJournal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titleToSave = newJournalTitle.trim();
    if (!titleToSave || isCreating) return;

    setIsCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("journals")
      .insert([
        {
          title: titleToSave,
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      setJournals((prev) => [data[0], ...prev]);
      setNewJournalTitle("");
      setShowModal(false);
    }
    setIsCreating(false);
  };

  const handleDeleteJournal = async (journalId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("journals")
      .delete()
      .eq("id", journalId)
      .eq("user_id", user.id);

    if (!error) {
      setJournals((prev) => prev.filter((j) => j.id !== journalId));
      setDeleteConfirmId(null);
    }
  };

  const featuredJourney = JOURNEYS[0];

  return (
    <div className="space-y-10 pb-12">
      {/* Header Greeting */}
      <div className="space-y-1.5">
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

      {/* ── YOUR JOURNALS SECTION ── */}
      <section className="space-y-6 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--brand-primary)]" />
              <h2 className="font-serif-editorial text-3xl text-[var(--text-primary)]">
                Your Journals
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light">
              Dedicated spaces to organize your reflections by theme, project, or season of life.
            </p>
          </div>

          <button
            onClick={() => {
              setNewJournalTitle("");
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-xs font-medium rounded-xl transition-all shadow-sm self-start sm:self-auto group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span>New Journal</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 bg-[var(--bg-surface-secondary)]/50 rounded-2xl border border-[var(--border-subtle)] animate-pulse"
              />
            ))}
          </div>
        ) : journals.length === 0 ? (
          /* Empty State with Instant Creation */
          <div className="bg-[var(--bg-surface-secondary)]/70 border border-dashed border-[var(--border-subtle)] rounded-3xl p-8 sm:p-10 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)]/15 flex items-center justify-center mx-auto text-[var(--brand-primary)]">
              <BookOpen className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
                Create Your First Journal
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                Give your journal any title you wish—whether it's for morning thoughts, creative ideas, gratitude, or daily check-ins.
              </p>
            </div>

            {/* Title Suggestions */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium block">
                Popular Titles
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {TITLE_SUGGESTIONS.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setNewJournalTitle(suggestion);
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/15 border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setNewJournalTitle("");
                setShowModal(true);
              }}
              className="py-3 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Journal</span>
            </button>
          </div>
        ) : (
          /* Journals Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {journals.map((j) => {
              const entryCount = journalEntryCounts[j.id] || 0;
              const isConfirmingDelete = deleteConfirmId === j.id;

              return (
                <div
                  key={j.id}
                  className="group relative bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px]"
                >
                  {/* Decorative book spine indicator */}
                  <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r bg-[var(--brand-primary)]/40 group-hover:bg-[var(--brand-primary)] transition-colors" />

                  {/* Header / Meta */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface)] rounded-full border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-medium">
                        <Layers className="w-3 h-3 text-[var(--brand-primary)]" />
                        <span>{entryCount} {entryCount === 1 ? "reflection" : "reflections"}</span>
                      </div>

                      {/* Delete button / confirm */}
                      <div className="relative">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-red-300 dark:border-red-800 rounded-lg p-1 shadow-sm">
                            <button
                              onClick={(e) => handleDeleteJournal(j.id, e)}
                              className="px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirmId(j.id);
                            }}
                            title="Delete journal"
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Journal Title */}
                    <Link
                      href={`/journal?journal_id=${j.id}`}
                      className="block group/link"
                    >
                      <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)] group-hover/link:text-[var(--brand-primary)] transition-colors leading-snug line-clamp-2">
                        {j.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Footer & Quick Actions */}
                  <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/journal/new?journal_id=${j.id}`}
                        title="Write reflection in this journal"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/15 border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-[11px] font-medium transition-colors"
                      >
                        <PenTool className="w-3 h-3 text-[var(--brand-primary)]" />
                        <span>Write</span>
                      </Link>

                      <Link
                        href={`/journal?journal_id=${j.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] rounded-lg text-[11px] font-medium transition-colors"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Journal Card */}
            <button
              onClick={() => {
                setNewJournalTitle("");
                setShowModal(true);
              }}
              className="min-h-[190px] border border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-surface-secondary)]/50 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/15 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-all">
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              </div>
              <div>
                <p className="font-serif-editorial text-lg text-[var(--text-primary)]">
                  Create New Journal
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] font-light mt-0.5">
                  Title it whatever you wish
                </p>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* ── CREATE JOURNAL MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-surface-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--brand-primary)]/15 rounded-full text-xs text-[var(--brand-primary)] font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                <span>New Space</span>
              </div>
              <h3 className="font-serif-editorial text-3xl text-[var(--text-primary)]">
                Create a Journal
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light">
                Give your journal a unique title to house and organize your reflections.
              </p>
            </div>

            <form onSubmit={handleCreateJournal} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider block">
                  Journal Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newJournalTitle}
                  onChange={(e) => setNewJournalTitle(e.target.value)}
                  placeholder="e.g. Morning Thoughts, Deep Questions, Gratitude..."
                  className="w-full px-4 py-3.5 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>

              {/* Title Suggestions */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium block">
                  Or pick a suggestion:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TITLE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewJournalTitle(suggestion)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                        newJournalTitle === suggestion
                          ? "bg-[var(--brand-primary)] text-[var(--bg-surface)] font-medium"
                          : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-4 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newJournalTitle.trim() || isCreating}
                  className="py-2.5 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 text-[var(--bg-surface)] text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm"
                >
                  {isCreating ? "Creating..." : "Create Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

