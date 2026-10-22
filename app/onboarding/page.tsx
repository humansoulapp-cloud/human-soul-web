"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Mail,
  Moon,
  Sparkles,
  Sun,
  Sunset,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { journeyImage } from "@/lib/journey-images";
import type { Journey } from "@/lib/journal";
import { PLANS, YEARLY_SAVING } from "@/lib/plans";
import { Logo } from "@/components/ds";
import "./onboarding.css";

/* ── What brings you here ─────────────────────────────────────── */
const INTENTS = [
  { key: "slow", title: "Slow down", sub: "A few quiet minutes in a busy day", chip: "Slow down", words: ["calm", "presence", "present", "slow", "rest", "still", "awareness", "attention", "foundations"] },
  { key: "self", title: "Understand myself better", sub: "Notice patterns in how I think and feel", chip: "Understand myself", words: ["identity", "self", "pattern", "inner", "discovery", "awareness", "emotion", "foundations"] },
  { key: "grateful", title: "Feel more grateful", sub: "Keep track of the good things", chip: "Feel more grateful", words: ["gratitude", "grateful", "kindness", "joy", "appreciation", "wonder"] },
  { key: "hard", title: "Get through a hard time", sub: "Put what I'm carrying into words", chip: "A hard time", words: ["uncertainty", "grief", "loneliness", "loss", "fear", "courage", "heavy", "pain", "emotion"] },
  { key: "habit", title: "Build a writing habit", sub: "Write a little, most days", chip: "A writing habit", words: ["foundations", "practice", "daily", "habit", "beginning"] },
  { key: "curious", title: "Just curious", sub: "Show me what this is", chip: "", words: [] },
] as const;
type IntentKey = (typeof INTENTS)[number]["key"];

const MOMENTS = [
  { key: "morning", label: "Morning", sub: "Before the day starts", icon: Sun, hour: "07:00" },
  { key: "midday", label: "Midday", sub: "A pause in the middle", icon: Sunset, hour: "13:00" },
  { key: "evening", label: "Evening", sub: "To close the day", icon: Moon, hour: "21:00" },
] as const;
type MomentKey = (typeof MOMENTS)[number]["key"];

const MINUTES = [5, 10, 20];
const HOURS = ["07:00", "13:00", "19:00", "21:00"];
const STEPS = 4;

