"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A section with a horizontal, scroll-snapping row of cards. The next card
 * peeks in to show there is more; the arrows in the header page through it.
 */
export function CarouselSection({
  id,
  title,
  moreHref,
  moreLabel,
  variant = "cards",
  children,
}: {
  id: string;
  title: string;
  moreHref?: string;
  moreLabel?: string;
  /** "cards" for tall journey cards, "notes" for the compact reflection cards. */
  variant?: "cards" | "notes";
  children: React.ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = row.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const scrollable = !(atStart && atEnd);

  return (
    <section className="hs-sec" aria-labelledby={id}>
      <div className="hs-sec-head" style={{ alignItems: "center" }}>
        <h2 id={id} className="text-h3" style={{ margin: 0 }}>
          {title}
        </h2>
        <div className="cr-nav">
          {moreHref ? (
            <Link className="hs-more" href={moreHref}>
              {moreLabel}
            </Link>
          ) : null}
          {scrollable ? (
            <>
              <button type="button" className="cr-btn" aria-label={`Previous ${title.toLowerCase()}`} disabled={atStart} onClick={() => page(-1)}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" className="cr-btn" aria-label={`Next ${title.toLowerCase()}`} disabled={atEnd} onClick={() => page(1)}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div ref={row} className={`cr cr-${variant}`} role="list" aria-label={title}>
        {React.Children.map(children, (child) => (child ? <div role="listitem">{child}</div> : null))}
      </div>
    </section>
  );
}
