"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, Heart, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  dayKey,
  longestStreak,
  wordCount,
  writtenDays,
  type ReflectionRow,
} from "@/lib/journal";

const CARD = "rounded-[14px] border border-[var(--ds-line)] bg-[var(--ds-surface)]";
const RAIL_TITLE = "text-[15px] font-semibold";
const GHOST_SMALL =
  "flex-1 px-3 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[12.5px] text-center transition-colors";

const FILTERS = ["All", "Journeys", "Free writing", "Favorites"] as const;
type Filter = (typeof FILTERS)[number];

const DAY_TAG = /^Day (\d+)$/;

/** Journey entries carry [journey title, "Day N"]; anything else is free writing. */
function entryMeta(entry: ReflectionRow) {
  const tags = entry.tags ?? [];
  const dayTag = tags.find((t) => DAY_TAG.test(t));
  const journeyTitle = tags.find((t) => t !== dayTag && !DAY_TAG.test(t));

  if (dayTag && journeyTitle) {
    return {
      kind: "journey" as const,
      source: `${journeyTitle} · ${dayTag}`,
    };
  }
  return { kind: "free" as const, source: "Free writing" };
}

/** Strip the "[Journey - Day N: Title]" header journey entries are saved with. */
function entryText(content: string | null) {
  const text = (content ?? "").trim();
  return text.startsWith("[") ? text.slice(text.indexOf("]") + 1).trim() : text;
}

function chip(on: boolean) {
  return `inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full text-[12.5px] whitespace-nowrap transition-colors ${
    on
      ? "border border-transparent bg-[var(--ds-accent-soft)] text-[var(--ds-text)] font-semibold"
      : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
  }`;
}