function clock(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return new Date(2000, 0, 1, hh, mm).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function isVisible(j: Journey) {
  const status = j.status || "published";
  if (status === "published") return true;
  return status === "scheduled" && !!j.scheduled_publish_at && new Date(j.scheduled_publish_at) <= new Date();
}

/** Which of the chosen intents a journey speaks to, from its category, title and tagline. */
function fits(j: Journey, intents: IntentKey[]) {
  const text = `${j.category ?? ""} ${j.title} ${j.tagline ?? ""}`.toLowerCase();
  return INTENTS.filter((i) => intents.includes(i.key) && i.words.some((w) => text.includes(w)));
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const [intents, setIntents] = useState<IntentKey[]>([]);
  const [moment, setMoment] = useState<MomentKey>("evening");
  const [minutes, setMinutes] = useState(10);
  const [remind, setRemind] = useState(true);
  const [hour, setHour] = useState("21:00");
  const [pickId, setPickId] = useState<string | null>(null);
  const [plan, setPlan] = useState<"year" | "month">("year");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setName((user.user_metadata?.display_name || "").trim().split(/\s+/)[0] || "");
        const { data: profile } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
        setPrefs(((profile?.preferences as Record<string, unknown>) ?? {}) || {});
      }
      const { data } = await supabase.from("journeys").select("*, journey_days(day)").order("created_at", { ascending: true });
      setJourneys(((data ?? []) as Journey[]).filter(isVisible));
    }
    load();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, done]);

  /* Ranked by how well they fit; free journeys and featured ones first, since every day of a free journey is open. */
  const ranked = useMemo(() => {
    return journeys
      .map((j, i) => ({
        j,
        score: fits(j, intents).length * 2 + (j.premium ? 0 : 1.5) + (j.featured ? 0.5 : 0) - i * 0.001,
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.j);
  }, [journeys, intents]);

  const recommended = ranked[0];
  const chosen = journeys.find((j) => j.id === pickId) ?? recommended;
  const others = ranked.filter((j) => j.id !== chosen?.id).slice(0, 2);
  const chosenFits = chosen ? fits(chosen, intents).filter((i) => i.chip) : [];
  const days = chosen ? (chosen.journey_days ?? []).length || 7 : 7;

  const toggleIntent = (k: IntentKey) =>
    setIntents((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));

  const pickMoment = (k: MomentKey) => {
    setMoment(k);
    setHour(MOMENTS.find((m) => m.key === k)!.hour);
  };

  const save = async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        reminder_hour: remind ? hour : null,
        preferences: {
          ...prefs,
          onboarded: true,
          onboarding: { intents, moment, minutes, journey: chosen?.id ?? null, plan_interest: plan },
        },
      })
      .eq("user_id", userId);
  };

  const finishPlan = async () => {
    setSaving(true);
    await save();
    try {
      localStorage.setItem("onboarding_done", "true");
    } catch {}
    setSaving(false);
    setDone(true);
  };

  const skipAll = async () => {
    await save();
    try {
      localStorage.setItem("onboarding_done", "true");
    } catch {}
    router.push("/dashboard");
  };

  const back = () => (done ? setDone(false) : setStep((s) => Math.max(0, s - 1)));
  const shown = done ? STEPS : step + 1;
  const year = PLANS.find((p) => p.key === "year")!;
  const month = PLANS.find((p) => p.key === "month")!;
  const dayHref = chosen ? `/journeys/${chosen.id}?day=1` : "/journeys";

  return (
    <div className="ob">
      <header className="ob-bar">
        <div className="ob-in">
          <Link className="ob-logo" href="/dashboard" aria-label="HumanSoul home">
            <Logo size={22} />
          </Link>
          <div className="ob-step">
            <span>{done ? "All set" : `Step ${shown} of ${STEPS}`}</span>
            <div className="ob-prog" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={shown}>
              {Array.from({ length: STEPS }, (_, i) => (
                <span key={i} className={i < shown ? "on" : ""} />
              ))}
            </div>
          </div>
          <div className="ob-right">
            {done ? null : step === 0 ? (
              <button type="button" className="ob-btn ob-ghost" onClick={skipAll}>
                Skip
              </button>
            ) : (
              <button type="button" className="ob-btn ob-ghost" onClick={back} aria-label="Back">
                <ArrowLeft className="ai" size={16} aria-hidden="true" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!done && step === 0 && (
        <main className="ob-main" key="s0">
          <span className="ob-over">{name ? `Welcome, ${name}` : "Welcome"}</span>
          <h1 className="ob-h">What brings you to HumanSoul?</h1>
          <p className="ob-p">Choose as many as you like. We use this to suggest your first journey, nothing else.</p>
          <ul className="ob-ch">
            {INTENTS.map((i) => {
              const on = intents.includes(i.key);
              return (
                <li key={i.key}>
                  <button type="button" aria-pressed={on} onClick={() => toggleIntent(i.key)}>
                    <span>
                      {i.title}
                      <small>{i.sub}</small>
                    </span>
                    <span className="ob-ck" aria-hidden="true">
                      <Check size={16} strokeWidth={2.5} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="ob-foot">
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" onClick={() => setStep(1)}>
              Continue
              <ArrowRight className="ai" size={16} aria-hidden="true" />
            </button>
            <span className="ob-note" aria-live="polite">
              {intents.length ? `${intents.length} selected` : "You can also skip this"}
            </span>
          </div>
        </main>
      )}

      {!done && step === 1 && (
        <main className="ob-main" key="s1">
          <span className="ob-over">Your rhythm</span>
          <h1 className="ob-h">When would you like to write?</h1>
          <p className="ob-p">Most people keep going when writing has its own moment in the day. You can change this any time in Profile.</p>
          <div className="ob-rh">
            <div>
              <span className="ob-rl" id="ob-when">Best moment</span>
              <div className="ob-tiles" role="radiogroup" aria-labelledby="ob-when">
                {MOMENTS.map((m) => (
                  <button key={m.key} type="button" className="ob-tile" role="radio" aria-checked={moment === m.key} onClick={() => pickMoment(m.key)}>
                    <m.icon className="ai" size={22} aria-hidden="true" />
                    <span>{m.label}</span>
                    <small>{m.sub}</small>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="ob-rl" id="ob-long">
                How long, most days <span>· a journey day takes about 10 minutes</span>
              </span>
              <div className="ob-seg" role="radiogroup" aria-labelledby="ob-long">
                {MINUTES.map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            <div className="ob-rem">
              <Bell className="ai" size={22} aria-hidden="true" />
              <span className="ob-rem-t">
                Remind me to write
                <small>One gentle email when your day opens. Never more than one.</small>
              </span>
              <label className="ob-time" data-off={!remind}>
                <Clock className="ai" size={16} aria-hidden="true" />
                {clock(hour)}
                <select aria-label="Reminder time" value={hour} disabled={!remind} onChange={(e) => setHour(e.target.value)}>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {clock(h)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="ob-sw" role="switch" aria-checked={remind} aria-label="Email reminder" onClick={() => setRemind((v) => !v)} />
            </div>
          </div>
          <div className="ob-foot">
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" onClick={() => setStep(2)}>
              Continue
              <ArrowRight className="ai" size={16} aria-hidden="true" />
            </button>
          </div>
        </main>
      )}

      {!done && step === 2 && (
        <main className="ob-main wide" key="s2">
          <span className="ob-over">Your first journey</span>
          <h1 className="ob-h">{chosen && chosen.id !== recommended?.id ? "A good place to begin" : "We'd start here"}</h1>
          <p className="ob-p">
            {days} short days, one at a time. Each new day opens the morning after you write the one before.
          </p>
          {chosen ? (
            <div className="ob-pick">
              <article className="ob-jc ob-jc-main">
                <img src={journeyImage(chosen)} alt="" />
                <span className="ob-jc-sel" aria-hidden="true">
                  <Check size={16} strokeWidth={2.5} />
                </span>
                {chosenFits.length > 0 && (
                  <span className="ob-jc-why">
                    <Sparkles className="ai" size={14} aria-hidden="true" />
                    Fits {chosenFits.slice(0, 2).map((i) => `“${i.chip}”`).join(" and ")}
                  </span>
                )}
                <span className="ob-jc-cat">{chosen.category}</span>
                <h2 className="ob-jc-t">{chosen.title}</h2>
                {chosen.tagline && <p className="ob-jc-p">{chosen.tagline}</p>}
                <div className="ob-jc-meta">
                  <span>
                    <CalendarDays className="ai" size={16} aria-hidden="true" />
                    {days} days
                  </span>
                  <span>
                    <Clock className="ai" size={16} aria-hidden="true" />
                    About 10 min a day
                  </span>
                  {chosen.premium && (
                    <span>
                      <Sparkles className="ai" size={16} aria-hidden="true" />
                      Day 1 free, the rest with Plus
                    </span>
                  )}
                </div>
                <button type="button" className="ob-jc-btn" aria-pressed="true" aria-label={`${chosen.title}, selected`} />
              </article>
              {others.length > 0 && (
                <div className="ob-alts">
                  <span className="ob-alts-h">Or choose another</span>
                  {others.map((j) => (
                    <article key={j.id} className="ob-jc ob-jc-alt">
                      <img src={journeyImage(j)} alt="" loading="lazy" />
                      <span className="ob-jc-cat">{j.category}</span>
                      <h2 className="ob-jc-t">{j.title}</h2>
                      {j.tagline && <p className="ob-jc-p">{j.tagline}</p>}
                      <button type="button" className="ob-jc-btn" aria-pressed="false" aria-label={`Choose ${j.title}`} onClick={() => setPickId(j.id)} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="ob-note" style={{ marginTop: 40 }}>Loading journeys…</p>
          )}
          <div className="ob-foot">
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" disabled={!chosen} onClick={() => setStep(3)}>
              Start with this journey
              <ArrowRight className="ai" size={16} aria-hidden="true" />
            </button>
            <Link className="ob-note" href="/journeys" onClick={() => save()}>
              See all journeys
            </Link>
          </div>
        </main>
      )}

      {!done && step === 3 && (
        <main className="ob-main wide" key="s3">
          <span className="ob-over">HumanSoul Plus</span>
          <h1 className="ob-h">Seven days, every journey. Free.</h1>
          <p className="ob-p">
            On the free plan, premium journeys open Day 1 only. Plus opens every day of every journey, and starts with a free week.
          </p>
          <div className="ob-tr">
            <section className="ob-tl" aria-labelledby="ob-how">
              <h2 className="ob-tl-h" id="ob-how">How the free week works</h2>
              <ol>
                <li className="now">
                  <span className="ob-tl-i"><Sparkles size={20} aria-hidden="true" /></span>
                  <div>
                    <div className="ob-tl-w">DAY 1</div>
                    <div className="ob-tl-t">Your free week starts</div>
                    <div className="ob-tl-d">Every day of every journey opens. No charge that day.</div>
                  </div>
                </li>
                <li>
                  <span className="ob-tl-i"><Mail size={20} aria-hidden="true" /></span>
                  <div>
                    <div className="ob-tl-w">DAY 5</div>
                    <div className="ob-tl-t">We remind you by email</div>
                    <div className="ob-tl-d">Two days before the trial ends, so nothing catches you off guard.</div>
                  </div>
                </li>
                <li>
                  <span className="ob-tl-i"><CalendarDays size={20} aria-hidden="true" /></span>
                  <div>
                    <div className="ob-tl-w">DAY 7</div>
                    <div className="ob-tl-t">Plus begins</div>
                    <div className="ob-tl-d">You're charged only if you stay. Cancel before then in one tap.</div>
                  </div>
                </li>
              </ol>
              <div className="ob-inc">
                {["Every day of every journey", "New journeys as they arrive", "Your journal, unlimited", "Export everything you write"].map((t) => (
                  <span key={t}>
                    <Check className="ai" size={16} aria-hidden="true" />
                    {t}
                  </span>
                ))}
              </div>
            </section>
            <div className="ob-buy" role="radiogroup" aria-label="Plan">
              <button type="button" className="ob-plan" role="radio" aria-checked={plan === "year"} onClick={() => setPlan("year")}>
                <span className="ob-plan-top">
                  <span>
                    Yearly <span className="ob-save">Save {YEARLY_SAVING}%</span>
                  </span>
                  <span className="ob-plan-r" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                </span>
                <span className="ob-plan-p">
                  <b>{year.price}</b>
                  <span>a year after the trial</span>
                </span>
                <span className="ob-plan-n">{year.note}, billed once a year</span>
              </button>
              <button type="button" className="ob-plan" role="radio" aria-checked={plan === "month"} onClick={() => setPlan("month")}>
                <span className="ob-plan-top">
                  <span>Monthly</span>
                  <span className="ob-plan-r" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                </span>
                <span className="ob-plan-p">
                  <b>{month.price}</b>
                  <span>a month after the trial</span>
                </span>
              </button>
              <button type="button" className="ob-btn ob-sec ob-lg" disabled>
                Free week opens soon
              </button>
              <p className="ob-buy-n">
                Payments aren't open yet. <b>Nothing is charged.</b> You'll find the free week in Profile as soon as it opens.
              </p>
            </div>
          </div>
          <div className="ob-foot">
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" disabled={saving} onClick={finishPlan}>
              {saving ? "Saving…" : "Continue with the free plan"}
              {!saving && <ArrowRight className="ai" size={16} aria-hidden="true" />}
            </button>
          </div>
        </main>
      )}

      {done && (
        <main className="ob-main" key="done">
          <span className="ob-done">
            <Check size={32} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <h1 className="ob-h">{name ? `You're all set, ${name}` : "You're all set"}</h1>
          <p className="ob-p">
            {chosen ? `Day 1 of ${chosen.title} is open. ` : ""}Each new day opens the morning after you write.
          </p>
          <div className="ob-rd">
            <div>
              <Compass className="ai" size={22} aria-hidden="true" />
              <b>{chosen?.premium ? "Day 1 is yours" : `All ${days} days are yours`}</b>
              <span>{chosen?.premium ? "The rest opens with Plus" : "This journey is on the free plan"}</span>
            </div>
            <div>
              <Bell className="ai" size={22} aria-hidden="true" />
              <b>{remind ? `Reminder at ${clock(hour)}` : "No reminders"}</b>
              <span>{remind ? "One email, when your day opens" : "Turn them on any time in Profile"}</span>
            </div>
            <div>
              <Clock className="ai" size={22} aria-hidden="true" />
              <b>{MOMENTS.find((m) => m.key === moment)!.label}, {minutes} min</b>
              <span>Your moment to write</span>
            </div>
          </div>
          <div className="ob-foot">
            <Link className="ob-btn ob-pri ob-lg ob-wide" href="/dashboard?tour=1">
              Show me around
              <ArrowRight className="ai" size={16} aria-hidden="true" />
            </Link>
            <Link className="ob-btn ob-ghost" href={dayHref}>
              Skip and begin Day 1
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
