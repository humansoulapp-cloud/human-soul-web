"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, Check, Flame, PenTool, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  MOODS,
  PROMPTS,
  currentStreak,
  dayKey,
  journeysTouched,
  longestStreak,
  oneYearAgo,
  titleAndSnippet,
  weekDots,
  wordCount,
  writtenDays,
  findActiveJourney,
  type Journey,
  type ReflectionRow,
  type UserJournal,
} from "@/lib/journal";
import { journeyImage } from "@/lib/journey-images";

const TITLE_SUGGESTIONS = [
  "Morning Pages",
  "Gratitude & Joy",
  "Mindful Moments",
  "Creative Sparks",
  "Deep Questions",
  "Daily Musings",
  "Travel & Wonder",
  "Life Lessons",
];

function greetingPart() {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 19 ? "Afternoon" : "Evening";
}

const CARD = "rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]";
const PRIMARY_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60 cursor-pointer";
const GHOST_BTN =
  "px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] text-[13px] whitespace-nowrap hover:text-[var(--ds-text)] transition-colors cursor-pointer";
const MICRO = "text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]";
const RAIL_TITLE = "text-[15px] font-semibold text-[var(--ds-text)]";
const LINK_BTN = "text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] cursor-pointer";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [userJournals, setUserJournals] = useState<UserJournal[]>([]);
  const [loading, setLoading] = useState(true);

  const [promptIndex, setPromptIndex] = useState(0);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingMood, setPendingMood] = useState<string | null>(null);

  // Your Journals state
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [isCreatingJournal, setIsCreatingJournal] = useState(false);
  const [journalError, setJournalError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Journeys are public content — load them with or without a session
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
        setUserId(user.id);
        setUserName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");

        // `select("*")` so this keeps working before `mood` exists
        const { data } = await supabase
          .from("reflections")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setReflections((data ?? []) as ReflectionRow[]);

        // User's custom journals
        const { data: userJournalsData } = await supabase
          .from("journals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setUserJournals((userJournalsData ?? []) as UserJournal[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const days = useMemo(() => writtenDays(reflections), [reflections]);
  const week = useMemo(() => weekDots(days), [days]);
  const streak = useMemo(() => currentStreak(days), [days]);
  const active = useMemo(() => findActiveJourney(journeys, reflections), [journeys, reflections]);
  const todayEntry = useMemo(
    () => reflections.find((r) => dayKey(r.created_at) === dayKey(new Date())) ?? null,
    [reflections]
  );
  const memory = useMemo(() => oneYearAgo(reflections), [reflections]);
  const recents = useMemo(() => reflections.slice(0, 3), [reflections]);
  const mood = todayEntry?.mood ?? pendingMood;

  const stats = useMemo(
    () => [
      { label: "Entries", value: String(reflections.length) },
      { label: "Longest", value: `${longestStreak(days)} d` },
      {
        label: "Journeys",
        value: String(journeysTouched(reflections, journeys.map((j) => j.title))),
      },
    ],
    [reflections, days, journeys]
  );

  /**
   * Nothing in the data says which journey follows which, so "suggested"
   * is the first published journey the person has not written in yet,
   * preferring a featured one.
   */
  const suggested = useMemo(() => {
    const started = new Set<string>();
    for (const r of reflections) for (const t of r.tags ?? []) started.add(t);
    const pool = journeys.filter((j) => !started.has(j.title) && j.id !== active?.journey.id);
    return pool.find((j) => j.featured) || pool[0] || null;
  }, [journeys, reflections, active]);

  const saveEntry = useCallback(async () => {
    if (!userId || !draft.trim()) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("reflections")
      .insert([
        {
          user_id: userId,
          content: draft.trim(),
          tags: ["Daily Reflection"],
          mood: pendingMood,
          favorite: false,
        },
      ])
      .select();

    setSaving(false);
    if (insertError || !data?.[0]) {
      setError(insertError?.message ?? "Could not save this entry.");
      return;
    }

    setReflections((prev) => [data[0] as ReflectionRow, ...prev]);
    setDraft("");
    setWriting(false);
    setPendingMood(null);
  }, [userId, draft, pendingMood]);

  const selectMood = useCallback(
    async (value: string) => {
      const next = mood === value ? null : value;
      setPendingMood(next);
      if (!todayEntry) return;

      // There is already an entry for today — the mood belongs to it
      setReflections((prev) =>
        prev.map((r) => (r.id === todayEntry.id ? { ...r, mood: next } : r))
      );
      const supabase = createClient();
      await supabase.from("reflections").update({ mood: next }).eq("id", todayEntry.id);
    },
    [mood, todayEntry]
  );

  const journalEntryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reflections) {
      if (r.journal_id) {
        counts[r.journal_id] = (counts[r.journal_id] || 0) + 1;
      }
      for (const j of userJournals) {
        if ((r.tags ?? []).includes(j.title) && r.journal_id !== j.id) {
          counts[j.id] = (counts[j.id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [reflections, userJournals]);

  const handleCreateJournal = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const titleToSave = newJournalTitle.trim();
      if (!userId || !titleToSave || isCreatingJournal) return;

      setIsCreatingJournal(true);
      setJournalError("");

      const supabase = createClient();
      const { data, error: insertErr } = await supabase
        .from("journals")
        .insert([
          {
            user_id: userId,
            title: titleToSave,
          },
        ])
        .select();

      setIsCreatingJournal(false);

      if (insertErr || !data?.[0]) {
        setJournalError(insertErr?.message ?? "Could not create journal.");
        return;
      }

      setUserJournals((prev) => [data[0] as UserJournal, ...prev]);
      setNewJournalTitle("");
      setIsJournalModalOpen(false);
    },
    [userId, newJournalTitle, isCreatingJournal]
  );

  const handleDeleteJournal = useCallback(
    async (journalId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!userId) return;
      if (
        !window.confirm(
          "Are you sure you want to delete this journal? Your reflections will remain saved in your journal feed."
        )
      ) {
        return;
      }

      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("journals")
        .delete()
        .eq("id", journalId)
        .eq("user_id", userId);

      if (!delErr) {
        setUserJournals((prev) => prev.filter((j) => j.id !== journalId));
      }
    },
    [userId]
  );

  const subline = todayEntry
    ? "You have written today. The day is yours from here."
    : mood
      ? `Noted as ${mood.toLowerCase()}. Take a few minutes when you are ready.`
      : "Two questions are waiting: one from your journey, one from today.";

  const progressPct = active ? Math.round((active.completedDays / active.totalDays) * 100) : 0;
  const savedPreview = titleAndSnippet(todayEntry?.content ?? null);

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-[var(--ds-text-muted)]">Loading…</div>;
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className={MICRO}>
            {new Date()
              .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
              .toUpperCase()}
          </div>
          <h1 className="text-[28px] md:text-[37px] font-semibold tracking-[-0.015em] mt-[7px] mb-1.5">
            Good {greetingPart()}
            {userName ? `, ${userName}` : ""}
          </h1>
          <p className="text-sm text-[var(--ds-text-muted)] m-0">{subline}</p>
        </div>
        <div className="flex items-center gap-2.5 px-[15px] py-2.5 rounded-full border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-text-mid)] text-[13px]">
          <Flame className="w-[15px] h-[15px]" strokeWidth={1.8} />
          <span>
            <strong className="font-semibold">{streak}</strong> {streak === 1 ? "day" : "days"} in a row
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-[18px] mt-6 items-start">
        {/* ── Today + current journey ── */}
        <div className="contents md:flex md:flex-col md:gap-[18px] md:min-w-0">
          <div className={`${CARD} p-5 md:p-6`}>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-[11px] py-[5px] rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[10px] font-bold tracking-[0.12em]">
                TODAY&apos;S REFLECTION
              </span>
              <span className="flex-1" />
              <button
                onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
                className="inline-flex items-center gap-1.5 px-[11px] py-1.5 rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] text-[11.5px] hover:text-[var(--ds-text)] transition-colors"
              >
                <RefreshCw className="w-[13px] h-[13px]" strokeWidth={1.9} />
                Another prompt
              </button>
            </div>

            <h2 className="text-[22px] md:text-[26px] font-semibold leading-[1.3] tracking-[-0.012em] mt-[15px] max-w-[34ch]">
              {PROMPTS[promptIndex]}
            </h2>

            {writing ? (
              <div>
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write as it comes. No one else reads this."
                  className="w-full min-h-[200px] my-[18px] mb-3.5 bg-transparent border-none text-[16.5px] leading-[1.8] text-[var(--ds-text)] resize-none"
                />
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--ds-line)] flex-wrap">
                  <span className={MICRO}>{wordCount(draft)} WORDS</span>
                  <span className="text-[12.5px] text-[var(--ds-text-muted)]">
                    Saved to today · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex-1" />
                  <button
                    onClick={() => {
                      setWriting(false);
                      setDraft("");
                      setError("");
                    }}
                    className={GHOST_BTN}
                  >
                    Discard
                  </button>
                  <button onClick={saveEntry} disabled={saving || !draft.trim()} className={PRIMARY_BTN}>
                    {saving ? "Saving…" : "Save entry"}
                  </button>
                </div>
                {error && <p className="mt-3 text-[12.5px] text-[var(--ds-danger)]">{error}</p>}
              </div>
            ) : todayEntry ? (
              <div className="flex items-center gap-3 mt-5 px-4 py-3.5 rounded-xl bg-[var(--ds-accent-soft)] border border-[var(--ds-line)]">
                <span className="w-[26px] h-[26px] flex-shrink-0 rounded-full grid place-items-center bg-[var(--ds-accent)] text-[var(--ds-on-accent)]">
                  <Check className="w-[13px] h-[13px]" strokeWidth={2.4} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold">Today&apos;s entry is saved</div>
                  <div className="text-[12.5px] text-[var(--ds-text-muted)] truncate">
                    {savedPreview.title}
                  </div>
                </div>
                <Link href="/journal/new" className={GHOST_BTN}>
                  Add more
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <button onClick={() => setWriting(true)} className={PRIMARY_BTN}>
                  Start writing
                </button>
                <span className="text-[12.5px] text-[var(--ds-text-muted)]">About 5 minutes</span>
              </div>
            )}
          </div>

          {active && (
            <div className={`${CARD} flex flex-col sm:flex-row gap-5 p-4`}>
              <span
                className="w-full h-32 sm:w-[150px] sm:h-auto flex-shrink-0 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url("${journeyImage(active.journey)}")` }}
              />
              <div className="flex-1 min-w-0">
                <div className={MICRO}>
                  CURRENT JOURNEY · DAY {active.nextDay.day} OF {active.totalDays}
                </div>
                <div className="text-[22px] font-semibold leading-[1.2] mt-1.5 mb-[3px]">
                  {active.journey.title}
                </div>
                <div className="text-[12.5px] text-[var(--ds-text-muted)]">
                  Today · {active.nextDay.title}
                </div>
                <span className="block h-1 rounded-full bg-[var(--ds-line-strong)] mt-3 max-w-[340px]">
                  <span
                    className="block h-full rounded-full bg-[var(--ds-accent)] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </span>
                <div className="flex gap-2.5 mt-3.5 flex-wrap">
                  <Link
                    href={`/journeys/${active.journey.id}?day=${active.nextDay.day}`}
                    className={`${PRIMARY_BTN} inline-block`}
                  >
                    Open today
                  </Link>
                  <Link href={`/journeys/${active.journey.id}`} className={`${GHOST_BTN} inline-block`}>
                    Journey overview
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent entries — after the rail on mobile, as in M. Mobile */}
          <div className="order-3 md:order-none">
            <div className="flex items-baseline gap-2.5 mt-2 mb-2.5">
              <h2 className="text-[19px] font-semibold m-0">Recent entries</h2>
              <span className="flex-1" />
              <Link href="/journal" className={LINK_BTN}>
                Open journal →
              </Link>
            </div>

            {recents.length === 0 ? (
              <div className={`${CARD} p-6 text-center text-[13px] text-[var(--ds-text-muted)]`}>
                Nothing written yet. Today&apos;s prompt is a good place to start.
              </div>
            ) : (
              <div className={`${CARD} overflow-hidden`}>
                {recents.map((r, i) => {
                  const date = new Date(r.created_at);
                  const { title, snippet } = titleAndSnippet(r.content);
                  return (
                    <Link
                      key={r.id}
                      href={`/journal?entry=${r.id}`}
                      className={`flex items-center gap-4 px-4 py-[15px] text-[var(--ds-text)] hover:bg-[var(--ds-surface-2)] transition-colors ${
                        i < recents.length - 1 ? "border-b border-[var(--ds-line)]" : ""
                      }`}
                    >
                      <span className="flex-shrink-0 w-11 text-center text-[19px] font-semibold leading-[1.05]">
                        {date.getDate()}
                        <span className="block text-[9.5px] font-semibold tracking-[0.1em] text-[var(--ds-text-muted)] mt-0.5">
                          {date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
                        </span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold truncate">{title}</span>
                        <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-[3px] truncate">
                          {snippet}
                        </span>
                      </span>
                      {r.mood && (
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] text-[11px]">
                          {r.mood}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Your Journals — Below recent entries ── */}
          <div className="order-4 md:order-none">
            <div className="flex items-baseline gap-2.5 mt-2 mb-2.5">
              <h2 className="text-[19px] font-semibold m-0 text-[var(--ds-text)]">Your Journals</h2>
              <span className="flex-1" />
              <button
                onClick={() => {
                  setNewJournalTitle("");
                  setJournalError("");
                  setIsJournalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                New journal
              </button>
            </div>

            {userJournals.length === 0 ? (
              <div className={`${CARD} p-6 sm:p-7 text-center flex flex-col items-center`}>
                <div className="w-11 h-11 rounded-xl bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] grid place-items-center mb-3">
                  <BookOpen className="w-5 h-5" strokeWidth={1.9} />
                </div>
                <div className="text-[15px] font-semibold text-[var(--ds-text)]">
                  No custom journals yet
                </div>
                <p className="text-[13px] text-[var(--ds-text-muted)] mt-1.5 mb-4 max-w-[38ch]">
                  Create your own titled journals to organize reflections by project, theme, or state of mind.
                </p>
                <button
                  onClick={() => {
                    setNewJournalTitle("");
                    setJournalError("");
                    setIsJournalModalOpen(true);
                  }}
                  className={PRIMARY_BTN}
                >
                  Create your first journal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {userJournals.map((j) => {
                  const count = journalEntryCounts[j.id] || 0;
                  return (
                    <div
                      key={j.id}
                      className={`${CARD} p-4 sm:p-4.5 hover:border-[var(--ds-line-strong)] transition-all flex flex-col justify-between group relative`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] grid place-items-center flex-shrink-0">
                            <BookOpen className="w-4 h-4" strokeWidth={2} />
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--ds-surface-2)] text-[var(--ds-text-muted)]">
                              {count} {count === 1 ? "entry" : "entries"}
                            </span>
                            <button
                              onClick={(e) => handleDeleteJournal(j.id, e)}
                              aria-label={`Delete ${j.title}`}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ds-text-muted)] hover:text-[var(--ds-danger)] transition-opacity cursor-pointer"
                              title="Delete journal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <Link
                          href={`/journal?journal_id=${j.id}`}
                          className="block group/link mt-3 mb-1"
                        >
                          <h3 className="text-[15.5px] font-semibold text-[var(--ds-text)] group-hover/link:text-[var(--ds-accent)] transition-colors leading-snug line-clamp-2">
                            {j.title}
                          </h3>
                        </Link>
                        <p className="text-[11.5px] text-[var(--ds-text-muted)] m-0">
                          Created {new Date(j.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="pt-3.5 mt-3.5 border-t border-[var(--ds-line)] flex items-center justify-between text-xs">
                        <Link
                          href={`/journal/new?journal_id=${j.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[12px] font-medium transition-colors"
                        >
                          <PenTool className="w-3.5 h-3.5 text-[var(--ds-accent)]" />
                          <span>Write</span>
                        </Link>

                        <Link
                          href={`/journal?journal_id=${j.id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors"
                        >
                          <span>View entries</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Journal Card in Grid */}
                <button
                  onClick={() => {
                    setNewJournalTitle("");
                    setJournalError("");
                    setIsJournalModalOpen(true);
                  }}
                  className="border border-dashed border-[var(--ds-line-strong)] hover:border-[var(--ds-accent)] bg-[var(--ds-surface)]/50 hover:bg-[var(--ds-surface)] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] group"
                >
                  <span className="w-9 h-9 rounded-full bg-[var(--ds-surface-2)] group-hover:bg-[var(--ds-accent-soft)] group-hover:text-[var(--ds-accent)] grid place-items-center text-[var(--ds-text-muted)] transition-colors mb-2">
                    <Plus className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--ds-text)]">
                    Create new journal
                  </span>
                  <span className="text-[11.5px] text-[var(--ds-text-muted)] mt-0.5">
                    Title it as you wish
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right rail ── */}
        <div className="order-2 md:order-none flex flex-col gap-[18px] min-w-0 md:row-span-2">
          <div className={`${CARD} p-[18px]`}>
            <div className={RAIL_TITLE}>This week</div>
            <div className="flex gap-1.5 mt-3.5">
              {week.map((d) => (
                <span key={d.key} className="flex-1 flex flex-col items-center gap-[7px]">
                  <span
                    className={`w-full aspect-square max-w-[30px] rounded-full grid place-items-center text-[11px] font-bold ${
                      d.done
                        ? "bg-[var(--ds-accent)] text-[var(--ds-on-accent)]"
                        : d.isToday
                          ? "border border-[var(--ds-accent)] bg-[var(--ds-accent-soft)]"
                          : "border border-dashed border-[var(--ds-line-strong)]"
                    }`}
                  >
                    {d.done ? "✓" : ""}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold ${
                      d.isToday ? "text-[var(--ds-accent)]" : "text-[var(--ds-text-muted)]"
                    }`}
                  >
                    {d.label}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex mt-[18px] pt-4 border-t border-[var(--ds-line)]">
              {stats.map((s) => (
                <span key={s.label} className="flex-1">
                  <span className="block text-xl font-semibold tracking-[-0.01em]">{s.value}</span>
                  <span className="block text-[10.5px] font-semibold tracking-[0.1em] text-[var(--ds-text-muted)] mt-0.5 uppercase">
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className={`${CARD} p-[18px]`}>
            <div className={RAIL_TITLE}>How is today feeling?</div>
            <div className="flex flex-wrap gap-[7px] mt-3">
              {MOODS.map((m) => {
                const on = mood === m;
                return (
                  <button
                    key={m}
                    onClick={() => selectMood(m)}
                    className={`px-3 py-[7px] rounded-full text-[12.5px] transition-colors ${
                      on
                        ? "border border-transparent bg-[var(--ds-accent-soft)] text-[var(--ds-text)] font-semibold"
                        : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <p className="text-[12.5px] text-[var(--ds-text-muted)] mt-3 leading-relaxed">
              {mood
                ? "Added to today. You can change it any time."
                : "One word is enough. It becomes part of the entry."}
            </p>
          </div>

          {memory && (
            <div className={`${CARD} p-[18px]`}>
              <div className="flex items-center gap-2">
                <div className={RAIL_TITLE}>One year ago</div>
                <span className="flex-1" />
                <span className="text-[12.5px] text-[var(--ds-text-muted)]">
                  {new Date(memory.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-[1.7] text-[var(--ds-text-mid)] italic my-3 line-clamp-4">
                “{(memory.content ?? "").trim()}”
              </p>
              <button onClick={() => router.push(`/journal?entry=${memory.id}`)} className={LINK_BTN}>
                Read that entry →
              </button>
            </div>
          )}

          {suggested && (
            <div className={`${CARD} overflow-hidden`}>
              <span
                className="block aspect-[16/8] bg-cover bg-center"
                style={{ backgroundImage: `url("${journeyImage(suggested)}")` }}
              />
              <div className="px-4 pt-4 pb-4">
                <div className="text-[10px] font-bold tracking-[0.12em] text-[var(--ds-accent)]">
                  SUGGESTED FOR YOU
                </div>
                <div className="text-[17px] font-semibold leading-[1.25] mt-[7px] mb-1">
                  {suggested.title}
                </div>
                <div className="text-[12.5px] text-[var(--ds-text-muted)]">
                  {(suggested.journey_days ?? []).length} days
                  {suggested.category ? ` · ${suggested.category}` : ""}
                </div>
                <Link
                  href={`/journeys/${suggested.id}`}
                  className={`${GHOST_BTN} block w-full text-center mt-3.5`}
                >
                  Start journey
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Journal Modal ── */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--ds-surface)] border border-[var(--ds-line)] rounded-2xl p-6 sm:p-7 w-full max-w-[460px] shadow-2xl relative">
            <button
              onClick={() => setIsJournalModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[var(--ds-accent)] mb-2">
              <BookOpen className="w-4 h-4" />
              <span className={MICRO}>NEW JOURNAL SPACE</span>
            </div>

            <h3 className="text-[22px] font-semibold text-[var(--ds-text)] m-0 leading-tight">
              Create a Journal
            </h3>
            <p className="text-[13px] text-[var(--ds-text-muted)] mt-1.5 mb-5 leading-relaxed">
              Give your journal a title to house and organize your reflections.
            </p>

            <form onSubmit={handleCreateJournal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.1em] text-[var(--ds-text-muted)] uppercase mb-2">
                  Journal Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newJournalTitle}
                  onChange={(e) => setNewJournalTitle(e.target.value)}
                  placeholder="e.g. Morning Pages, Gratitude & Joy, Deep Questions..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-[15px] text-[var(--ds-text)] placeholder-[var(--ds-text-muted)] focus:border-[var(--ds-accent)] transition-colors"
                />
              </div>

              <div>
                <span className="block text-[11px] font-bold tracking-[0.1em] text-[var(--ds-text-muted)] uppercase mb-2">
                  Or pick a suggestion:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TITLE_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewJournalTitle(suggestion)}
                      className={`px-2.5 py-1 text-[12px] rounded-full transition-colors cursor-pointer ${
                        newJournalTitle === suggestion
                          ? "bg-[var(--ds-accent)] text-[var(--ds-on-accent)] font-semibold"
                          : "border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] bg-[var(--ds-surface)]"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {journalError && (
                <p className="text-[12.5px] text-[var(--ds-danger)] m-0">{journalError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--ds-line)]">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className={GHOST_BTN}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newJournalTitle.trim() || isCreatingJournal}
                  className={PRIMARY_BTN}
                >
                  {isCreatingJournal ? "Creating…" : "Create Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
