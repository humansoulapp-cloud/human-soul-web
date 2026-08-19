import React from "react";
import Link from "next/link";
import { getJourneys } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { PLANS } from "@/lib/plans";
import LandingFaq from "@/components/landing-faq";

const WRAP = "w-[min(1120px,100%-36px)] md:w-[min(1120px,100%-48px)] mx-auto";
const H2 =
  "text-[26px] md:text-[33px] font-semibold leading-[1.2] tracking-[-0.02em] m-0 mb-2.5 max-w-[24ch]";
const LEAD = "text-[15.5px] leading-[1.65] text-[var(--ds-text-muted)] m-0 max-w-[56ch]";
const CARD = "rounded-[14px] border border-[var(--ds-line)] bg-[var(--ds-surface)]";
const PRIMARY =
  "inline-block px-[26px] py-3.5 rounded-[11px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[14.5px] font-semibold transition-colors";
const GHOST =
  "inline-block px-[22px] py-3.5 rounded-[11px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[14.5px] transition-colors";
const SUBTLE = "text-[13px] leading-[1.6] text-[var(--ds-text-muted)]";

const BEFORE = [
  "Days blur together and the week disappears.",
  "You buy a notebook, write twice, stop.",
  "Journalling feels like homework with no prompt.",
  "You think about your life mostly when something goes wrong.",
];

const AFTER = [
  "You can name what today actually contained.",
  "Entries written, because one day opened at a time.",
  "A question waiting for you instead of a blank page.",
  "Noticing becomes something you do on ordinary days too.",
];

const FEATURES: [string, string][] = [
  [
    "One day at a time",
    "Nothing to catch up on. The next day appears when you come back, so a missed evening is not a broken streak.",
  ],
  [
    "A reading, then a question",
    "Each day gives you something to read first. Writing is easier when the thinking has already started.",
  ],
  [
    "Your journal, searchable",
    "Everything you write stays in one place, grouped by month, searchable by word, mood or journey.",
  ],
  [
    "Favorites",
    "Keep the entries you want to reread, saved with one tap and kept together.",
  ],
  [
    "Private by default",
    "Entries are never shown to anyone, never sold, and never used to train anything.",
  ],
  [
    "Yours to take",
    "Export everything you have written whenever you want, or delete it all in one step.",
  ],
];

const STEPS: [string, string][] = [
  [
    "Choose a journey",
    "Pick a theme that matches where you are right now. A few minutes a day, for as many days as it has.",
  ],
  [
    "Read, then write",
    "A short reading opens the day. Then one question, and space to answer it however you like.",
  ],
  [
    "Keep what you wrote",
    "Entries stay in your journal. Look back after a week and the pattern is already visible.",
  ],
];

