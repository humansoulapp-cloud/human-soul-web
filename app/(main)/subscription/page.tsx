"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, Compass, Download, Lock, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { journeyImage } from "@/lib/journey-images";
import type { Journey } from "@/lib/journal";
import { PLANS, YEARLY_SAVING } from "@/lib/plans";
import PageLoader from "@/components/PageLoader";
import "../../account.css";

type Cell = "yes" | "no" | string;

/** Only what the app really does today. */
const ROWS: [string, string, Cell, Cell][] = [
  ["Day one of every journey", "Read it, write it and keep it, on any journey.", "yes", "yes"],
  ["Every day of every journey", "Days open one at a time, after you write the one before.", "no", "yes"],
  ["New journeys as they arrive", "The library keeps growing.", "Day one", "yes"],
  ["Your Journal, unlimited", "Write freely, search, favorite and export.", "yes", "yes"],
];

const FAQS: [string, string][] = [
  [
    "What do I get for paying?",
    "Every day of every journey, and the ones still to come. On the free plan you can read and write day one of any journey; the rest open with Plus.",
  ],
  ["Can I cancel whenever I want?", "Yes. Plus stays active until the end of the period you already paid for."],
  [
    "What happens to my Journal if I cancel?",
    "Nothing. Everything you wrote stays in your Journal, readable and exportable, on any plan.",
  ],
  [
    "Is my journal private?",
    "Your entries are private by default and aren't shared with other HumanSoul members. They are never used to train AI or for advertising.",
  ],
];

