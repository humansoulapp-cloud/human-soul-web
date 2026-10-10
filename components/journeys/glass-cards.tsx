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
}: {
  href: string;
  dayHref: string;
  image: string;
  category?: string | null;
  title: string;
  day: number;
  total: number;
  done: number;
  todayTitle: string;
}) {
  return (
    <article className="gl-card wide" aria-label="Continue your journey">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gl-bg" src={image} alt="" />
      <div className="gl-pblur" aria-hidden="true" />
      <div className="gl-scrim" aria-hidden="true" />
      <span className="gl-state">
        <Play size={14} fill="currentColor" aria-hidden="true" />
        In progress
      </span>
      <div className="gl-body">
        {category ? <span className="gl-kind">{category}</span> : null}
        <h3 className="text-h1 gl-title">
          <Link href={href}>{title}</Link>
        </h3>
        <div className="gl-ess">
          <SegmentProgress total={total} done={done} current={day} width={200} label={`Day ${day} of ${total}`} />
          <span className="gl-meta" aria-hidden="true">
            Day {day} of {total}
          </span>
        </div>
        <p className="text-body-lg gl-today">
          Today: <b>{todayTitle}</b>
        </p>
        <div>
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
  time,
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
  const meta = [days ? `${days} days` : null, time ? time.replace(/^About/, "about") : null].filter(Boolean).join(" · ");
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
      <div className="ct-body">
        {category ? <span className="ct-cat">{category}</span> : null}
        <h3 className="text-h3 ct-title">
          <Link className="ct-link" href={href}>
            {title}
          </Link>
        </h3>
        {tagline ? <p className="ct-tag">{tagline}</p> : null}
        <div className="ct-foot">
          <span className="ct-meta">{meta}</span>
          <span className="ct-go" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}
