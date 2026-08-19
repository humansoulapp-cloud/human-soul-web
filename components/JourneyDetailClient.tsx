"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { PLANS, PLUS_PERKS } from "@/lib/plans";
import { wordCount, type ReflectionRow } from "@/lib/journal";

type Stage = "overview" | "read" | "write" | "done";
type DayStatus = "done" | "today" | "locked" | "plus";

const PRIMARY_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60";
const GHOST_BTN =
  "px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px] whitespace-nowrap transition-colors";
const GOLD_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-gold)] hover:opacity-90 text-[var(--ds-on-gold)] hover:text-[var(--ds-on-gold)] text-[13px] font-semibold whitespace-nowrap transition-opacity";
const EYEBROW = "text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)] uppercase";
const MICRO = "text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]";

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

export default function JourneyDetailClient({
  journey,
  reflections,
  subscribed,
  initialDay,
}: {
  journey: JourneyRow;
  reflections: ReflectionRow[];
  subscribed: boolean;
  initialDay?: number;
}) {
  const router = useRouter();
  const days = useMemo(
    () => [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day),
    [journey.journey_days]
  );

  const [entries, setEntries] = useState<ReflectionRow[]>(reflections);
  const [stage, setStage] = useState<Stage>(initialDay ? "read" : "overview");
  const [dayIndex, setDayIndex] = useState(() => {
    const found = days.findIndex((d) => d.day === initialDay);
    return found >= 0 ? found : 0;
  });
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [plan, setPlan] = useState<string>("year");

  const locked = Boolean(journey.premium) && !subscribed;

  const entryFor = useCallback(
    (index: number) =>
      entries.find((r) => (r.tags ?? []).includes(`Day ${days[index]?.day}`)) ?? null,
    [entries, days]
  );

  /** The first day without a reflection is "today"; the rest wait their turn. */
  const nextIndex = useMemo(() => {
    const i = days.findIndex((_, idx) => !entryFor(idx));
    return i === -1 ? days.length - 1 : i;
  }, [days, entryFor]);

  const statusOf = useCallback(
    (index: number): DayStatus => {
      if (locked && index > 0) return "plus";
      if (entryFor(index)) return "done";
      return index === nextIndex ? "today" : "locked";
    },
    [locked, entryFor, nextIndex]
  );

  const doneCount = useMemo(
    () => days.filter((_, i) => statusOf(i) === "done").length,
    [days, statusOf]
  );

  const day = days[dayIndex];
  const dayEntry = entryFor(dayIndex);
  const dayParas = useMemo(() => paragraphs(day?.prompt), [day]);
  const aboutParas = useMemo(
    () => paragraphs(journey.intro || journey.purpose),
    [journey.intro, journey.purpose]
  );

  const openDay = useCallback(
    (index: number) => {
      const status = statusOf(index);
      if (status === "plus") return setPaywallOpen(true);
      if (status === "locked") return;
      setDayIndex(index);
      setStage("read");
      setError("");
    },
    [statusOf]
  );

  const saveReflection = useCallback(async () => {
    if (!draft.trim() || !day) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("You must be signed in to save this reflection.");
      return;
    }

    const content = `[${journey.title} - Day ${day.day}: ${day.title}]\n\n${draft.trim()}`;
    const { data, error: insertError } = await supabase
      .from("reflections")
      .insert([
        {
          user_id: user.id,
          content,
          tags: [journey.title, `Day ${day.day}`],
          favorite: false,
        },
      ])
      .select();

    setSaving(false);
    if (insertError || !data?.[0]) {
      setError(insertError?.message ?? "Could not save this reflection.");
      return;
    }

    setEntries((prev) => [data[0] as ReflectionRow, ...prev]);
    setDraft("");
    setStage("done");
    router.refresh();
  }, [draft, day, journey.title, router]);

  const metaRows = [
    ["Category", journey.category ?? "—"],
    ["Length", `${days.length} days, one a day`],
    ["Each day", journey.time_required || "About 7 minutes"],
    ["Access", journey.premium ? "HumanSoul Plus" : "Free"],
  ];

  const isLastDay = dayIndex === days.length - 1;
  const nextBlocked = !isLastDay && statusOf(dayIndex + 1) === "plus";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Focus header ── */}
      <header className="sticky top-0 z-10 flex items-center gap-3.5 px-4 md:px-6 py-3 border-b border-[var(--ds-line)] bg-[var(--ds-bg)]">
        <Link
          href="/journeys"
          className="flex items-center gap-[7px] pl-2.5 pr-3 py-[7px] rounded-lg border border-[var(--ds-line)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] text-[12.5px] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Leave journey</span>
        </Link>
        <span className="flex-1" />
        <div className="text-[15px] font-semibold whitespace-nowrap truncate">{journey.title}</div>
        <span className="flex-1" />
        <div className="hidden sm:flex items-center gap-3">
          <span className={MICRO}>
            {doneCount}/{days.length}
          </span>
          <span className="flex gap-[3px] w-[118px]">
            {days.map((d, i) => {
              const status = statusOf(i);
              const current = stage !== "overview" && i === dayIndex;
              return (
                <button
                  key={d.day}
                  onClick={() => openDay(i)}
                  aria-label={`Day ${d.day}`}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    status === "done"
                      ? "bg-[var(--ds-accent)]"
                      : current
                        ? "bg-[var(--ds-accent-soft)] ring-1 ring-[var(--ds-accent)]"
                        : "bg-[var(--ds-line-strong)]"
                  }`}
                />
              );
            })}
          </span>
        </div>
      </header>

      {/* ══ OVERVIEW ══ */}
      {stage === "overview" && (
        <div>
          <div className="relative h-[250px] overflow-hidden">
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            <div className="absolute left-0 right-0 bottom-0 pb-[26px]">
              <div className="w-[min(1160px,100%-36px)] md:w-[min(1160px,100%-48px)] mx-auto text-white">
                <div className="flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.11em] flex-wrap">
                  <span className="opacity-85 uppercase">{journey.category}</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-white/50" />
                  <span className="opacity-85 uppercase">
                    {days.length} DAYS · {journey.time_required || "~7 MIN A DAY"}
                  </span>
                  {journey.premium && (
                    <span className="px-2 py-1 rounded-full bg-[var(--ds-gold)] text-[var(--ds-on-gold)] text-[9.5px] tracking-[0.1em]">
                      PLUS
                    </span>
                  )}
                </div>
                <h1 className="text-[30px] md:text-[40px] font-semibold tracking-[-0.015em] mt-2">
                  {journey.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="w-[min(1160px,100%-36px)] md:w-[min(1160px,100%-48px)] mx-auto pt-[30px] pb-20 grid lg:grid-cols-[minmax(0,1fr)_344px] gap-8 lg:gap-[52px] items-start">
            {/* Rail */}
            <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 flex flex-col gap-3.5">
              {locked ? (
                <div className="p-5 rounded-2xl border border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]">
                  <div className="text-[10px] font-bold tracking-[0.13em] text-[var(--ds-gold)]">
                    HUMANSOUL PLUS
                  </div>
                  <div className="text-2xl font-semibold leading-[1.25] mt-2 mb-1.5">
                    This journey is part of Plus
                  </div>
                  <p className="text-sm leading-[1.65] opacity-80 mb-4">
                    Day one is open to everyone. Plus unlocks the remaining{" "}
                    {Math.max(days.length - 1, 0)} days, every other journey in the library, and
                    your full journal history.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setPaywallOpen(true)} className={GOLD_BTN}>
                      Unlock for {PLANS[0].price} / month
                    </button>
                    <button onClick={() => openDay(0)} className={GHOST_BTN}>
                      Read day 1 free
                    </button>
                  </div>
                  <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-3">
                    Cancel anytime. Yearly {PLANS[1].price}.
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
                  <div className="flex-1 min-w-0">
                    <div className={MICRO}>
                      {doneCount === 0
                        ? "NOT STARTED YET"
                        : `YOU ARE ON DAY ${days[nextIndex]?.day} OF ${days.length}`}
                    </div>
                    <div className="text-[19px] font-semibold mt-1 truncate">
                      {days[nextIndex]?.title}
                    </div>
                  </div>
                  <button onClick={() => openDay(nextIndex)} className={PRIMARY_BTN}>
                    {doneCount === 0 ? "Begin day 1" : "Open today"}
                  </button>
                </div>
              )}

              <div className="px-4 py-1 rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
                {metaRows.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-baseline justify-between gap-3.5 py-3 text-[13px] text-right ${
                      i < metaRows.length - 1 ? "border-b border-[var(--ds-line)]" : ""
                    }`}
                  >
                    <span className={`${EYEBROW} text-left flex-shrink-0`}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="lg:col-start-1 lg:row-start-1 min-w-0 lg:pt-[19px]">
              <p className="text-[17px] leading-[1.6] opacity-90 m-0 mb-[26px]">{journey.tagline}</p>

              {aboutParas.length > 0 && (
                <div className="relative mt-[30px]">
                  <div className={EYEBROW}>ABOUT THIS JOURNEY</div>
                  <div
                    className={`text-[15px] leading-[1.75] text-[var(--ds-text-mid)] mt-2 overflow-hidden ${
                      aboutOpen ? "" : "max-h-[150px]"
                    }`}
                  >
                    {aboutParas.map((text, i) => (
                      <p key={i} className="m-0 mb-[15px]">
                        {text}
                      </p>
                    ))}
                  </div>
                  {!aboutOpen && (
                    <div className="h-11 -mt-11 relative bg-gradient-to-t from-[var(--ds-bg)] to-transparent" />
                  )}
                  <button
                    onClick={() => setAboutOpen((v) => !v)}
                    className="mt-2 text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)]"
                  >
                    {aboutOpen ? "Show less" : "Read more"}
                  </button>
                </div>
              )}

              <div className="flex items-baseline gap-2.5 mt-[34px] mb-1.5">
                <div className={EYEBROW}>THE {days.length} DAYS</div>
                <span className="flex-1" />
                <span className={MICRO}>
                  {doneCount} OF {days.length} DONE
                </span>
              </div>

              <div className="flex flex-col">
                {days.map((d, i) => {
                  const status = statusOf(i);
                  const blocked = status === "locked" || status === "plus";
                  return (
                    <button
                      key={d.day}
                      onClick={() => openDay(i)}
                      className={`flex items-center gap-[15px] w-full px-1 py-[15px] border-b border-[var(--ds-line)] text-left text-[var(--ds-text)] ${
                        blocked ? "opacity-60 cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center text-xs font-semibold ${
                          status === "done"
                            ? "bg-[var(--ds-accent)] text-[var(--ds-on-accent)]"
                            : status === "today"
                              ? "bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] border border-[var(--ds-accent)]"
                              : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)]"
                        }`}
                      >
                        {status === "done" ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                        ) : status === "plus" ? (
                          <Lock className="w-3 h-3" strokeWidth={2.2} />
                        ) : (
                          d.day
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold">{d.title}</span>
                          {status === "today" && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[9.5px] font-bold tracking-[0.1em]">
                              TODAY
                            </span>
                          )}
                        </span>
                        <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-1 truncate">
                          {status === "done"
                            ? "Reflection saved"
                            : status === "plus"
                              ? "Included with Plus"
                              : status === "today"
                                ? (d.purpose ?? "").slice(0, 72) + "…"
                                : `Opens after day ${d.day - 1}`}
                        </span>
                      </span>
                      {!blocked && (
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-[var(--ds-text-muted)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DAY — READ ══ */}
      {stage === "read" && day && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="w-[min(1160px,100%-36px)] md:w-[min(1160px,100%-48px)] mx-auto pt-11 pb-10 grid lg:grid-cols-[minmax(0,1fr)_344px] gap-8 lg:gap-[52px] items-start">
              <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 flex flex-col gap-3.5">
                {day.deeper && (
                  <div className="p-[18px] rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
                    <div className={EYEBROW}>IF YOU WANT TO GO DEEPER</div>
                    <div className="text-[17px] font-medium leading-[1.5] mt-2">{day.deeper}</div>
                  </div>
                )}

                {locked && dayIndex === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">
                        Day 1 of {days.length} · free preview
                      </div>
                      <div className="text-[12.5px] text-[var(--ds-text-muted)]">
                        Unlock Plus to continue with the remaining days.
                      </div>
                    </div>
                    <button onClick={() => setPaywallOpen(true)} className={GOLD_BTN}>
                      Unlock Plus
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-start-1 lg:row-start-1 min-w-0">
                <div className={EYEBROW}>
                  DAY {day.day} OF {days.length}
                </div>
                <h1 className="text-[28px] md:text-[35px] font-semibold leading-[1.15] tracking-[-0.015em] mt-2.5 mb-3.5">
                  {day.title}
                </h1>
                {day.purpose && (
                  <p className="text-[15px] leading-[1.7] text-[var(--ds-text-mid)] m-0 mb-6 pb-6 border-b border-[var(--ds-line)]">
                    {day.purpose}
                  </p>
                )}

                <div className="text-[17px] leading-[1.75]">
                  {dayParas.map((text, i) => (
                    <p key={i} className="m-0 mb-[19px]">
                      {text}
                    </p>
                  ))}
                </div>

                {dayEntry && (
                  <div className="mt-6 p-[18px] rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
                    <div className="flex items-center gap-2">
                      <span className={EYEBROW}>YOUR REFLECTION</span>
                      <span className="flex-1" />
                      <span className={MICRO}>
                        {new Date(dayEntry.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-[15px] leading-[1.7] opacity-85 mt-2.5 whitespace-pre-line">
                      {entryBody(dayEntry.content)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 px-4 md:px-6 py-3.5 border-t border-[var(--ds-line)] bg-[var(--ds-bg)]">
            <div className="w-[min(1160px,100%-8px)] mx-auto flex items-center gap-3.5 flex-wrap">
              <button
                onClick={() => {
                  setDraft(dayEntry ? entryBody(dayEntry.content) : "");
                  setStage("write");
                }}
                className={`${PRIMARY_BTN} px-6 py-3`}
              >
                {dayEntry ? "Write again" : "Write today's reflection"}
              </button>
              <span className="text-[12.5px] text-[var(--ds-text-muted)]">
                {dayEntry ? "You already wrote for this day." : "About 5 minutes"}
              </span>
              <span className="flex-1" />
              {isLastDay ? (
                <button onClick={() => setStage("overview")} className={GHOST_BTN}>
                  Back to journey
                </button>
              ) : (
                <button
                  onClick={() => (nextBlocked ? setPaywallOpen(true) : openDay(dayIndex + 1))}
                  className={GHOST_BTN}
                >
                  Next day →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DAY — WRITE ══ */}
      {stage === "write" && day && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="w-[min(720px,100%-36px)] md:w-[min(720px,100%-48px)] mx-auto pt-[34px] pb-5">
              <button
                onClick={() => setPromptOpen((v) => !v)}
                className="flex items-center gap-2 text-[12.5px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] transition-colors"
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${promptOpen ? "rotate-90" : ""}`}
                  strokeWidth={2.4}
                />
                {promptOpen ? "Hide the prompt" : "Show the prompt"}
              </button>

              {promptOpen && (
                <div className="mt-3 p-4 rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
                  <p className="text-[14.5px] leading-[1.7] opacity-80 m-0">{dayParas[0]}</p>
                  {day.deeper && (
                    <p className="text-base font-medium leading-[1.55] mt-3 mb-0">{day.deeper}</p>
                  )}
                </div>
              )}

              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Begin here…"
                className="w-full min-h-[50vh] mt-5 bg-transparent border-none text-[17px] leading-[1.8] text-[var(--ds-text)] resize-none"
              />
              {error && <p className="text-[12.5px] text-[var(--ds-danger)]">{error}</p>}
            </div>
          </div>

          <div className="sticky bottom-0 px-4 md:px-6 py-3.5 border-t border-[var(--ds-line)] bg-[var(--ds-bg)]">
            <div className="w-[min(720px,100%-8px)] mx-auto flex items-center gap-2.5 flex-wrap">
              <span className={MICRO}>{wordCount(draft)} WORDS</span>
              <span className="flex-1" />
              <button onClick={() => setStage("read")} className={GHOST_BTN}>
                Back to prompt
              </button>
              <button onClick={saveReflection} disabled={saving || !draft.trim()} className={PRIMARY_BTN}>
                {saving ? "Saving…" : "Save reflection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DAY — DONE ══ */}
      {stage === "done" && day && (
        <div className="flex-1 grid place-items-center p-10">
          <div className="max-w-[520px] text-center">
            <span className="w-14 h-14 mx-auto rounded-full grid place-items-center bg-[var(--ds-accent)] text-[var(--ds-on-accent)]">
              <Check className="w-[22px] h-[22px]" strokeWidth={2.2} />
            </span>
            <h1 className="text-[30px] font-semibold leading-[1.2] mt-5 mb-2.5">
              Day {day.day} is written
            </h1>
            <p className="text-[15px] leading-[1.7] opacity-80 max-w-[44ch] mx-auto mb-[26px]">
              {isLastDay
                ? "That is the last day of this journey. What you wrote stays in your journal."
                : "Tomorrow's day is waiting whenever you are. What you wrote stays in your journal."}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setStage("overview")} className={PRIMARY_BTN}>
                Back to journey
              </button>
              <button onClick={() => setStage("read")} className={GHOST_BTN}>
                See my reflection
              </button>
            </div>

            {locked && (
              <div className="flex items-center gap-3 text-left mt-7 p-4 rounded-2xl border border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]">
                <div className="flex-1">
                  <div className="text-sm font-semibold">Day {day.day + 1} is part of Plus</div>
                  <div className="text-[12.5px] text-[var(--ds-text-muted)]">
                    Unlock the remaining days and the full library.
                  </div>
                </div>
                <button onClick={() => setPaywallOpen(true)} className={GOLD_BTN}>
                  Unlock
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PAYWALL SHEET ══ */}
      {paywallOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center p-8 bg-black/55">
          <div className="w-[min(480px,100%)] rounded-[18px] border border-[var(--ds-line)] bg-[var(--ds-surface)] p-[26px] pb-5">
            <div className="text-[10px] font-bold tracking-[0.13em] text-[var(--ds-gold)]">
              HUMANSOUL PLUS
            </div>
            <h2 className="text-[27px] font-semibold leading-[1.2] mt-2.5 mb-2">
              Every journey, always open
            </h2>
            <p className="text-sm leading-[1.65] opacity-80 m-0 mb-[18px]">
              Guided journeys, new ones each month, and your complete journal history kept for you.
            </p>

            <div className="flex flex-col gap-2.5 mb-5">
              {PLUS_PERKS.map((text) => (
                <div
                  key={text}
                  className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-[var(--ds-text-mid)]"
                >
                  <span className="text-[var(--ds-gold)] font-bold flex-shrink-0">✓</span>
                  {text}
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 mb-3.5">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`flex-1 text-left px-4 py-3.5 rounded-xl border transition-colors ${
                    plan === p.key
                      ? "border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]"
                      : "border-[var(--ds-line-strong)]"
                  }`}
                >
                  <span className="block text-[11px] font-semibold tracking-[0.08em] opacity-70">
                    {p.label}
                  </span>
                  <span className="block text-[22px] font-semibold mt-1">{p.price}</span>
                  <span className="block text-[11.5px] opacity-70 mt-0.5">{p.note}</span>
                </button>
              ))}
            </div>

            <Link href="/subscription" className={`${GOLD_BTN} block w-full text-center py-3.5`}>
              Start Plus
            </Link>
            <button
              onClick={() => setPaywallOpen(false)}
              className="w-full mt-2 p-2.5 text-[12.5px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
