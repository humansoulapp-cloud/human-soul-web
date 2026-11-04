import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Compass,
  Download,
  Eye,
  Heart,
  Lock,
  PenLine,
  Repeat,
  Search,
  Shield,
  Sparkles,
  Sun,
} from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";
import { createPublicClient } from "@/lib/supabase/public";
import { journeyImage } from "@/lib/journey-images";
import LandingFaq from "@/components/landing-faq";
import LandingMotion from "@/components/landing/LandingMotion";
import BetaRequest from "@/components/landing/BetaRequest";
import { getBetaSeats } from "@/lib/actions/beta";
import { createServiceClient } from "@/lib/supabase/service";
import "./landing.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "HumanSoul · A quiet place to notice yourself" },
  openGraph: {
    siteName: "HumanSoul",
    title: "HumanSoul · A quiet place to notice yourself",
    description: "A library of guided reflective journeys and a private journal. Write a little, notice a lot.",
    images: ["/landing/final.jpg"],
    type: "website",
  },
  description:
    "A library of guided reflective journeys and a private journal. Write a little, notice a lot.",
};

/* Sets the class that enables the entrance and scroll animations before the
   first paint, so content never flashes in and then hides. */
const MOTION_FLAG = `document.documentElement.classList.add("lp-js")`;

const Wordmark = ({ size = 22 }: { size?: number }) => (
  <span style={{ fontSize: size, lineHeight: 1, whiteSpace: "nowrap" }}>
    <span className="wm-a">Human</span>
    <span className="wm-b">Soul</span>
  </span>
);

function daysOf(j: JourneyRow) {
  return Array.isArray(j.journey_days) ? j.journey_days.length : 0;
}

