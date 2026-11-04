"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, Mail, Moon, Sparkles, Sun, Sunset } from "lucide-react";
import { createClient, currentUser } from "@/lib/supabase/client";
import { BILLING_LIVE, PLANS, YEARLY_SAVING } from "@/lib/plans";
import { Logo } from "@/components/ds";
import { sendWelcomeEmail } from "@/lib/actions/emails";
import { accessFrom, loadBetaUntil } from "@/lib/access";
import { INTENTS, type IntentKey } from "@/lib/intents";
import "./onboarding.css";

const MOMENTS = [
  { key: "morning", label: "Morning", sub: "Before the day starts", icon: Sun, hour: "07:00" },
  { key: "midday", label: "Midday", sub: "A pause in the middle", icon: Sunset, hour: "13:00" },
  { key: "evening", label: "Evening", sub: "To close the day", icon: Moon, hour: "21:00" },
] as const;
type MomentKey = (typeof MOMENTS)[number]["key"];

/* Two steps (what brings you here, reminder), plus the Plus step only when
   billing is live and the person has no full access. The first journey is
   chosen in the Home tour, which every new person sees right after this. */
const STEPS_ALL = 3;

function clock(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return new Date(2000, 0, 1, hh, mm).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});

  const [intents, setIntents] = useState<IntentKey[]>([]);
  const [moment, setMoment] = useState<MomentKey>("evening");
  const [remind, setRemind] = useState(true);
  const [hour, setHour] = useState("21:00");
  const [plan, setPlan] = useState<"year" | "month">("year");
  const [saving, setSaving] = useState(false);
  /* Beta or Plus: every journey is already open, so there is nothing to sell. */
  const [fullAccess, setFullAccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const user = await currentUser(supabase);
      if (user) {
        setUserId(user.id);
        setName((user.user_metadata?.display_name || "").trim().split(/\s+/)[0] || "");
        const [{ data: profile }, betaUntil] = await Promise.all([
          supabase.from("profiles").select("preferences, plan, role").eq("user_id", user.id).maybeSingle(),
          loadBetaUntil(supabase, user.id),
        ]);
        setPrefs(((profile?.preferences as Record<string, unknown>) ?? {}) || {});
        setFullAccess(accessFrom(profile?.plan as string | null | undefined, betaUntil, Date.now(), profile?.role as string | null | undefined).full);
      }
    }
    load();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

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
          onboarding: { ...((prefs.onboarding as Record<string, unknown>) ?? {}), intents, moment: remind ? moment : null, plan_interest: plan },
        },
      })
      .eq("user_id", userId);
  };

  /* Finishing or skipping both lead to Home, where the tour helps choose the first journey. */
  const finish = async () => {
    setSaving(true);
    await save();
    try {
      localStorage.setItem("onboarding_done", "true");
    } catch {}
    sendWelcomeEmail().catch(() => null);
    router.push("/dashboard");
  };

  const back = () => setStep((s) => Math.max(0, s - 1));
  /* No Plus step while billing isn't live (beta): nothing to choose or pay. */
  const skipPlus = fullAccess || !BILLING_LIVE;
  const STEPS = skipPlus ? STEPS_ALL - 1 : STEPS_ALL;
  const shown = step + 1;
  const year = PLANS.find((p) => p.key === "year")!;
  const month = PLANS.find((p) => p.key === "month")!;

  return (
    <div className="ob">
      <header className="ob-bar">
        <div className="ob-in">
          <Link className="ob-logo" href="/dashboard" aria-label="HumanSoul home">
            <Logo size={22} />
          </Link>
          <div className="ob-step">
            <span>{`Step ${shown} of ${STEPS}`}</span>
            <div className="ob-prog" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={shown}>
              {Array.from({ length: STEPS }, (_, i) => (
                <span key={i} className={i < shown ? "on" : ""} />
              ))}
            </div>
          </div>
          <div className="ob-right">
            {step === 0 ? (
              <button type="button" className="ob-btn ob-ghost" onClick={finish} disabled={saving}>
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

      {step === 0 && (
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
              {intents.length ? `${intents.length} selected` : ""}
            </span>
          </div>
        </main>
      )}

      {step === 1 && (
        <main className="ob-main" key="s1">
          <span className="ob-over">Your rhythm</span>
          <h1 className="ob-h">Would you like a reminder?</h1>
          <p className="ob-p">One quiet email a day, at the moment you choose. You can change it any time in Profile.</p>
          <div className="ob-rh">
            <div className="ob-rem">
              <Bell className="ai" size={22} aria-hidden="true" />
              <span className="ob-rem-t">
                Remind me to write
                <small>Never more than one a day.</small>
              </span>
              <button type="button" className="ob-sw" role="switch" aria-checked={remind} aria-label="Email reminder" onClick={() => setRemind((v) => !v)} />
            </div>
            {remind ? (
              <div className="ob-tiles" role="radiogroup" aria-label="When">
                {MOMENTS.map((m) => (
                  <button key={m.key} type="button" className="ob-tile" role="radio" aria-checked={moment === m.key} onClick={() => pickMoment(m.key)}>
                    <m.icon className="ai" size={22} aria-hidden="true" />
                    <span>{m.label}</span>
                    <small>{clock(m.hour)}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="ob-foot">
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" disabled={saving} onClick={() => (skipPlus ? finish() : setStep(2))}>
              {saving ? "Saving…" : "Continue"}
              {!saving && <ArrowRight className="ai" size={16} aria-hidden="true" />}
            </button>
          </div>
        </main>
      )}

      {step === 2 && !skipPlus && (
        <main className="ob-main wide" key="s2">
          <span className="ob-over">HumanSoul Plus</span>
          <h1 className="ob-h">Every journey, with a free week.</h1>
          <p className="ob-p">
            Free journeys are open to everyone. Plus opens every journey in the library, and starts with a free week.
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
            <button type="button" className="ob-btn ob-pri ob-lg ob-wide" disabled={saving} onClick={finish}>
              {saving ? "Saving…" : "Continue with the free plan"}
              {!saving && <ArrowRight className="ai" size={16} aria-hidden="true" />}
            </button>
          </div>
        </main>
      )}

    </div>
  );
}
