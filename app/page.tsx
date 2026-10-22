import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Clock,
  Compass,
  Download,
  Eye,
  Heart,
  Layers,
  Lock,
  Minus,
  PenLine,
  Play,
  Repeat,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
} from "lucide-react";
import { getJourneys, type JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import { PLANS } from "@/lib/plans";
import LandingFaq from "@/components/landing-faq";
import LandingMotion from "@/components/landing/LandingMotion";
import "./landing.css";

export const metadata: Metadata = {
  title: "HumanSoul · A quiet place to notice yourself",
  description:
    "A library of guided reflective journeys and a private journal. Write a little, notice a lot.",
};

/* Sets the class that enables the entrance and scroll animations before the
   first paint, so content never flashes in and then hides. */
const MOTION_FLAG = `document.documentElement.classList.add("lp-js")`;

const Wordmark = ({ size = 22 }: { size?: number }) => (
  <span style={{ fontSize: size, lineHeight: 1 }}>
    <span className="wm-a">Human</span>
    <span className="wm-b">Soul</span>
  </span>
);

function daysOf(j: JourneyRow) {
  return Array.isArray(j.journey_days) ? j.journey_days.length : 0;
}

function priceNumber(p: string) {
  return Number(p.replace(/[^0-9.]/g, "")) || 0;
}

export default async function LandingPage() {
  let journeys: JourneyRow[] = [];
  try {
    journeys = await getJourneys();
  } catch {
    journeys = [];
  }

  const byId = (id: string) => journeys.find((j) => j.id === id);
  const featured = byId("becoming-more-human") ?? journeys.find((j) => j.featured) ?? journeys[0];
  const library = [
    ...(featured ? [featured] : []),
    ...journeys.filter((j) => j !== featured),
  ].slice(0, 4);
  const categories = Array.from(
    new Set(journeys.map((j) => j.category).filter((c): c is string => Boolean(c))),
  ).slice(0, 6);
  const img = (j?: JourneyRow, fallbackIndex = 0) =>
    j ? journeyImage(j) : journeys[fallbackIndex] ? journeyImage(journeys[fallbackIndex]) : journeyImage({ id: "" });

  const heroPhoto = img(featured);
  const entryPhoto = img(library[2], 1);
  const finalPhoto = "/landing/final.jpg";
  const featuredTitle = featured?.title ?? "Becoming More Human";
  const featuredCategory = featured?.category ?? "Human Soul Foundations";
  const featuredDays = featured ? daysOf(featured) || 7 : 7;

  const month = PLANS.find((p) => p.key === "month");
  const year = PLANS.find((p) => p.key === "year");
  const currency = (year?.price ?? "€").replace(/[0-9.,\s]/g, "") || "€";
  const save =
    month && year
      ? Math.round((1 - priceNumber(year.price) / (priceNumber(month.price) * 12)) * 100)
      : 0;

  return (
    <div className="lp dark" data-theme="dark">
      <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
      <LandingMotion />

      <header className="nav">
        <div className="nav-in">
          <Link className="logo" href="/" aria-label="HumanSoul home">
            <Wordmark />
          </Link>
          <nav className="links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#journeys">Journeys</a>
            <a href="#privacy">Privacy</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="nav-r">
            <Link className="signin" href="/sign-in">
              Sign in
            </Link>
            <Link className="btn btn-pri" href="/sign-up">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-in">
            <span className="over">
              <Sparkles className="ai" size={14} aria-hidden="true" />
              A quiet place to notice yourself
            </span>
            <h1 className="h1 serif">Write a little. Notice a lot.</h1>
            <p className="lede">
              HumanSoul is a library of guided reflective journeys that helps you become more aware of
              yourself, while leaving the meaning of that awareness, and what you choose to do with it,
              entirely in your hands.
            </p>
            <div className="ctas">
              <Link className="btn btn-pri btn-lg" href="/sign-up">
                Start writing for free
              </Link>
              <a className="btn btn-sec btn-lg" href="#how">
                See how it works
              </a>
            </div>
            <p className="fine">No card needed · Private by default</p>
          </div>

          <div className="shot" aria-hidden="true">
            <div className="shot-in">
              <div className="win">
                <div className="win-bar">
                  <span className="win-url">humansoul.co/journal</span>
                </div>
                <div className="win-in">
                  <div className="mnav">
                    <span className="mnav-l">
                      <Wordmark size={16} />
                    </span>
                    <span className="mpills">
                      <span>Home</span>
                      <span className="on">Journal</span>
                      <span>Journeys</span>
                      <span>Favorites</span>
                    </span>
                    <span className="mtools">
                      <i className="p">
                        <PenLine size={14} />
                      </i>
                      <i>
                        <Sun size={14} />
                      </i>
                    </span>
                  </div>
                  <div className="jx">
                    <div className="jl">
                      <div className="jl-h">
                        <b>Journal</b>
                        <span className="jl-new">+ New</span>
                      </div>
                      <div className="jl-s">
                        <Search size={13} />
                        Search your reflections
                      </div>
                      <div className="jl-c">
                        <span className="on">All</span>
                        <span>Personal</span>
                        <span>Gratitude</span>
                        <span>From journeys</span>
                      </div>
                      <span className="jl-d">Today</span>
                      <div className="jl-r">
                        <b>Small good things</b>
                        <span>The light on the kitchen wall this morning…</span>
                        <em>Gratitude</em>
                      </div>
                      <span className="jl-d">Yesterday</span>
                      <div className="jl-r on">
                        <b>Three habits I never chose</b>
                        <span>Most of my evening runs on the same three…</span>
                        <em>{featuredTitle} · Day 2</em>
                      </div>
                      <div className="jl-r">
                        <b>A slow start</b>
                        <span>I didn&apos;t want to get up today, and that&apos;s fine…</span>
                        <em>Personal</em>
                      </div>
                      <div className="jl-r">
                        <b>Looking up on the bus</b>
                        <span>On the bus I noticed how much of the day…</span>
                        <em>{featuredTitle} · Day 1</em>
                      </div>
                    </div>
                    <div className="jr">
                      <div className="jr-m">
                        <span>Friday, October 9 · 9:12 PM</span>
                        <span className="jr-btns">
                          <span style={{ color: "var(--primary)" }}>
                            <Heart size={12} fill="currentColor" />
                          </span>
                          <span>
                            <Compass size={12} />
                            Edit in journey
                          </span>
                        </span>
                      </div>
                      <h3>Three habits I never chose</h3>
                      <span className="jr-tag">
                        <Compass size={12} />
                        {featuredTitle} · Day 2
                      </span>
                      <p>
                        Most of my evening runs on the same three habits. I never really chose any of them; they
                        just arrived and stayed.
                      </p>
                      <p>
                        The phone on the sofa, the second cup of tea, the show I don&apos;t even like. None of them
                        are bad, but none of them are mine either.
                      </p>
                      <div className="jr-ph">
                        <img src={entryPhoto} alt="" loading="lazy" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="phone">
                <div className="ph-in">
                  <div className="ph-img">
                    <img src={heroPhoto} alt="" />
                    <div className="ph-top">
                      <span>
                        <Clock size={11} />7 min
                      </span>
                      <span>Day 3 of {featuredDays}</span>
                    </div>
                  </div>
                  <div className="ph-b">
                    <span className="ph-o">{featuredTitle}</span>
                    <span className="ph-t serif">Among Other People</span>
                    <span className="ph-p">
                      Think about one interaction that stayed with you recently. It does not need to have been
                      dramatic.
                    </span>
                    <div className="ph-box" data-type="At lunch Ana said she'd noticed I was quieter lately.">
                      <span data-type-text="">Start with the moment that comes to mind</span>
                      <span className="caret" />
                    </div>
                    <span className="ph-cta">Save reflection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="w strip">
          {[
            [Lock, "Private by default", "Only you can read it"],
            [Clock, "About 7 minutes", "Read, then write"],
            [Repeat, "No streaks, no scores", "Nothing to keep up with"],
            [Smartphone, "Phone and desktop", "Your journal, everywhere"],
          ].map(([Icon, t, s], i) => {
            const I = Icon as typeof Lock;
            return (
              <div className="pr" key={t as string} data-reveal="" style={{ ["--d" as string]: i }}>
                <span className="pr-i">
                  <I size={20} aria-hidden="true" />
                </span>
                <div>
                  <b>{t as string}</b>
                  <span>{s as string}</span>
                </div>
              </div>
            );
          })}
        </div>

        <section className="sec" id="journeys">
          <div className="w feat">
            <div className="feat-t" data-reveal="">
              <span className="over">
                <Compass className="ai" size={14} aria-hidden="true" />
                Guided journeys
              </span>
              <h2 className="h2 serif">A closer look, one day at a time.</h2>
              <p className="sub">
                Each journey offers a few days to explore an idea, experience, or question more closely. Across
                HumanSoul, you&apos;ll find a wide range of topics, with one day opening at a time to give you space
                to reflect.
              </p>
              <ul className="bul">
                <li>
                  <i>
                    <BookOpen size={18} />
                  </i>
                  <div>
                    <b>A short daily reading</b>
                    <span>A few thoughtful paragraphs to introduce the day&apos;s reflection.</span>
                  </div>
                </li>
                <li>
                  <i>
                    <PenLine size={18} />
                  </i>
                  <div>
                    <b>Questions to reflect on</b>
                    <span>A series of questions inviting you to notice your thoughts, feelings, and experiences.</span>
                  </div>
                </li>
                <li>
                  <i>
                    <Sparkles size={18} />
                  </i>
                  <div>
                    <b>Go deeper, if you want</b>
                    <span>One final question invites you to explore a little further.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="stage" data-reveal="" style={{ ["--d" as string]: 1 }}>
              <div className="jo">
                <div className="jo-img">
                  <img src={heroPhoto} alt="" loading="lazy" />
                </div>
                <div className="jo-glass">
                  <span className="jo-o">
                    {featuredCategory} · {featuredDays} days
                  </span>
                  <div className="jo-t">{featuredTitle}</div>
                  <div className="jo-d">
                    {Array.from({ length: Math.min(featuredDays, 7) }, (_, i) => (
                      <span key={i} className={i < 2 ? "done" : i === 2 ? "now" : ""}>
                        {i < 2 ? <Check size={12} /> : i === 2 ? <PenLine size={12} /> : <Lock size={12} />}
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="w feat rev">
            <div className="feat-t" data-reveal="">
              <span className="over">
                <BookOpen className="ai" size={14} aria-hidden="true" />
                Read &amp; reflect
              </span>
              <h2 className="h2 serif">Your prompt and your journal, together.</h2>
              <p className="sub">
                Each day&apos;s prompt and questions remain beside your journal, so you can return to them as your
                thoughts unfold.
              </p>
              <ul className="bul">
                <li>
                  <i>
                    <Sun size={18} />
                  </i>
                  <div>
                    <b>Today&apos;s intention</b>
                    <span>A brief note offers context for the day&apos;s reflection.</span>
                  </div>
                </li>
                <li>
                  <i>
                    <Eye size={18} />
                  </i>
                  <div>
                    <b>Space to focus</b>
                    <span>No feeds, no pressure to share. Just a private place to think and write.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="stage" style={{ padding: 32 }} data-reveal="">
              <div className="ds">
                <div className="ds-r">
                  <span className="ds-o">Day 3 of 7</span>
                  <div className="ds-t serif">Among Other People</div>
                  <p>No one experiences life entirely alone. Even quiet lives are shaped by other people: family, friends, strangers.</p>
                  <p>Think about one interaction that stayed with you recently. Rather than what the other person did, notice your own experience.</p>
                  <div className="listen">
                    <i>
                      <Play size={12} fill="currentColor" />
                    </i>
                    <div className="bar">
                      <b />
                    </div>
                    <span>2:14</span>
                  </div>
                  <div className="ds-why">
                    <b style={{ color: "var(--foreground)", fontWeight: 600 }}>Today&apos;s intention.</b> Our
                    relationships become part of how we understand ourselves.
                  </div>
                </div>
                <div className="ds-w">
                  <span className="lab">Your reflection</span>
                  <div
                    className="txt"
                    data-type="At lunch Ana said she'd noticed I was quieter lately. I laughed it off, but I kept thinking about it on the way home."
                  >
                    <span data-type-text="">
                      At lunch Ana said she&apos;d noticed I was quieter lately. I laughed it off, but I kept thinking
                      about it on the way home
                    </span>
                    <span className="caret" />
                  </div>
                  <div className="ds-deep">
                    <Sparkles size={14} />
                    Go deeper
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="journal">
          <div className="w feat">
            <div className="feat-t" data-reveal="">
              <span className="over">
                <PenLine className="ai" size={14} aria-hidden="true" />
                Your Journal
              </span>
              <h2 className="h2 serif">Not every thought needs a prompt</h2>
              <p className="sub">
                Alongside guided journeys, HumanSoul gives you a private space to write freely. Start a new entry
                whenever you like, write whatever comes to mind, and organize your thoughts into journals of your
                own.
              </p>
              <ul className="bul">
                <li>
                  <i>
                    <Search size={18} />
                  </i>
                  <div>
                    <b>Find what you&apos;ve written</b>
                    <span>Search your entries, browse your personal journals, or filter by journey.</span>
                  </div>
                </li>
                <li>
                  <i>
                    <Heart size={18} />
                  </i>
                  <div>
                    <b>Keep what matters</b>
                    <span>Mark entries as favorites so you can easily return to them.</span>
                  </div>
                </li>
                <li>
                  <i>
                    <Camera size={18} />
                  </i>
                  <div>
                    <b>Add a photo</b>
                    <span>Keep an image of the moment alongside your words.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="stage" data-reveal="" style={{ ["--d" as string]: 1 }}>
              <div className="sheet">
                <span className="sheet-d">Today</span>
                <span className="sheet-t">Title</span>
                <span className="sheet-x" data-type="The light on the kitchen wall this morning.">
                  <span data-type-text="">What&apos;s on your mind today?</span>
                  <span className="caret" />
                </span>
                <div style={{ height: 150 }} />
                <div className="sheet-f">
                  <span>
                    <Camera size={13} />
                    Photo
                  </span>
                  <span>
                    <BookOpen size={13} />
                    Personal
                  </span>
                </div>
              </div>
              <div className="fl" style={{ right: 36, top: 48 }}>
                <Heart className="ai" size={16} fill="currentColor" />
                Kept in Favorites
              </div>
              <div className="fl" style={{ left: 36, bottom: 56 }}>
                <Lock className="ai" size={16} />
                Only you can read this
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="why">
          <div className="w">
            <div className="sec-head" data-reveal="">
              <span className="over">
                <Eye className="ai" size={14} aria-hidden="true" />
                What reflection offers
              </span>
              <h2 className="h2 serif">Sometimes, noticing is enough.</h2>
              <p className="sub">
                Reflection doesn&apos;t need to lead to a breakthrough or a clear answer. Sometimes, it&apos;s simply an
                opportunity to pay attention to what you experience, what feels familiar, and what might otherwise
                go unnoticed.
              </p>
            </div>
            <div className="ben">
              {[
                [Sun, "Notice the everyday", "A conversation, a passing thought, or a small moment you might otherwise overlook."],
                [Repeat, "Recognize familiar patterns", "An opportunity to notice habits, reactions, and ways of thinking without needing to change them."],
                [Clock, "Find your own rhythm", "A few minutes whenever it suits you. No schedule to keep or progress to measure."],
                [Layers, "Make room for mixed feelings", "Not everything you experience needs to make sense or fit into a simple explanation."],
                [Eye, "Consider another perspective", "An opportunity to look at familiar situations, beliefs, or experiences from a different angle."],
                [Compass, "Explore what matters to you", "Space to reflect on your values, relationships, and choices, without being told what they should mean."],
              ].map(([Icon, t, s], i) => {
                const I = Icon as typeof Sun;
                return (
                  <div className="bc" key={t as string} data-reveal="" style={{ ["--d" as string]: i % 3 }}>
                    <span className="bc-i">
                      <I size={20} aria-hidden="true" />
                    </span>
                    <b>{t as string}</b>
                    <span>{s as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {library.length > 0 && (
          <section className="sec">
            <div className="w">
              <div className="sec-head" data-reveal="">
                <span className="over">
                  <BookOpen className="ai" size={14} aria-hidden="true" />
                  The library
                </span>
                <h2 className="h2 serif" style={{ fontSize: 44 }}>
                  Journeys for the questions you carry
                </h2>
                <p className="sub">New journeys arrive as the library grows. Day one of every journey is free.</p>
              </div>
              <div className="lib">
                {library.map((j, i) => {
                  const days = daysOf(j);
                  return (
                    <Link
                      className="lc"
                      key={j.id}
                      href="/sign-up"
                      data-reveal=""
                      style={{ ["--d" as string]: i }}
                      aria-label={`${j.title}, start free`}
                    >
                      <img src={journeyImage(j)} alt="" loading="lazy" />
                      {i === 0 && (
                        <span className="lc-tag">
                          <Sparkles size={11} />
                          Featured
                        </span>
                      )}
                      <div className="lc-b">
                        {j.category && <span className="lc-o">{j.category}</span>}
                        <span className="lc-t">{j.title}</span>
                        <span className="lc-m">
                          {days ? `${days} days` : "A few days"}
                          {j.time_required ? ` · ${j.time_required}` : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {categories.length > 0 && (
                <div className="cats" data-reveal="">
                  {categories.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="sec" id="how">
          <div className="w">
            <div className="sec-head" data-reveal="">
              <span className="over">
                <Compass className="ai" size={14} aria-hidden="true" />
                How it works
              </span>
              <h2 className="h2 serif">A simple way to begin</h2>
            </div>
            <div className="steps">
              {[
                ["Choose a journey", "Explore the library and choose a subject that interests you."],
                ["Read, reflect, write", "Begin with a short reading, explore the day's questions, and write what comes to mind. Go deeper if you want."],
                ["Continue at your own pace", "Each new day becomes available when you complete the previous one. Take your time, and return whenever you're ready."],
              ].map(([t, s], i) => (
                <div className="st" key={t} data-reveal="" style={{ ["--d" as string]: i }}>
                  <span className="st-n">{i + 1}</span>
                  <b>{t}</b>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="privacy">
          <div className="w priv" data-reveal="">
            <div className="priv-l">
              <span className="over">
                <Lock className="ai" size={14} aria-hidden="true" />
                Privacy
              </span>
              <h2 className="h2 serif">Your words stay yours</h2>
              <p className="sub" style={{ marginLeft: 0 }}>
                A personal journal should feel like a place where you can write freely. HumanSoul is built with
                privacy at its core, giving you control over what you choose to keep.
              </p>
              <Link className="priv-more" href="/privacy">
                Read the Privacy Policy
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <ul className="priv-list">
              <li>
                <i>
                  <Lock size={18} />
                </i>
                <div>
                  <b>Private by default</b>
                  <span>Your reflections aren&apos;t public or shared with other users.</span>
                </div>
              </li>
              <li>
                <i>
                  <Shield size={18} />
                </i>
                <div>
                  <b>Never used to train AI</b>
                  <span>Your writing is not used to train AI models or for advertising.</span>
                </div>
              </li>
              <li>
                <i>
                  <Download size={18} />
                </i>
                <div>
                  <b>Export or delete</b>
                  <span>Download your writing or delete your entries whenever you choose.</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="sec" id="pricing">
          <div className="w">
            <div className="sec-head" data-reveal="">
              <span className="over">
                <Sparkles className="ai" size={14} aria-hidden="true" />
                Pricing
              </span>
              <h2 className="h2 serif" style={{ fontSize: 50 }}>
                Start free. Keep going with Plus.
              </h2>
            </div>
            <div className="price">
              <div className="pc" data-reveal="">
                <span className="pc-n">Free</span>
                <span className="pc-p">
                  <b>{currency}0</b>
                  <span>forever</span>
                </span>
                <span className="pc-note">No card needed</span>
                <ul>
                  <li>
                    <Check className="ai" size={16} />
                    Your Journal, unlimited
                  </li>
                  <li>
                    <Check className="ai" size={16} />
                    Day one of every journey
                  </li>
                  <li>
                    <Check className="ai" size={16} />
                    Favorites, search and export
                  </li>
                  <li className="off">
                    <Minus className="ai" size={16} />
                    The rest of each journey
                  </li>
                </ul>
                <Link className="btn btn-sec" href="/sign-up">
                  Start free
                </Link>
              </div>
              <div className="pc plus" data-reveal="" style={{ ["--d" as string]: 1 }}>
                <span className="pc-n">
                  Plus {save > 0 && <span className="save">Save {save}% yearly</span>}
                </span>
                <span className="pc-p">
                  <b>{year?.price}</b>
                  <span>a year</span>
                </span>
                <span className="pc-note">or {month?.price} a month · cancel any time</span>
                <ul>
                  <li>
                    <Check className="ai" size={16} />
                    Everything in Free
                  </li>
                  <li>
                    <Check className="ai" size={16} />
                    Every day of every journey
                  </li>
                  <li>
                    <Check className="ai" size={16} />
                    New journeys as they arrive
                  </li>
                  <li>
                    <Check className="ai" size={16} />
                    Go deeper questions on every day
                  </li>
                </ul>
                <Link className="btn btn-pri" href="/sign-up">
                  Try Plus
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="w">
            <div className="sec-head" data-reveal="">
              <h2 className="h2 serif">Questions</h2>
            </div>
            <LandingFaq />
          </div>
        </section>

        <section className="final" data-reveal="">
          <img src={finalPhoto} alt="" loading="lazy" />
          <span className="over" style={{ color: "#C9D8CB" }}>
            <PenLine className="ai" size={14} aria-hidden="true" />
            Your first page is waiting
          </span>
          <h2 className="h2 serif">Notice yourself, a little at a time</h2>
          <p className="sub">Start free in under a minute. No card, no streaks, no audience.</p>
          <div className="ctas">
            <Link className="btn btn-pri btn-lg" href="/sign-up">
              Start writing for free
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="foot-l">
          <span style={{ color: "var(--foreground)" }}>
            <Wordmark size={20} />
          </span>
          <span>A quiet place to notice yourself · © {new Date().getFullYear()} HumanSoul</span>
        </div>
        <div className="foot-r">
          <a href="#pricing">Pricing</a>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/sign-in">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