function JournalFeed() {
  const searchParams = useSearchParams();
  const focusEntry = searchParams.get("entry");

  const [entries, setEntries] = useState<ReflectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sortNewest, setSortNewest] = useState(true);
  const [tag, setTag] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setEntries((data ?? []) as ReflectionRow[]);
      setLoading(false);
    }
    load();
  }, []);

  // An entry linked from Home opens expanded and scrolls into view
  useEffect(() => {
    if (!focusEntry || loading) return;
    setOpen((prev) => ({ ...prev, [focusEntry]: true }));
    document.getElementById(`entry-${focusEntry}`)?.scrollIntoView({ block: "center" });
  }, [focusEntry, loading]);

  const toggleFavorite = async (entry: ReflectionRow) => {
    const next = !entry.favorite;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, favorite: next } : e)));
    const supabase = createClient();
    await supabase.from("reflections").update({ favorite: next }).eq("id", entry.id);
  };

  const counts = useMemo(
    () => ({
      All: entries.length,
      Journeys: entries.filter((e) => entryMeta(e).kind === "journey").length,
      "Free writing": entries.filter((e) => entryMeta(e).kind === "free").length,
      Favorites: entries.filter((e) => e.favorite).length,
    }),
    [entries]
  );

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) for (const t of e.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => {
      const { kind, source } = entryMeta(e);
      if (filter === "Journeys" && kind !== "journey") return false;
      if (filter === "Free writing" && kind !== "free") return false;
      if (filter === "Favorites" && !e.favorite) return false;
      if (tag && !(e.tags ?? []).includes(tag)) return false;
      if (day && dayKey(e.created_at) !== day) return false;
      if (!q) return true;
      return `${e.content ?? ""} ${source} ${(e.tags ?? []).join(" ")} ${e.mood ?? ""}`
        .toLowerCase()
        .includes(q);
    });
    return sortNewest ? list : [...list].reverse();
  }, [entries, query, filter, tag, day, sortNewest]);

  const groups = useMemo(() => {
    const map = new Map<string, ReflectionRow[]>();
    for (const e of visible) {
      const label = new Date(e.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
      map.set(label, [...(map.get(label) ?? []), e]);
    }
    return [...map.entries()];
  }, [visible]);

  // Calendar for the current month
  const today = new Date();
  const written = useMemo(() => writtenDays(entries), [entries]);
  const calendar = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first grid
    const lead = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    return { cells, year, month, daysInMonth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const monthWritten = useMemo(
    () =>
      calendar.cells.filter(
        (d) => d !== null && written.has(dayKey(new Date(calendar.year, calendar.month, d)))
      ).length,
    [calendar, written]
  );

  const stats = useMemo(
    () => [
      { label: "Entries", value: String(entries.length) },
      {
        label: "Words",
        value: entries
          .reduce((total, e) => total + wordCount(entryText(e.content)), 0)
          .toLocaleString("en-GB"),
      },
      { label: "Longest streak", value: `${longestStreak(written)} d` },
    ],
    [entries, written]
  );

  const firstEntry = entries[entries.length - 1];
  const countLabel = entries.length
    ? `${entries.length} entries · ${counts.Journeys} from journeys${
        firstEntry
          ? ` · first written ${new Date(firstEntry.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : ""
      }`
    : "Nothing written yet.";

  const resetAll = () => {
    setQuery("");
    setFilter("All");
    setTag(null);
    setDay(null);
  };

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-[var(--ds-text-muted)]">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-end gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-[28px] md:text-[37px] font-semibold tracking-[-0.015em] m-0 mb-1.5">
            Journal
          </h1>
          <p className="text-sm text-[var(--ds-text-muted)] m-0">{countLabel}</p>
        </div>
        <Link
          href="/journal/new"
          className="px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors"
        >
          New entry
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-[18px] mt-6 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-3 px-4 h-12 rounded-xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
            <Search className="w-4 h-4 flex-shrink-0 text-[var(--ds-text-muted)]" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your entries, prompts and tags"
              className="flex-1 min-w-0 bg-transparent border-none text-sm text-[var(--ds-text)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[12.5px] font-semibold text-[var(--ds-accent)]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3.5 mb-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setTag(null);
                  setDay(null);
                }}
                className={chip(filter === f)}
              >
                {f}
                <span className="text-[11px] font-semibold opacity-60">{counts[f]}</span>
              </button>
            ))}
            <span className="flex-1" />
            <button
              onClick={() => setSortNewest((v) => !v)}
              className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] text-xs transition-colors"
            >
              <ArrowDownUp className="w-[13px] h-[13px]" strokeWidth={1.9} />
              {sortNewest ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="mt-[22px] px-6 py-11 rounded-[14px] border border-dashed border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-center flex flex-col items-center">
              <div className="text-[17px] font-semibold">
                {entries.length === 0 ? "Your journal is empty" : "Nothing matches that yet"}
              </div>
              <p className="text-sm text-[var(--ds-text-muted)] mt-2 max-w-[40ch]">
                {entries.length === 0
                  ? "Everything you write, on your own or inside a journey, is kept here."
                  : "Try a shorter word, or clear the filters to see every entry again."}
              </p>
              {entries.length === 0 ? (
                <Link
                  href="/journal/new"
                  className="mt-4 px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px]"
                >
                  Write your first entry
                </Link>
              ) : (
                <button
                  onClick={resetAll}
                  className="mt-4 px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px]"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-[26px] mt-[22px]">
              {groups.map(([month, list]) => (
                <div key={month}>
                  <div className="flex items-center gap-3.5">
                    <span className="text-[11px] font-bold tracking-[0.12em] text-[var(--ds-text-muted)] uppercase whitespace-nowrap">
                      {month}
                    </span>
                    <span className="flex-1 h-px bg-[var(--ds-line)]" />
                    <span className="text-[11.5px] text-[var(--ds-text-muted)] whitespace-nowrap">
                      {list.length} {list.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-3">
                    {list.map((entry) => {
                      const { kind, source } = entryMeta(entry);
                      const text = entryText(entry.content);
                      const isOpen = Boolean(open[entry.id]);
                      return (
                        <div key={entry.id} id={`entry-${entry.id}`} className={`${CARD} px-5 pt-[18px] pb-[17px]`}>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span
                              className={`px-2.5 py-[3px] rounded-full text-[10.5px] font-semibold tracking-[0.04em] whitespace-nowrap ${
                                kind === "journey"
                                  ? "bg-[var(--ds-accent-soft)] text-[var(--ds-accent)]"
                                  : "bg-[var(--ds-surface-2)] text-[var(--ds-text-muted)]"
                              }`}
                            >
                              {source}
                            </span>
                            <span className="flex-1" />
                            {entry.mood && (
                              <span className="text-[12.5px] text-[var(--ds-text-muted)] whitespace-nowrap">
                                {entry.mood}
                              </span>
                            )}
                            <button
                              onClick={() => toggleFavorite(entry)}
                              aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
                              className={`p-1 grid place-items-center ${
                                entry.favorite
                                  ? "text-[var(--ds-accent)]"
                                  : "text-[var(--ds-text-muted)]"
                              }`}
                            >
                              <Heart
                                className="w-[15px] h-[15px]"
                                strokeWidth={1.7}
                                fill={entry.favorite ? "currentColor" : "none"}
                              />
                            </button>
                          </div>

                          <button
                            onClick={() => setOpen((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                            className="block w-full text-left mt-3 text-[var(--ds-text)]"
                          >
                            <span
                              className={`text-[15px] leading-[1.72] text-[var(--ds-text-mid)] whitespace-pre-line ${
                                isOpen ? "block" : "line-clamp-2"
                              }`}
                            >
                              {text}
                            </span>
                          </button>

                          {entry.photo && isOpen && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={entry.photo}
                              alt=""
                              className="mt-3 max-h-64 rounded-xl border border-[var(--ds-line)]"
                            />
                          )}

                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {(entry.tags ?? []).map((t) => (
                              <span
                                key={t}
                                className="px-2.5 py-1 rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] text-[11px]"
                              >
                                {t}
                              </span>
                            ))}
                            <span className="flex-1" />
                            <span className="text-[11px] font-semibold tracking-[0.08em] text-[var(--ds-text-muted)]">
                              {wordCount(text)} words
                            </span>
                            <button
                              onClick={() => setOpen((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                              className="text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)]"
                            >
                              {isOpen ? "Show less" : "Read entry"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right rail ── */}
        <div className="flex flex-col gap-[18px] min-w-0">
          <div className={`${CARD} p-[18px]`}>
            <div className="flex items-center gap-2.5">
              <div className={RAIL_TITLE}>
                {today.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
              <span className="flex-1" />
              <span className="text-[12.5px] text-[var(--ds-text-muted)]">
                {monthWritten} of {calendar.daysInMonth} days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-[5px] mt-3.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="text-center text-[10px] font-bold tracking-[0.06em] text-[var(--ds-text-muted)] pb-[3px]"
                >
                  {label}
                </span>
              ))}
              {calendar.cells.map((d, i) => {
                if (d === null) return <span key={`pad-${i}`} className="h-7" />;
                const key = dayKey(new Date(calendar.year, calendar.month, d));
                const has = written.has(key);
                const selected = day === key;
                const isToday = d === today.getDate();
                return (
                  <button
                    key={key}
                    onClick={() => has && setDay(selected ? null : key)}
                    className={`h-7 rounded-[7px] text-[11.5px] transition-colors ${
                      selected
                        ? "bg-[var(--ds-accent)] text-[var(--ds-on-accent)] font-bold"
                        : has
                          ? "bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] font-semibold"
                          : isToday
                            ? "border border-[var(--ds-line-strong)] text-[var(--ds-text)]"
                            : "text-[var(--ds-text-muted)] opacity-55 cursor-default"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="text-[12.5px] text-[var(--ds-text-muted)] mt-3 leading-relaxed">
              Days with an entry are filled. Pick one to jump to it.
            </p>
          </div>

          {tagCounts.length > 0 && (
            <div className={`${CARD} p-[18px]`}>
              <div className={RAIL_TITLE}>Tags</div>
              <div className="flex flex-wrap gap-[7px] mt-3">
                {tagCounts.map(([label, count]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setTag(tag === label ? null : label);
                      setFilter("All");
                      setDay(null);
                    }}
                    className={chip(tag === label)}
                  >
                    {label}
                    <span className="text-[11px] font-semibold opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${CARD} p-[18px]`}>
            <div className={RAIL_TITLE}>Your record</div>
            <div className="flex mt-3.5">
              {stats.map((s) => (
                <span key={s.label} className="flex-1">
                  <span className="block text-xl font-semibold tracking-[-0.01em]">{s.value}</span>
                  <span className="block text-[10px] font-semibold tracking-[0.09em] text-[var(--ds-text-muted)] mt-[3px] uppercase">
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex gap-2.5 mt-4 pt-[15px] border-t border-[var(--ds-line)]">
              <button onClick={() => window.print()} className={GHOST_SMALL}>
                Export as PDF
              </button>
              <button onClick={() => window.print()} className={GHOST_SMALL}>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalFeed />
    </Suspense>
  );
}
