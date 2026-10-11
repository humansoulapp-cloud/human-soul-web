import React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Play } from "lucide-react";
import { SegmentProgress } from "@/components/ds";

/**
 * Glass journey cards from the canvas «HumanSoul - App V2»:
 * the photo fills the card and blurs progressively where the text sits.
 * Both cards keep only the essentials; secondary text is a softer white.
 */

/** A journey the person is in the middle of. Wide on desktop, stacked on mobile. */
export function JourneyProgressCard({
  href,
  dayHref,
  image,
  category,
  title,
  day,
  total,
  done,
  todayTitle,
  tagline,
  variant = "wide",
}: {
  href: string;
  dayHref: string;
  image: string;
  category?: string | null;
  title: string;
  day: number;
  total: number;
  done: number;
  /** The day to write today. Omit for a journey not started yet (Home offers it with its tagline). */
  todayTitle?: string | null;
  tagline?: string | null;
  /** "wide" on the Journeys page, "home" in the Home grid (button under the text, on the left). */
  variant?: "wide" | "home";
}) {
  const started = done > 0 || Boolean(todayTitle);
  return (
    <article className={`gl-card ${variant}`} aria-label={started ? "Continue your journey" : "Start a journey"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gl-bg" src={image} alt="" />
      <div className="gl-pblur" aria-hidden="true" />
      <div className="gl-scrim" aria-hidden="true" />
      {variant === "wide" ? (
        <span className="gl-state">
          <Play size={14} fill="currentColor" aria-hidden="true" />
          In progress
        </span>
      ) : null}
      <div className="gl-body">
        {category ? <span className="gl-kind">{category}</span> : null}
        <h3 className={`${variant === "wide" ? "text-h1" : "text-h2"} gl-title`}>
          <Link href={href}>{title}</Link>
        </h3>
        {started ? (
          <>
            <div className="gl-ess">
              <SegmentProgress total={total} done={done} current={day} width={variant === "wide" ? 200 : 168} label={`Day ${day} of ${total}`} />
              <span className="gl-meta" aria-hidden="true">
                Day {day} of {total}
              </span>
            </div>
            <p className="text-body-lg gl-today">
              Today: <b>{todayTitle}</b>
            </p>
          </>
        ) : tagline ? (
          <p className="text-body-lg gl-today">{tagline}</p>
        ) : null}
        <div className="gl-cta-row">
          <Link className="gl-cta" href={dayHref}>
            Begin Day {day}
            <span className="gl-cta-arrow" aria-hidden="true">
              <ArrowRight size={22} strokeWidth={2.2} />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/** One journey in the catalog. The whole card is the link. */
export function CatalogCard({
  href,
  image,
  category,
  title,
  tagline,
  days,
  featured,
  premium,
}: {
  href: string;
  image: string;
  category?: string | null;
  title: string;
  tagline?: string | null;
  days: number;
  time?: string | null;
  featured?: boolean | null;
  premium?: boolean | null;
}) {
  return (
    <article className="ct-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ct-bg" src={image} alt="" loading="lazy" />
      <div className="ct-pblur" aria-hidden="true" />
      <div className="ct-scrim" aria-hidden="true" />
      {featured || premium ? (
        <div className="ct-top">
          {featured ? <span className="ct-chip ct-feat">Featured</span> : null}
          {premium ? (
            <span className="ct-chip">
              <Lock size={12} aria-hidden="true" />
              Plus
            </span>
          ) : null}
        </div>
      ) : null}
      {days ? <span className="ct-chip ct-days">{days} days</span> : null}
      <div className="ct-body">
        {category ? <span className="ct-cat">{category}</span> : null}
        <h3 className="text-h3 ct-title">
          <Link className="ct-link" href={href}>
            {title}
          </Link>
        </h3>
        {tagline ? <p className="ct-tag">{tagline}</p> : null}
        <div className="ct-foot">
          <span className="ct-go" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}
