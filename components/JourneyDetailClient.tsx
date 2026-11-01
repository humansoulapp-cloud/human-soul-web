"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleCheck,
  Clock,
  Compass,
  Layers,
  Lock,
  PenLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markPageReady, transitionTo } from "@/lib/view-transition";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { PLANS, PLUS_PERKS } from "@/lib/plans";
import type { ReflectionRow } from "@/lib/journal";
import { Button, SegmentProgress } from "@/components/ds";
import { nextDayHasOpened } from "@/lib/journey-days";

/**
 * The journey flow in focus mode, as designed on the canvas
 * («App / Journey flow / 0 · Journey overview · Focus» through
 * «4 · Journey complete»): one 1120px column under the journey's
 * header image, the day read and written on the same page.
 */

type Stage = "overview" | "day" | "done" | "complete";
/* "tomorrow": the next day, written for yesterday's step, waiting for the morning. */
type DayStatus = "done" | "today" | "tomorrow" | "locked" | "plus";
type DraftState = "idle" | "saving" | "saved";
export type JourneySuggestion = { id: string; title: string; image: string };

const CLOSING_TAG = "Closing reflection";
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** Journey entries are saved as "[Title - Day N: Day title]\n\n<text>". */
function entryBody(content: string | null) {
  const text = (content ?? "").trim();
  return text.startsWith("[") ? text.slice(text.indexOf("]") + 1).trim() : text;
}

function paragraphs(text: string | null | undefined) {
  return (text ?? "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The sentence a person is most likely to recognise: the last full one. */
function keyLine(text: string) {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*/g) ?? [];
  const last = (sentences[sentences.length - 1] ?? "").trim();
  return last.length > 180 ? `${last.slice(0, 177).trimEnd()}…` : last;
}

function firstLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function longDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function monthDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function draftKey(journeyId: string, day: number) {
  return `hs-journey-draft:${journeyId}:${day}`;
}

function readDraft(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value.trim()) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* storage can be unavailable (private mode); the draft stays in memory */
  }
}

