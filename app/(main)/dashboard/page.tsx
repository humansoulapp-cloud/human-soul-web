"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Flame, RefreshCw } from "lucide-react";
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
  type ReflectionRow,
} from "@/lib/journal";

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
  "living-with-curiosity": "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=1200&q=80",
};

function journeyImage(j: { id: string; image_url?: string | null }) {
  return j.image_url || JOURNEY_IMAGES[j.id] || FALLBACK_IMAGE;
}

function greetingPart() {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 19 ? "Afternoon" : "Evening";
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
 * Progress lives implicitly in `reflections`: each journey reflection is
 * tagged with the journey title and `Day N` (see JourneyDetailClient).
 */
function findActiveJourney(journeys: Journey[], reflections: ReflectionRow[]): ActiveJourney | null {
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

const CARD = "rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]";
const PRIMARY_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60";
const GHOST_BTN =
  "px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] text-[13px] whitespace-nowrap hover:text-[var(--ds-text)] transition-colors";
const MICRO = "text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]";
const RAIL_TITLE = "text-[15px] font-semibold text-[var(--ds-text)]";
const LINK_BTN = "text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)]";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [promptIndex, setPromptIndex] = useState(0);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingMood, setPendingMood] = useState<string | null>(null);

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
    </div>
  );
}