export default async function LandingPage() {
  let journeys: JourneyRow[] = [];
  // No cookies here: reading them inside try/catch made the static render throw and fall back to an empty library.
  try {
    const { data } = await createPublicClient()
      .from("journeys")
      .select("*, journey_days(*)")
      .order("created_at", { ascending: true });
    const now = Date.now();
    journeys = ((data ?? []) as JourneyRow[]).filter((j) => {
      const status = j.status || "published";
      if (status === "published") return true;
      return status === "scheduled" && Boolean(j.scheduled_publish_at) && new Date(j.scheduled_publish_at!).getTime() <= now;
    });
  } catch {
    journeys = [];
  }
  // Open beta: first come, first served, until the seats run out.
  const seats = await getBetaSeats();
  const total = seats?.total ?? 30;
  const open = Boolean(seats?.open && seats.left > 0);
  const ctaHref = open ? "/sign-up" : "#join";
  const ctaLabel = open ? "Join the beta" : "Request beta access";
  const seatsLine = !seats ? `Limited to ${total} people` : seats.left > 0 ? `${seats.left} of ${total} spots left` : "The beta is full";

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
  const finalPhoto = "/landing/final.jpg";
  const featuredTitle = featured?.title ?? "Becoming More Human";
  const featuredCategory = featured?.category ?? "Human Soul Foundations";
  const featuredDays = featured ? daysOf(featured) || 7 : 7;
  // The phone mock-up shows a real day from "What makes a life meaningful" when it's in the library.
  // Matched loosely (the title may be spelled "meanful") and read with the service client, so it shows even if it isn't published yet.
  const isPhoneJourney = (t?: string) => /life/i.test(t ?? "") && /mean/i.test(t ?? "");
  let phoneJourney: JourneyRow | undefined = journeys.find((j) => isPhoneJourney(j.title));
  if (!phoneJourney) {
    try {
      const { data } = await createServiceClient()
        .from("journeys")
        .select("*, journey_days(*)")
        .ilike("title", "%life%")
        .ilike("title", "%mean%")
        .limit(1);
      phoneJourney = (data?.[0] as JourneyRow | undefined) ?? undefined;
    } catch {
      phoneJourney = undefined;
    }
  }
  phoneJourney = phoneJourney ?? featured;
  const phoneDays = phoneJourney ? [...(phoneJourney.journey_days ?? [])].sort((a, b) => a.day - b.day) : [];
  const phoneDay = phoneDays.find((d) => d.day === 3) ?? phoneDays[0];
  const firstSentences = (text?: string) => {
    const t = (text ?? "").replace(/\s+/g, " ").trim();
    const parts = t.match(/[^.!?]+[.!?]+/g) ?? (t ? [t] : []);
    return parts.slice(0, 2).join(" ").trim();
  };
  const phoneTitle = phoneJourney?.title ?? featuredTitle;
  const phonePhoto = phoneJourney ? img(phoneJourney) : heroPhoto;
  const phoneTotal = phoneJourney ? daysOf(phoneJourney) || 7 : featuredDays;
  const phoneDayTitle = phoneDay?.title ?? "Among Other People";
  const phonePrompt =
    firstSentences(phoneDay?.prompt) ||
    "Think about one interaction that stayed with you recently. It does not need to have been dramatic.";

  return (
    <div className="lp dark" data-theme="dark">
      <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
      <LandingMotion />
      <div className="hero-bg" aria-hidden="true">
        <img src={finalPhoto} alt="" />
      </div>

      <header className="nav">
        <div className="nav-in">
          <Link className="logo" href="/" aria-label="HumanSoul home">
            <Wordmark />
          </Link>
          <nav className="links" aria-label="Main">
            <a href="#journeys">Journeys</a>
            <a href="#journal">Journal</a>
            <a href="#beta">Beta</a>
          </nav>
          <div className="nav-r">
            <Link className="signin" href="/sign-in">
              Sign in
            </Link>
            <a className="btn btn-pri" href={ctaHref}>
              {ctaLabel}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-in">
            <span className="over">
              A quiet place to notice yourself
            </span>
            <h1 className="h1 serif">Write a little. Notice a lot.</h1>
            <p className="lede">
              Guided reflective journeys that help you notice yourself.
              <br />
              What you make of it is entirely yours.
            </p>
            <div className="ctas">
              <a className="btn btn-pri btn-lg" href={ctaHref}>
                {ctaLabel}
              </a>
              <a className="btn btn-sec btn-lg" href="#journeys">
                See how it works
              </a>
            </div>
            <p className="fine">
              <b>{seatsLine}</b>
              <br />
              90 days free · No card needed
            </p>
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
                    </div>
                  </div>
                </div>
              </div>

              <div className="phone">
                <div className="ph-in">
                  <div className="ph-img">
                    <img src={phonePhoto} alt="" />
                    <div className="ph-top">
                      <span>
                        Day {phoneDay?.day ?? 3} of {phoneTotal}
                      </span>
                    </div>
                  </div>
                  <div className="ph-b">
                    <span className="ph-o">{phoneTitle}</span>
                    <span className="ph-t serif">{phoneDayTitle}</span>
                    <span className="ph-p">{phonePrompt}</span>
                    <div className="ph-box" data-type="Lately I've noticed the small, ordinary moments matter most to me.">
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


        <section className="sec" id="journeys">
          <div className="w feat">
            <div className="feat-t" data-reveal="">
              <span className="over">
                Guided journeys
              </span>
              <h2 className="h2 serif">
                A closer look,
                <br />
                one day at a time.
              </h2>
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
                  The library
                </span>
                <h2 className="h2 serif" style={{ fontSize: 44 }}>
                  Journeys for the questions you carry
                </h2>
                <p className="sub">New journeys arrive as the library grows. Beta participants can open every one.</p>
              </div>
              <div className="lib">
                {library.map((j, i) => {
                  const days = daysOf(j);
                  return (
                    <a
                      className="lc"
                      key={j.id}
                      href="#join"
                      data-reveal=""
                      style={{ ["--d" as string]: i }}
                      aria-label={`${j.title}, request beta access`}
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
                        </span>
                      </div>
                    </a>
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


        <section className="sec" id="privacy">
          <div className="w priv" data-reveal="">
            <div className="priv-l">
              <span className="over">
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


        <section className="sec" id="beta">
          <div className="w bt">
            <div className="bt-l" data-reveal="">
              <span className="over">
                The HumanSoul beta
              </span>
              <h2 className="h2 serif">
                A small beginning,
                <br />
                shaped together.
              </h2>
              <p className="bt-lead">
                {`Our first 90-day beta has ${total} spots, first come, first served, with full access to everything, free of charge.`}
              </p>
              <p className="bt-sub">In return, we&apos;ll ask for your honest feedback on what works and what could be better.</p>
              <div className="bt-stats">
                <div>
                  <b>90</b>
                  <span>days of full access</span>
                </div>
                <div>
                  <b>7</b>
                  <span>days per journey</span>
                </div>
                <div>
                  <b>1</b>
                  <span>new day at a time</span>
                </div>
              </div>
            </div>
            <div className="bt-r">
              <div className="bt-c plus" data-reveal="">
                <span className="bt-n">What you&apos;ll receive</span>
                <ul>
                  {["90 days of free access", "Every guided journey", "Your private journal", "All available features"].map((t) => (
                    <li key={t}>
                      <Check className="ai" size={18} aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bt-c" data-reveal="" style={{ ["--d" as string]: 1 }}>
                <span className="bt-n">What we&apos;ll ask</span>
                <ul>
                  {["Explore at your own pace", "Share honest feedback", "Answer a few short surveys"].map((t) => (
                    <li key={t}>
                      <Check className="ai" size={18} aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
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

        <section className="final" id="join" data-reveal="">
          <img src={finalPhoto} alt="" loading="lazy" />
          <span className="final-mark" aria-label="HumanSoul">
            <Wordmark size={30} />
          </span>
          <h2 className="h2 serif">Notice yourself, a little at a time.</h2>
          <p className="sub" style={{ maxWidth: "none" }}>
            {`We're beginning with a small group of ${total} people.`}
            <br />
            If HumanSoul feels like something you&apos;d like to explore, we&apos;d love to invite you into our first beta.
          </p>
          <div className="final-req">
            {open ? (
              <div className="final-open">
                <Link className="btn btn-pri btn-lg" href="/sign-up">
                  Join the beta
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <span className="final-seats">
                  <b>{seatsLine}</b>
              <br />
              90 days free · No card needed
                </span>
              </div>
            ) : (
              <BetaRequest />
            )}
          </div>
          <footer className="final-foot">
            <span>© {new Date().getFullYear()} HumanSoul</span>
            <nav aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:hello@humansoul.co">Contact</a>
            </nav>
          </footer>
        </section>
      </main>
    </div>
  );
}