function CellView({ v }: { v: Cell }) {
  if (v === "yes")
    return (
      <span className="ac-yes">
        <Check className="ai" size={16} aria-hidden="true" />
        Included
      </span>
    );
  if (v === "no") return <span className="ac-no">Not included</span>;
  return <span className="ac-part">{v}</span>;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [plus, setPlus] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [since, setSince] = useState<string | null>(null);
  const [plan, setPlan] = useState<"year" | "month">("year");
  const [open, setOpen] = useState(0);
  const [journey, setJourney] = useState<Journey | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: profile }, { data: journeys }] = await Promise.all([
        user
          ? supabase.from("profiles").select("*").eq("user_id", user.id).single()
          : Promise.resolve({ data: null }),
        supabase.from("journeys").select("*, journey_days(day, title)").order("created_at", { ascending: true }),
      ]);
      const p = profile as { plan?: string | null; created_at?: string } | null;
      setPlus(Boolean(p?.plan && p.plan !== "free"));
      setPlanName(p?.plan ?? null);
      setSince(p?.created_at ?? user?.created_at ?? null);
      const list = ((journeys ?? []) as Journey[]).filter((j) => (j.status || "published") === "published");
      setJourney(list.find((j) => j.id === "becoming-more-human") ?? list.find((j) => j.featured) ?? list[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  const year = PLANS.find((p) => p.key === "year")!;
  const month = PLANS.find((p) => p.key === "month")!;
  const selected = plan === "year" ? year : month;
  const days = [...(journey?.journey_days ?? [])].sort((a, b) => a.day - b.day);

  const faq = (
    <section className="ac-sec" aria-labelledby="sub-faq">
      <div className="ac-sec-h">
        <h2 id="sub-faq" className="ac-h3">
          Questions
        </h2>
      </div>
      <div className="ac-faq">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="ac-q" data-open={open === i}>
            <button type="button" className="ac-q-h" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              {q}
              <ChevronDown className="ai" size={18} aria-hidden="true" />
            </button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );

  if (plus) {
    const yearly = !planName || /year|annual/i.test(planName);
    return (
      <div className="ac">
        <div className="ac-head">
          <span className="ac-over">
            <Sparkles size={14} aria-hidden="true" />
            HumanSoul Plus
          </span>
          <h1 className="ac-h1">Your subscription</h1>
        </div>
        <div className="ac-act">
          <section className="ac-card" aria-labelledby="sub-plan">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <h2 id="sub-plan" className="ac-h3">
                Plus · {yearly ? "Yearly" : "Monthly"}
              </h2>
              <span className="ac-status">
                <Check size={14} aria-hidden="true" />
                Active
              </span>
            </div>
            <div className="ac-kv">
              <div>
                <span>Price</span>
                <b>{yearly ? `${year.price} a year` : `${month.price} a month`}</b>
              </div>
              <div>
                <span>Member since</span>
                <b>{since ? new Date(since).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "·"}</b>
              </div>
            </div>
            <ul className="ac-list">
              <li>
                <Check className="ai" size={16} aria-hidden="true" />
                Every day of every journey, and new ones as they arrive
              </li>
              <li>
                <Check className="ai" size={16} aria-hidden="true" />
                Your Journal, unlimited and exportable
              </li>
            </ul>
          </section>
          <aside className="ac-side" aria-label="Manage">
            <div className="ac-side-a">
              <span>
                Billing and invoices
                <small>Managed with Stripe once payments are connected.</small>
              </span>
            </div>
            <Link className="ac-side-a" href="/profile">
              <span>
                Download your writing
                <small>Everything you wrote, in one file.</small>
              </span>
            </Link>
          </aside>
        </div>
        {faq}
      </div>
    );
  }

  return (
    <div className="ac">
      <section className="ac-hero" aria-labelledby="sub-h">
        <div>
          <span className="ac-over">
            <Sparkles size={14} aria-hidden="true" />
            HumanSoul Plus
          </span>
          <h1 id="sub-h" className="ac-h">
            Keep every journey open
          </h1>
          <p className="ac-lede">
            Day one of every journey is free. Plus opens the days that follow, and every new journey as the library grows.
          </p>
          <div className="ac-plans" role="radiogroup" aria-label="Plan">
            <button type="button" className="ac-plan" role="radio" aria-checked={plan === "year"} onClick={() => setPlan("year")}>
              <span className="ac-plan-top">
                <span className="ac-plan-n">Yearly</span>
                <span className="ac-save">Save {YEARLY_SAVING}%</span>
              </span>
              <span className="ac-plan-p">
                <b>{year.price}</b>
                <span>a year</span>
              </span>
              <span className="ac-plan-note">{year.note.replace(" / month", "")} a month, billed once</span>
              <span className="ac-plan-check">
                <Check size={14} aria-hidden="true" />
              </span>
            </button>
            <button type="button" className="ac-plan" role="radio" aria-checked={plan === "month"} onClick={() => setPlan("month")}>
              <span className="ac-plan-top">
                <span className="ac-plan-n">Monthly</span>
              </span>
              <span className="ac-plan-p">
                <b>{month.price}</b>
                <span>a month</span>
              </span>
              <span className="ac-plan-note">Cancel any time</span>
              <span className="ac-plan-check">
                <Check size={14} aria-hidden="true" />
              </span>
            </button>
          </div>
          <div className="ac-cta">
            <button type="button" className="ac-btn ac-btn-pri ac-btn-lg" disabled>
              Continue with {plan === "year" ? "yearly" : "monthly"} · {selected.price}
            </button>
            <span className="ac-cta-n">Payments open soon. Nothing can be charged yet.</span>
          </div>
          <ul className="ac-prom">
            <li>
              <span className="ac-ico">
                <Download size={18} aria-hidden="true" />
              </span>
              <span>
                <b>Your words stay yours</b>Cancel and your Journal stays readable and exportable.
              </span>
            </li>
            <li>
              <span className="ac-ico">
                <BookOpen size={18} aria-hidden="true" />
              </span>
              <span>
                <b>At your own pace</b>No streaks and no deadlines. Each day opens when you finish the one before.
              </span>
            </li>
            <li>
              <span className="ac-ico">
                <Shield size={18} aria-hidden="true" />
              </span>
              <span>
                <b>Private by default</b>Never shown to anyone, never used to train AI.
              </span>
            </li>
          </ul>
        </div>

        {journey && (
          <aside className="ac-open" aria-label="What Plus opens">
            <div className="ac-open-img">
              <img src={journeyImage(journey)} alt="" />
            </div>
            <div className="ac-open-b">
              <span className="ac-open-over">
                {[journey.category, days.length ? `${days.length} days` : null].filter(Boolean).join(" · ")}
              </span>
              <h2 className="ac-open-t">{journey.title}</h2>
              <ul className="ac-days">
                {days.map((d, i) => (
                  <li key={d.day} className={`ac-day ${i === 0 ? "free" : "plus"}`}>
                    <span className="ac-day-n">{String(d.day).padStart(2, "0")}</span>
                    <span className="ac-day-t">{(d as { title?: string }).title || `Day ${d.day}`}</span>
                    <span className="ac-day-s">
                      {i === 0 ? <Check size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
                      {i === 0 ? "Free" : "With Plus"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="ac-open-foot">Every journey works like this. With Plus, each day opens after you write the one before.</p>
            </div>
          </aside>
        )}
      </section>

      <section className="ac-sec" aria-labelledby="sub-cmp">
        <div className="ac-sec-h">
          <h2 id="sub-cmp" className="ac-h3">
            Free and Plus
          </h2>
          <Link className="ac-cta-n" href="/journeys">
            <Compass size={14} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 6 }} />
            Browse the library
          </Link>
        </div>
        <div className="ac-cmp">
          <div className="ac-cmp-row ac-cmp-h">
            <span>What you get</span>
            <span>Free</span>
            <span>Plus</span>
          </div>
          {ROWS.map(([t, m, f, p]) => (
            <div className="ac-cmp-row" key={t}>
              <span>
                <span className="ac-cmp-t">{t}</span>
                <span className="ac-cmp-m">{m}</span>
              </span>
              <CellView v={f} />
              <CellView v={p} />
            </div>
          ))}
        </div>
      </section>

      {faq}
    </div>
  );
}