export default async function LandingPage() {
  const journeys = await getJourneys();
  const featured = journeys.slice(0, 6);

  return (
    <div className="bg-[var(--ds-bg)] text-[var(--ds-text)] text-sm">
      <header className="sticky top-0 z-10 py-4 border-b border-[var(--ds-line)] bg-[var(--ds-bg)]">
        <div className={`${WRAP} flex items-center gap-5`}>
          <span className="text-[19px] font-bold tracking-[-0.015em]">
            Human<span className="font-normal">Soul</span>
          </span>
          <span className="flex-1" />
          <a href="#journeys" className="hidden sm:inline text-[13.5px] text-[var(--ds-text-mid)]">
            Journeys
          </a>
          <a href="#pricing" className="hidden sm:inline text-[13.5px] text-[var(--ds-text-mid)]">
            Pricing
          </a>
          <Link href="/sign-in" className="text-[13.5px] text-[var(--ds-text-mid)]">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-[18px] py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 md:py-[76px]">
        <div className={`${WRAP} grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-12 items-center`}>
          <div>
            <span className="inline-block px-3 py-1.5 rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[10px] font-bold tracking-[0.12em]">
              DAY ONE OF EVERY JOURNEY IS FREE
            </span>
            <h1 className="text-[36px] md:text-[52px] font-semibold leading-[1.08] tracking-[-0.028em] mt-4 mb-4 max-w-[16ch]">
              A quiet place to notice your own life
            </h1>
            <p className="text-base md:text-[16.5px] leading-[1.7] text-[var(--ds-text-mid)] m-0 max-w-[52ch]">
              HumanSoul is a journal with company. Guided journeys open one day at a time: something
              to read, something to write, and a question worth carrying for the rest of the day.
            </p>
            <div className="flex items-center gap-3.5 mt-7 flex-wrap">
              <Link href="/sign-up" className={PRIMARY}>
                Create your account
              </Link>
              <a href="#how" className={GHOST}>
                See how it works
              </a>
            </div>
            <div className={`${SUBTLE} mt-[18px]`}>
              About seven minutes a day. Nothing to catch up on.
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden">
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80")',
              }}
            />
            <div className={`${CARD} absolute left-[18px] right-[18px] bottom-[18px] px-[18px] py-4`}>
              <span className="block text-[10px] font-bold tracking-[0.11em] text-[var(--ds-text-muted)]">
                DAY 1 · TODAY
              </span>
              <div className="text-[19px] font-semibold mt-1.5 mb-1">Beginning where you are</div>
              <div className="text-[13.5px] italic text-[var(--ds-text-muted)]">
                “What did you almost overlook today?”
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Before / after ── */}
      <section className="py-16 md:py-[74px]">
        <div className={WRAP}>
          <h2 className={H2}>What changes after a week</h2>
          <p className={LEAD}>
            Not a new personality. A slightly different relationship with your own days.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-[26px]">
            <div className="px-[26px] py-6 rounded-2xl border border-dashed border-[var(--ds-line-strong)]">
              <div className="text-[10px] font-bold tracking-[0.12em] text-[var(--ds-text-muted)]">
                BEFORE
              </div>
              <div className="mt-3.5">
                {BEFORE.map((text) => (
                  <div
                    key={text}
                    className="py-3 text-[14.5px] leading-[1.6] text-[var(--ds-text-muted)] border-b border-[var(--ds-line)]"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className={`${CARD} px-[26px] py-6 rounded-2xl`}>
              <div className="text-[10px] font-bold tracking-[0.12em] text-[var(--ds-accent)]">
                AFTER A WEEK
              </div>
              <div className="mt-3.5">
                {AFTER.map((text) => (
                  <div
                    key={text}
                    className="flex items-start gap-2.5 py-3 text-[14.5px] leading-[1.6] border-b border-[var(--ds-line)]"
                  >
                    <span className="text-[var(--ds-accent)] font-bold flex-shrink-0">✓</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 md:py-[74px] bg-[var(--ds-side)]">
        <div className={WRAP}>
          <h2 className={H2}>Built to be gentle and finishable</h2>
          <p className={LEAD}>Every feature exists to remove a reason not to write today.</p>
          <div className="grid gap-4 mt-[26px] [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {FEATURES.map(([title, body]) => (
              <div key={title} className={`${CARD} px-[22px] py-5`}>
                <div className="text-[16.5px] font-semibold">{title}</div>
                <div className={`${SUBTLE} mt-2`}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-16 md:py-[74px]">
        <div className={WRAP}>
          <h2 className={H2}>Three steps, then it is just a habit</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-[26px]">
            {STEPS.map(([title, body], i) => (
              <div key={title} className={`${CARD} px-6 py-[22px]`}>
                <span className="grid place-items-center w-8 h-8 rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[13px] font-bold">
                  {i + 1}
                </span>
                <div className="text-[17px] font-semibold mt-3.5">{title}</div>
                <div className={`${SUBTLE} mt-1.5`}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journeys ── */}
      <section id="journeys" className="py-16 md:py-[74px] bg-[var(--ds-side)]">
        <div className={WRAP}>
          <h2 className={H2}>
            {journeys.length} {journeys.length === 1 ? "journey" : "journeys"} to choose from
          </h2>
          <p className={LEAD}>Day one of every journey is free, always.</p>
          <div className="grid gap-4 mt-[26px] [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {featured.map((journey) => (
              <div key={journey.id} className={`${CARD} overflow-hidden`}>
                <span
                  className="block aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
                />
                <div className="px-[17px] pt-4 pb-[17px]">
                  <div className="text-[10px] font-semibold tracking-[0.11em] text-[var(--ds-accent)] uppercase">
                    {journey.category}
                  </div>
                  <div className="text-[18px] font-semibold leading-[1.25] mt-1.5 mb-1">
                    {journey.title}
                  </div>
                  <div className="text-[12.5px] leading-[1.6] text-[var(--ds-text-muted)]">
                    {journey.tagline}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 md:py-[74px]">
        <div className={WRAP}>
          <h2 className={H2}>Start free. Decide later.</h2>
          <p className={LEAD}>
            The free plan stays open for as long as you want it. Plus opens the days that follow day
            one.
          </p>
          <div className="grid gap-4 mt-[26px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {[
              {
                tag: "FREE",
                price: "€0",
                per: "",
                note: "Day one of every journey, kept for good.",
                accent: false,
                items: [
                  "Day one of every journey",
                  "Free writing whenever you want",
                  "Your journal, searchable and exportable",
                ],
              },
              {
                tag: "PLUS MONTHLY",
                price: PLANS[0].price,
                per: "per month",
                note: "Everything open, cancel any time.",
                accent: true,
                items: [
                  "Every day of every journey",
                  "The whole library as it grows",
                  "Your journal, searchable and exportable",
                ],
              },
              {
                tag: "PLUS YEARLY",
                price: PLANS[1].price,
                per: "per year",
                note: "€3.25 a month, billed once. Save 35%.",
                accent: false,
                items: ["Everything in Plus", "New journeys as they arrive", "Export any time"],
              },
            ].map((tier) => (
              <div
                key={tier.tag}
                className={`px-[26px] py-6 rounded-2xl border ${
                  tier.accent
                    ? "border-[var(--ds-gold)] bg-[var(--ds-gold-soft)]"
                    : "border-[var(--ds-line)] bg-[var(--ds-surface)]"
                }`}
              >
                <div
                  className={`text-[10px] font-bold tracking-[0.12em] ${
                    tier.accent ? "text-[var(--ds-gold)]" : "text-[var(--ds-text-muted)]"
                  }`}
                >
                  {tier.tag}
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-[32px] font-semibold tracking-[-0.02em]">{tier.price}</span>
                  <span className="text-[13px] text-[var(--ds-text-muted)]">{tier.per}</span>
                </div>
                <div className={`${SUBTLE} text-[12.5px] mt-2`}>{tier.note}</div>
                <div className="flex flex-col gap-2 mt-3.5">
                  {tier.items.map((text) => (
                    <div
                      key={text}
                      className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-[var(--ds-text-mid)]"
                    >
                      <span
                        className={`font-bold flex-shrink-0 ${
                          tier.accent ? "text-[var(--ds-gold)]" : "text-[var(--ds-accent)]"
                        }`}
                      >
                        ✓
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
                <Link
                  href="/sign-up"
                  className={`block mt-5 p-3 rounded-[10px] text-center text-[13.5px] font-semibold ${
                    tier.accent
                      ? "bg-[var(--ds-gold)] text-[var(--ds-on-gold)] hover:text-[var(--ds-on-gold)]"
                      : "border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)]"
                  }`}
                >
                  Create an account
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFaq />

      {/* ── Closing ── */}
      <section className="py-16 md:py-[74px] bg-[var(--ds-side)]">
        <div className={`${WRAP} text-center`}>
          <div className={`${CARD} max-w-[560px] mx-auto mb-10 px-6 py-5`}>
            <div className="text-[15px] font-semibold">Private by default</div>
            <p className={`${SUBTLE} mt-2 mb-0`}>
              Your entries are yours. They are never shown to anyone, never sold, and never used to
              train models. Export or delete everything whenever you want.
            </p>
          </div>
          <h2 className="text-[28px] md:text-[36px] font-semibold leading-[1.2] tracking-[-0.022em] mx-auto mb-6 max-w-[22ch]">
            Today is an ordinary day. Start there.
          </h2>
          <Link href="/sign-up" className={PRIMARY}>
            Create your account
          </Link>
          <div className={`${SUBTLE} mt-4`}>About seven minutes a day.</div>
        </div>
      </section>

      <footer className="py-[26px] border-t border-[var(--ds-line)]">
        <div className={`${WRAP} flex items-center gap-[18px] flex-wrap`}>
          <span className="text-[19px] font-bold tracking-[-0.015em]">
            Human<span className="font-normal">Soul</span>
          </span>
          <span className="flex-1" />
          <a href="#journeys" className="text-[13px] text-[var(--ds-text-muted)]">
            Journeys
          </a>
          <a href="#pricing" className="text-[13px] text-[var(--ds-text-muted)]">
            Pricing
          </a>
          <Link href="/sign-in" className="text-[13px] text-[var(--ds-text-muted)]">
            Sign in
          </Link>
          <span className="text-xs text-[var(--ds-text-muted)]">
            © {new Date().getFullYear()} HumanSoul
          </span>
        </div>
      </footer>
    </div>
  );
}