export default function JourneyDetailClient({
  journey,
  reflections,
  subscribed,
  timeZone = null,
  initialDay,
  suggestions = [],
  returnTo,
  startEditing = false,
}: {
  journey: JourneyRow;
  reflections: ReflectionRow[];
  subscribed: boolean;
  /** The time zone saved in the profile; without one, the device's is used. */
  timeZone?: string | null;
  initialDay?: number;
  /** Opened from Journal: Exit goes back there (with the shared-text transition). */
  returnTo?: string;
  /** Open the day's written reflection straight in the editor. */
  startEditing?: boolean;
  suggestions?: JourneySuggestion[];
}) {
  const router = useRouter();
  const days = useMemo(() => [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day), [journey.journey_days]);
  const total = days.length;
  const image = journeyImage(journey);
  const timeText = journey.time_required || "About 7 minutes";

  const [entries, setEntries] = useState<ReflectionRow[]>(reflections);
  const [dayIndex, setDayIndex] = useState(() => {
    const found = days.findIndex((d) => d.day === initialDay);
    return found >= 0 ? found : 0;
  });
  const [stage, setStage] = useState<Stage>(initialDay && days.some((d) => d.day === initialDay) ? "day" : "overview");
  const [draft, setDraft] = useState("");
  const [, setDraftState] = useState<DraftState>("idle");
  /* A day already written opens in reading mode; "Edit" switches to the editor. */
  const [editing, setEditing] = useState(true);
  const editOnce = useRef(startEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedEntry, setSavedEntry] = useState<ReflectionRow | null>(null);
  const [toast, setToast] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [plan, setPlan] = useState<string>("year");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [question, setQuestion] = useState(0);
  const [closing, setClosing] = useState("");
  const [closingSaving, setClosingSaving] = useState(false);

  const locked = Boolean(journey.premium) && !subscribed;

  /* A day's reflection: tagged with the day, or saved with the day's header in its text. */
  const entryFor = useCallback(
    (index: number) => {
      const n = days[index]?.day;
      if (n == null) return null;
      const header = `[${journey.title} - Day ${n}:`;
      return (
        entries.find((r) => {
          const tags = r.tags ?? [];
          if (tags.includes(`Day ${n}`) && (tags.includes(journey.title) || (r.content ?? "").startsWith(header))) return true;
          return (r.content ?? "").trim().startsWith(header);
        }) ?? null
      );
    },
    [entries, days, journey.title]
  );

  /* Keep what the server returns after a refresh, without losing rows saved here. */
  useEffect(() => {
    setEntries((prev) => {
      const ids = new Set(reflections.map((r) => r.id));
      return [...prev.filter((r) => !ids.has(r.id)), ...reflections].sort((a, b) => b.created_at.localeCompare(a.created_at));
    });
  }, [reflections]);

  /* The clock that opens the next day each morning. It starts on the profile's
     time zone (or UTC) so the server and browser render alike, then moves to
     the device's zone and checks again every minute while the page is open. */
  const [clock, setClock] = useState<{ now: Date; zone: string | null }>(() => ({ now: new Date(), zone: timeZone ?? "UTC" }));
  useEffect(() => {
    const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tick = () => setClock({ now: new Date(), zone });
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [timeZone]);

  /** The first day without a reflection is up next; the rest wait their turn. */
  const nextIndex = useMemo(() => {
    const i = days.findIndex((_, idx) => !entryFor(idx));
    return i === -1 ? total - 1 : i;
  }, [days, entryFor, total]);

  const statusOf = useCallback(
    (index: number): DayStatus => {
      if (locked && index > 0) return "plus";
      if (entryFor(index)) return "done";
      if (index !== nextIndex) return "locked";
      const previous = index > 0 ? entryFor(index - 1) : null;
      if (previous && !nextDayHasOpened(previous.created_at, clock.zone, clock.now)) return "tomorrow";
      return "today";
    },
    [locked, entryFor, nextIndex, clock]
  );

  /* Never show a day that isn't open yet, whatever the address says. */
  useEffect(() => {
    if (stage !== "day") return;
    const st = statusOf(dayIndex);
    if (st === "locked" || st === "tomorrow" || st === "plus") {
      setStage("overview");
      if (st === "plus") setPaywallOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("day");
      window.history.replaceState(null, "", url);
    }
  }, [stage, dayIndex, statusOf]);

  const doneCount = useMemo(() => days.filter((_, i) => statusOf(i) === "done").length, [days, statusOf]);
  const allDone = total > 0 && doneCount === total;
  const closingEntry = useMemo(() => entries.find((r) => (r.tags ?? []).includes(CLOSING_TAG)) ?? null, [entries]);

  const day = days[dayIndex];
  const dayEntry = entryFor(dayIndex);
  const dayParas = useMemo(() => paragraphs(day?.prompt), [day]);
  const aboutParas = useMemo(() => paragraphs(journey.intro), [journey.intro]);
  const key = day ? draftKey(journey.id, day.day) : "";

  /* Load the text for the open day: an unsaved draft first, then what was saved. */
  useEffect(() => {
    if (stage !== "day" || !day) return;
    const stored = readDraft(key);
    setDraft(stored || (dayEntry ? entryBody(dayEntry.content) : ""));
    setDraftState(stored ? "saved" : "idle");
    setEditing(!dayEntry || Boolean(stored) || editOnce.current);
    editOnce.current = false;
    setError("");
    // When the day changes, or when its saved reflection arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dayIndex, dayEntry?.id]);

  /* Arriving from Journal: the page is on screen, let the transition capture it. */
  useEffect(() => {
    markPageReady();
  }, []);

  /* And have the way back ready, so returning morphs straight away too. */
  useEffect(() => {
    if (returnTo) router.prefetch(returnTo);
  }, [returnTo, router]);

  const exitToJournal = useCallback(() => {
    if (!returnTo) return;
    transitionTo(() => router.push(returnTo));
  }, [returnTo, router]);

  /* Saves as you write: a short pause after typing keeps the draft on this device. */
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDraftChange = (value: string) => {
    setDraft(value);
    setDraftState("saving");
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      writeDraft(key, value);
      setDraftState(value.trim() ? "saved" : "idle");
    }, 700);
  };
  useEffect(() => () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage, dayIndex]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!indexOpen && !paywallOpen && !aboutOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIndexOpen(false);
        setPaywallOpen(false);
        setAboutOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indexOpen, paywallOpen, aboutOpen]);

  const openDay = useCallback(
    (index: number) => {
      const status = statusOf(index);
      setIndexOpen(false);
      if (status === "plus") return setPaywallOpen(true);
      if (status === "locked" || status === "tomorrow") return;
      setDayIndex(index);
      setStage("day");
      const url = new URL(window.location.href);
      url.searchParams.set("day", String(days[index].day));
      window.history.replaceState(null, "", url);
    },
    [statusOf, days]
  );

  const toOverview = useCallback(() => {
    setIndexOpen(false);
    setStage("overview");
    const url = new URL(window.location.href);
    url.searchParams.delete("day");
    window.history.replaceState(null, "", url);
  }, []);

  const saveReflection = useCallback(async () => {
    if (!draft.trim() || !day) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("You need to be signed in to save this reflection.");
      return;
    }

    const content = `[${journey.title} - Day ${day.day}: ${day.title}]\n\n${draft.trim()}`;
    const result = dayEntry
      ? await supabase.from("reflections").update({ content }).eq("id", dayEntry.id).select()
      : await supabase
          .from("reflections")
          .insert([{ user_id: user.id, content, tags: [journey.title, `Day ${day.day}`], favorite: false }])
          .select();

    setSaving(false);
    const row = result.data?.[0] as ReflectionRow | undefined;
    if (result.error || !row) {
      setError(result.error?.message ?? "This reflection could not be saved. Please try again.");
      return;
    }

    writeDraft(key, "");
    setDraftState("idle");
    setEntries((prev) => [row, ...prev.filter((r) => r.id !== row.id)]);
    setSavedEntry(row);
    setToast(true);
    const finished = days.every((d, i) => i === dayIndex || Boolean(entryFor(i)));
    // Editing a written day from Journal: stay on the day, back in reading mode.
    if (returnTo && dayEntry) setEditing(false);
    else setStage(finished ? "complete" : "done");
    router.refresh();
  }, [draft, day, dayEntry, journey.title, key, days, dayIndex, entryFor, router, returnTo]);

  const questions = (journey.reflection_questions ?? []).filter(Boolean);

  const saveClosing = useCallback(async () => {
    if (!closing.trim()) return;
    setClosingSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setClosingSaving(false);
      return;
    }
    const q = questions[question];
    const content = `[${journey.title} - ${CLOSING_TAG}]\n\n${q ? `${q}\n\n` : ""}${closing.trim()}`;
    const { data } = await supabase
      .from("reflections")
      .insert([{ user_id: user.id, content, tags: [journey.title, CLOSING_TAG], favorite: false }])
      .select();
    setClosingSaving(false);
    if (data?.[0]) {
      setEntries((prev) => [data[0] as ReflectionRow, ...prev]);
      setClosing("");
      setToast(true);
      router.refresh();
    }
  }, [closing, questions, question, journey.title, router]);

  const progressBar = (
    <SegmentProgress
      total={total}
      done={doneCount}
      current={stage === "overview" ? undefined : day?.day}
      width={168}
    />
  );

  /* ── Header ─────────────────────────────────────────────────── */
  const header =
    stage === "overview" ? (
      <header className="jf-head">
        <Link className="jf-exit" href="/journeys">
          <ArrowLeft size={20} aria-hidden="true" />
          Journeys
        </Link>
        <span className="jf-head-label">Journey overview</span>
        <span />
      </header>
    ) : (
      <header className="jf-head">
        {returnTo ? (
          <button type="button" className="jf-exit" onClick={exitToJournal}>
            <ArrowLeft size={20} aria-hidden="true" />
            Journal
          </button>
        ) : (
          <button type="button" className="jf-exit" onClick={toOverview}>
            <X size={20} aria-hidden="true" />
            Exit
          </button>
        )}
        <button
          type="button"
          className="jf-index"
          aria-haspopup="dialog"
          aria-expanded={indexOpen}
          aria-label={`${journey.title} · Day ${day?.day} of ${total}. Show the ${total} days`}
          onClick={() => setIndexOpen(true)}
        >
          <span className="jf-index-title">
            <span>
              {journey.title} · Day {day?.day} of {total}
            </span>
            <ChevronDown size={14} aria-hidden="true" />
          </span>
          {progressBar}
        </button>
        <span className="jf-private">
          <Lock size={14} aria-hidden="true" />
          <span className="jf-private-label">Private</span>
        </span>
      </header>
    );

  /* ── Overview ───────────────────────────────────────────────── */
  const startIndex = allDone ? 0 : nextIndex;
  const startDay = days[startIndex];
  const started = doneCount > 0;
  const waiting = !allDone && statusOf(startIndex) === "tomorrow";
  const overviewCta = allDone
    ? { label: "See your journey", onClick: () => setStage("complete") }
    : waiting
      ? { label: `Read Day ${days[startIndex - 1]?.day ?? 1} again`, onClick: () => openDay(startIndex - 1) }
      : { label: `${started ? "Continue" : "Begin"} Day ${startDay?.day ?? 1}`, onClick: () => openDay(startIndex) };
  const overline = [journey.category, journey.featured ? "Featured" : null, journey.premium ? "Plus" : null].filter(Boolean).join(" · ");

  /* At a glance: the journey on the left, its days on a glass card on the right.
     Everything else lives in the «More about this journey» sheet. */
  const overview = (
    <main className="jf-ov">
      <section aria-labelledby="jf-title" className="jf-ov-hero">
        {overline ? <span className="text-overline jf-over">{overline}</span> : null}
        <h1 id="jf-title" className="jf-display">
          {journey.title}
        </h1>
        {journey.tagline ? <p className="jf-lede">{journey.tagline}</p> : null}
        <ul className="jf-facts" role="list" aria-label="At a glance">
          <li>
            <Layers size={16} aria-hidden="true" />
            {total} days
          </li>
          <li>
            <Clock size={16} aria-hidden="true" />
            {timeText} a day
          </li>
          <li>
            <BookOpen size={16} aria-hidden="true" />
            Saved privately in your journal
          </li>
        </ul>
        <div className="jf-actions" style={{ marginTop: 16 }}>
          <Button size="lg" onClick={overviewCta.onClick}>
            {overviewCta.label}
          </Button>
          {locked ? (
            <button type="button" className="jf-link" onClick={() => setPaywallOpen(true)}>
              Day 1 is free. Plus opens the rest
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ) : started ? (
            <span className="text-body-sm" style={{ color: "var(--muted-foreground)" }}>
              {allDone ? `All ${total} days written.` : `${doneCount} of ${total} days written. Your place is kept.`}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="jf-more"
          aria-haspopup="dialog"
          aria-expanded={aboutOpen}
          aria-controls="jf-sheet"
          onClick={() => setAboutOpen(true)}
        >
          More about this journey
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>

      <section aria-labelledby="jf-days" className="jf-glass">
        <div className="jf-glass-head">
          <h2 id="jf-days">The {NUMBER_WORDS[total] ?? total} days</h2>
          <span>
            <Lock size={14} aria-hidden="true" />
            One opens each morning
          </span>
        </div>
        <ol role="list" className="jf-gdays">
          {days.map((d, i) => {
            const status = statusOf(i);
            const open = status === "done" || status === "today";
            const mark =
              status === "done" ? <Check size={14} aria-hidden="true" /> : status === "plus" ? <Lock size={13} aria-hidden="true" /> : d.day;
            const caption =
              status === "today"
                ? started
                  ? "Up next"
                  : "First"
                : status === "tomorrow"
                  ? "Tomorrow"
                  : status === "done"
                    ? "Written"
                    : status === "plus"
                      ? "Plus"
                      : null;
            const inner = (
              <>
                <span className="jf-gnum" aria-hidden="true">
                  {mark}
                </span>
                <span className="jf-gtitle">{d.title}</span>
                {caption ? <span className="jf-gcap">{caption}</span> : <span className="hs-sr-only">Not open yet</span>}
              </>
            );
            const cls = `jf-gday${status === "today" ? " now" : ""}${status === "done" ? " done" : ""}`;
            return (
              <li key={d.day}>
                {open || status === "plus" ? (
                  <button type="button" className={cls} aria-current={status === "today" ? "step" : undefined} onClick={() => openDay(i)}>
                    {inner}
                  </button>
                ) : (
                  <div className={`${cls} later`} aria-disabled="true">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );

  /* «More about this journey»: a side sheet, so the overview stays at a glance. */
  const sheet = aboutOpen ? (
    <div className="jf-sheet-scrim" onClick={() => setAboutOpen(false)}>
      <aside
        id="jf-sheet"
        className="jf-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jf-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jf-sheet-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span className="text-overline jf-over">{journey.title}</span>
            <h2 id="jf-sheet-title" className="jf-sheet-title">
              About this journey
            </h2>
          </div>
          <Button variant="ghost" size="icon" icon={X} aria-label="Close" onClick={() => setAboutOpen(false)} />
        </div>
        <div className="jf-sheet-body">
          {journey.purpose || aboutParas.length > 0 ? (
            <section className="jf-sheet-sec" aria-labelledby={journey.purpose ? "jf-sh-why" : undefined}>
              {journey.purpose ? (
                <h3 id="jf-sh-why" className="jf-sheet-h">
                  {journey.purpose}
                </h3>
              ) : null}
              {aboutParas.map((text, i) => (
                <p key={i} className="jf-sheet-p">
                  {text}
                </p>
              ))}
            </section>
          ) : null}
          <section className="jf-sheet-sec" aria-labelledby="jf-sh-find">
            <h3 id="jf-sh-find" className="jf-sheet-h">
              What you&apos;ll find each day
            </h3>
            <div className="jf-sheet-feats">
              <div className="jf-sheet-feat">
                <span className="jf-feat-ico" aria-hidden="true">
                  <BookOpen size={20} />
                </span>
                <span>
                  <b>A short daily reading</b>
                  <span>A few calm paragraphs that frame the day&apos;s theme.</span>
                </span>
              </div>
              <div className="jf-sheet-feat">
                <span className="jf-feat-ico" aria-hidden="true">
                  <PenLine size={20} />
                </span>
                <span>
                  <b>One question to write about</b>
                  <span>A single reflection, saved privately in your journal and tagged with the journey.</span>
                </span>
              </div>
              <div className="jf-sheet-feat">
                <span className="jf-feat-ico" aria-hidden="true">
                  <Sparkles size={20} />
                </span>
                <span>
                  <b>Go deeper, if you want</b>
                  <span>An extra question for the days you want to stay a little longer.</span>
                </span>
              </div>
              <div className="jf-sheet-feat">
                <span className="jf-feat-ico" aria-hidden="true">
                  <ShieldCheck size={20} />
                </span>
                <span>
                  <b>Private, at your pace</b>
                  <span>Only you can read it. No streaks, no scores. A new day opens each morning.</span>
                </span>
              </div>
            </div>
          </section>
        </div>
        {startDay ? (
          <div className="jf-sheet-foot">
            <span className="jf-bar-text">
              <b>{allDone ? "Journey complete" : started ? "Your place is kept" : "Ready when you are"}</b>
              <span>
                Day {startDay.day} · {startDay.title} · {timeText.toLowerCase()}
              </span>
            </span>
            <Button
              onClick={() => {
                setAboutOpen(false);
                overviewCta.onClick();
              }}
            >
              {overviewCta.label}
            </Button>
          </div>
        ) : null}
      </aside>
    </div>
  ) : null;

  /* ── Day: read, then write ──────────────────────────────────── */
  const dayView = day ? (
    <main className="jf-main jf-split">
      <div className="jf-col-read">
        <div className="jf-stack">
          <span className="text-overline jf-over">
            Day {day.day} of {total}
          </span>
          <h1 id="jf-title" className="jf-h1">
            {day.title}
          </h1>
          <span className="jf-meta">
            <Clock size={16} aria-hidden="true" />
            {timeText} · read, then write
          </span>
        </div>

        {dayParas.length > 0 ? (
          <div className="jf-read">
            {dayParas.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        ) : null}

        {day.purpose ? (
          <aside aria-labelledby="jf-whyday" className="jf-why">
            <h2 id="jf-whyday" className="text-overline" style={{ margin: 0, color: "var(--muted-foreground)" }}>
              Today&apos;s intention
            </h2>
            <p>{day.purpose}</p>
          </aside>
        ) : null}
      </div>

      <section aria-labelledby="jf-write" className="jf-col-write">
        <div className="jf-write-head">
          <h2 id="jf-write" className="text-overline" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            Your reflection
          </h2>
          {/* No live save status while writing: the draft is kept quietly. */}
          {!editing && dayEntry ? (
            <span className="jf-status">
              <CircleCheck size={14} aria-hidden="true" />
              Written {shortDate(dayEntry.created_at)}
            </span>
          ) : null}
        </div>
        {!editing && dayEntry ? (
          <div className="jf-box jf-written" aria-labelledby="jf-write jf-title" role="document">
            {paragraphs(entryBody(dayEntry.content)).map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        ) : (
          <textarea
            className="jf-box"
            aria-labelledby="jf-write jf-title"
            placeholder="Start with the moment that comes to mind. A few lines are enough."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            autoFocus={Boolean(dayEntry)}
          />
        )}
        {error ? (
          <p className="jf-error" role="alert">
            {error}
          </p>
        ) : null}
        {day.deeper ? (
          <details className="jf-deeper">
            <summary>
              <Sparkles size={16} aria-hidden="true" />
              Go deeper
              <ChevronDown size={16} className="jf-chev" aria-hidden="true" />
            </summary>
            <p>{day.deeper}</p>
          </details>
        ) : null}
      </section>
    </main>
  ) : null;

  /* ── Day complete ───────────────────────────────────────────── */
  const nextDay = days[dayIndex + 1];
  const nextStatus = nextDay ? statusOf(dayIndex + 1) : null;
  const doneView = day ? (
    <main className="jf-main jf-split jf-split-center">
      <div className="jf-stack">
        <span className="jf-badge" aria-hidden="true">
          <Check size={24} />
        </span>
        <span className="text-overline jf-over">
          Day {day.day} of {total} · Complete
        </span>
        <h1 id="jf-title" className="jf-h1">
          Day {day.day} complete.
        </h1>
        <p role="status" className="jf-lede" style={{ marginTop: 4, fontSize: 20, lineHeight: "32px" }}>
          Thank you for noticing. Your reflection is saved in your journal, and only you can read it.
        </p>
        {savedEntry ? (
          <blockquote className="jf-quote" style={{ marginTop: 12 }}>
            <q>{keyLine(entryBody(savedEntry.content))}</q>
            <span className="text-body-sm" style={{ color: "var(--muted-foreground)" }}>
              {longDateTime(savedEntry.created_at)}
            </span>
          </blockquote>
        ) : null}
        <div className="jf-actions" style={{ marginTop: 16 }}>
          <Button size="lg" href="/dashboard">
            Back to Home
          </Button>
          <Link className="jf-link" href={savedEntry ? `/journal?r=${savedEntry.id}` : "/journal"}>
            Read it in Journal
          </Link>
        </div>
      </div>

      {nextDay ? (
        <section aria-labelledby="jf-next" className="jf-panel">
          <h2 id="jf-next" className="text-overline" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted-foreground)" }}>
            {nextStatus === "plus" ? <Lock size={14} aria-hidden="true" /> : <Compass size={14} aria-hidden="true" />}
            Day {nextDay.day} · {nextStatus === "plus" ? "Part of Plus" : nextStatus === "tomorrow" ? "Tomorrow" : "Up next"}
          </h2>
          <p className="jf-next-title">{nextDay.title}</p>
          {nextDay.purpose ? <p className="jf-next-text">{nextDay.purpose}</p> : null}
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
            <span className="jf-meta jf-meta-soft">
              <Clock size={16} aria-hidden="true" />
              {nextStatus === "tomorrow"
                ? "It opens tomorrow morning. Let today's reflection settle until then."
                : "Whenever you're ready. There is nothing to catch up on."}
            </span>
            {nextStatus === "tomorrow" ? null : nextStatus === "plus" ? (
              <Button variant="secondary" size="sm" icon={Lock} onClick={() => setPaywallOpen(true)}>
                Unlock Plus
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => openDay(dayIndex + 1)}>
                Begin Day {nextDay.day}
              </Button>
            )}
          </div>
        </section>
      ) : null}
    </main>
  ) : null;

  /* ── Journey complete ───────────────────────────────────────── */
  const written = days
    .map((d, i) => ({ d, entry: entryFor(i) }))
    .filter((x): x is { d: (typeof days)[number]; entry: ReflectionRow } => Boolean(x.entry));
  const dates = written.map((x) => x.entry.created_at).sort();
  const closingParas = paragraphs(journey.completion_message);
  const completeView = (
    <main className="jf-main" style={{ gap: 48 }}>
      <div className="jf-stack">
        <span className="text-overline jf-over">
          Journey complete · {total} of {total} days
        </span>
        <h1 id="jf-title" className="jf-h1">
          You&apos;ve walked all {NUMBER_WORDS[total] ?? total} days.
        </h1>
        <p className="jf-meta jf-meta-soft" style={{ margin: "4px 0 0", fontSize: 18, lineHeight: "28px" }}>
          {journey.title}
          {dates.length ? ` · ${monthDay(dates[0])} – ${monthDay(dates[dates.length - 1])}` : ""}
        </p>
      </div>

      <div className="jf-read">
        {(closingParas.length
          ? closingParas
          : [
              "You have reached the end of this journey, but not the end of the questions it explored.",
              "Some reflections may feel complete. Others may remain unfinished. That is part of being human.",
            ]
        ).map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>

      {!closingEntry ? (
        <section aria-labelledby="jf-closing" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="jf-closing" className="jf-h3">
              A closing reflection
            </h2>
            <p className="text-body-sm" style={{ margin: 0, color: "var(--muted-foreground)" }}>
              Optional. {questions.length ? "Choose one question, or none." : "Write whatever stays with you."}
            </p>
          </div>
          {questions.length ? (
            <div role="radiogroup" aria-label="Closing question" className="jf-chips">
              {questions.map((q, i) => (
                <button key={i} type="button" role="radio" className="jf-chip" aria-checked={question === i} onClick={() => setQuestion(i)}>
                  {question === i ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                  <span>{q}</span>
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            className="jf-box"
            aria-label="Your closing reflection"
            placeholder="Write as much or as little as you like."
            value={closing}
            onChange={(e) => setClosing(e.target.value)}
            style={{ marginTop: 4, minHeight: 180 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
            <Link className="jf-link" href="/dashboard">
              Skip for now
            </Link>
            <Button onClick={saveClosing} loading={closingSaving} disabled={!closing.trim()}>
              {closingSaving ? "Saving…" : "Save closing reflection"}
            </Button>
          </div>
        </section>
      ) : (
        <blockquote className="jf-quote">
          <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
            Your closing reflection
          </span>
          <q>{keyLine(entryBody(closingEntry.content))}</q>
        </blockquote>
      )}

      {written.length ? (
        <section aria-labelledby="jf-look" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 8 }}>
            <h2 id="jf-look" className="text-overline" style={{ margin: 0, color: "var(--muted-foreground)" }}>
              Your {NUMBER_WORDS[written.length] ?? written.length} reflections
            </h2>
            <Link className="jf-link" href="/journal">
              Read all
            </Link>
          </div>
          <ol role="list" className="jf-look">
            {written.map(({ d, entry }) => (
              <li key={d.day}>
                <span className="jf-num" aria-hidden="true">
                  {String(d.day).padStart(2, "0")}
                </span>
                <Link href={`/journal?r=${entry.id}`} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, color: "inherit", textDecoration: "none" }}>
                  <span className="jf-look-title">{d.title}</span>
                  <span className="jf-look-text">{firstLine(entryBody(entry.content))}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="jf-nextj" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="jf-nextj" className="text-overline" style={{ margin: "0 0 4px", color: "var(--muted-foreground)" }}>
          When you&apos;re ready
        </h2>
        {suggestions.length ? (
          <div className="jf-nexts">
            {suggestions.map((s) => (
              <Link key={s.id} className="jf-next" href={`/journeys/${s.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" />
                <span>{s.title}</span>
              </Link>
            ))}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 8 }}>
          <Link className="jf-link" href="/journeys">
            Explore all journeys
          </Link>
          <Button variant="secondary" href="/dashboard">
            Back to Home
          </Button>
        </div>
      </section>
    </main>
  );

  /* ── Bottom bar ─────────────────────────────────────────────── */
  const bar =
    stage === "day" && day ? (
      <div className="jf-bar">
        <div className="jf-bar-in">
          <span style={{ flex: 1 }} />
          {!editing && dayEntry ? (
            <>
              <Button variant="secondary" icon={PenLine} onClick={() => setEditing(true)} full={false}>
                Edit
              </Button>
              {!returnTo && days[dayIndex + 1] && (statusOf(dayIndex + 1) === "today" || statusOf(dayIndex + 1) === "done") ? (
                <Button onClick={() => openDay(dayIndex + 1)} full={false}>
                  Day {days[dayIndex + 1].day}
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
              ) : returnTo ? (
                <Button onClick={exitToJournal} full={false}>
                  Back to Journal
                </Button>
              ) : (
                <Button onClick={toOverview} full={false}>
                  Journey overview
                </Button>
              )}
            </>
          ) : (
            <>
              {dayEntry ? (
                <button
                  type="button"
                  className="jf-link"
                  onClick={() => {
                    writeDraft(key, "");
                    setDraft(entryBody(dayEntry.content));
                    setDraftState("idle");
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              ) : null}
              <Button onClick={saveReflection} loading={saving} disabled={!draft.trim()} full={false}>
                {saving ? "Saving…" : dayEntry ? `Update Day ${day.day}` : `Save Day ${day.day}`}
              </Button>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className={`jf jf-stage-${stage}${stage === "overview" ? " jf-overview" : " jf-day"}`}>
      <div className="jf-hero" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" />
      </div>

      {header}
      {stage === "overview" && overview}
      {stage === "overview" && sheet}
      {stage === "day" && dayView}
      {stage === "done" && doneView}
      {stage === "complete" && completeView}
      {bar}

      {toast ? (
        <div className="jf-toast" role="status" aria-live="polite">
          <span className="jf-toast-ic" aria-hidden="true">
            <Check size={16} />
          </span>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ font: "600 14px/20px var(--hs-font-sans)" }}>Saved to your journal</span>
            <span className="text-caption" style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>
              {journey.title}
              {stage === "complete" && closingEntry ? ` · ${CLOSING_TAG}` : day ? ` · Day ${day.day}` : ""}
            </span>
          </span>
        </div>
      ) : null}

      {/* ── The days, from the header ── */}
      {indexOpen ? (
        <div className="jf-scrim" onClick={() => setIndexOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="fi-title" className="jf-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
                  The {NUMBER_WORDS[total] ?? total} days
                </span>
                <h2 id="fi-title" style={{ margin: 0, font: "600 22px/28px var(--jf-sans)", letterSpacing: "-0.01em" }}>
                  {journey.title}
                </h2>
              </div>
              <Button variant="ghost" size="icon" icon={X} aria-label="Close" onClick={() => setIndexOpen(false)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1, display: "flex" }}>
                <SegmentProgress total={total} done={doneCount} current={day?.day} width="100%" />
              </span>
              <span className="text-caption" style={{ fontWeight: 400, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                {doneCount} of {total} written
              </span>
            </div>
            <ol role="list" className="jf-days" style={{ margin: "0 -12px" }}>
              {days.map((d, i) => {
                const status = statusOf(i);
                const here = i === dayIndex && stage === "day";
                const entry = entryFor(i);
                const sub =
                  status === "done"
                    ? `Day ${d.day} · Written ${entry ? shortDate(entry.created_at) : ""}${here ? " · You are here" : " · Read again"}`
                    : status === "today"
                      ? `Day ${d.day} · Today${here ? " · You are here" : ""}`
                      : status === "tomorrow"
                        ? `Day ${d.day} · Opens tomorrow morning`
                        : status === "plus"
                        ? `Day ${d.day} · Included with Plus`
                        : `Day ${d.day} · After Day ${d.day - 1}`;
                const step = (
                  <span className={`jf-step${status === "done" ? " jf-step-done" : status === "today" ? " jf-step-now" : ""}`} aria-hidden="true">
                    {status === "done" ? <Check size={14} /> : status === "today" ? d.day : <Lock size={14} />}
                  </span>
                );
                const text = (
                  <span style={{ minWidth: 0 }}>
                    <span className="jf-daytitle">{d.title}</span>
                    <span className="jf-daytext">{sub}</span>
                  </span>
                );
                return (
                  <li key={d.day}>
                    {status === "locked" || status === "tomorrow" ? (
                      <div className="jf-dayrow" aria-disabled="true">
                        {step}
                        {text}
                      </div>
                    ) : (
                      <button type="button" className="jf-dayrow" aria-current={here ? "step" : undefined} onClick={() => openDay(i)}>
                        {step}
                        {text}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="jf-dialog-foot">
              <span className="text-caption" style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>
                A new day opens each morning.
              </span>
              <button type="button" className="jf-link" onClick={toOverview}>
                Journey overview
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Plus ── */}
      {paywallOpen ? (
        <div className="jf-scrim" onClick={() => setPaywallOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="pw-title" className="jf-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="text-overline" style={{ color: "var(--primary)" }}>
                HumanSoul Plus
              </span>
              <h2 id="pw-title" className="text-h3" style={{ margin: 0 }}>
                Every journey, always open
              </h2>
              <p className="text-body-sm" style={{ margin: 0, color: "var(--muted-foreground)" }}>
                Day one is open to everyone. Plus unlocks the remaining {Math.max(total - 1, 0)} days, every other journey and your full journal history.
              </p>
            </div>
            <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {PLUS_PERKS.map((text) => (
                <li key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", font: "400 14px/20px var(--hs-font-sans)" }}>
                  <CircleCheck size={18} aria-hidden="true" style={{ flex: "none", color: "var(--primary)" }} />
                  {text}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 10 }}>
              {PLANS.map((p) => (
                <button key={p.key} type="button" className="jf-plan" aria-pressed={plan === p.key} onClick={() => setPlan(p.key)}>
                  <span style={{ display: "block", font: "600 11px/16px var(--hs-font-sans)", letterSpacing: ".08em", opacity: 0.75 }}>{p.label}</span>
                  <span style={{ display: "block", font: "600 22px/28px var(--hs-font-sans)", marginTop: 4 }}>{p.price}</span>
                  <span style={{ display: "block", font: "400 12px/16px var(--hs-font-sans)", opacity: 0.75 }}>{p.note}</span>
                </button>
              ))}
            </div>
            <Button full href="/subscription">
              Start Plus
            </Button>
            <Button variant="ghost" full onClick={() => setPaywallOpen(false)}>
              Not now
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
