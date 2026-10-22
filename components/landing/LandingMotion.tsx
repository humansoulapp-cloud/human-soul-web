"use client";

import { useEffect } from "react";

/**
 * Motion for the landing page. Content is fully visible without it: the
 * hidden starting states only apply once `lp-js` is on <html>, which the
 * page sets inline before paint. Everything stops for reduced motion.
 */
export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal on scroll
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal], .jo, .ds");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in"));
    }
    const io = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                io?.unobserve(e.target);
              }
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
        );
    if (io) targets.forEach((el) => io.observe(el));

    // Nav glass, hero tilt and final image parallax
    const shot = root.querySelector<HTMLElement>(".shot");
    const final = root.querySelector<HTMLElement>(".final");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        root.classList.toggle("lp-scrolled", y > 8);
        if (reduce) return;
        if (shot) {
          const r = shot.getBoundingClientRect();
          const vh = window.innerHeight;
          // 1 when the shot's top sits at the bottom of the screen, 0 once it reaches 35% from the top
          const t = Math.min(1, Math.max(0, (r.top - vh * 0.35) / (vh * 0.65)));
          shot.style.setProperty("--tilt", t.toFixed(3));
        }
        if (final) {
          const r = final.getBoundingClientRect();
          const mid = r.top + r.height / 2 - window.innerHeight / 2;
          final.style.setProperty("--fy", (mid * -0.08).toFixed(1));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Typewriter for the writing mock-ups
    const timers: number[] = [];
    if (!reduce) {
      root.querySelectorAll<HTMLElement>("[data-type]").forEach((el, i) => {
        const full = el.dataset.type ?? "";
        const textNode = el.querySelector<HTMLElement>("[data-type-text]");
        if (!textNode || !full) return;
        let n = 0;
        let deleting = false;
        textNode.textContent = "";
        const tick = () => {
          if (!deleting) {
            n++;
            textNode.textContent = full.slice(0, n);
            if (n >= full.length) {
              deleting = true;
              timers.push(window.setTimeout(tick, 3200));
              return;
            }
            timers.push(window.setTimeout(tick, 38 + Math.random() * 60));
          } else {
            n = Math.max(0, n - 3);
            textNode.textContent = full.slice(0, n);
            if (n === 0) {
              deleting = false;
              timers.push(window.setTimeout(tick, 700));
              return;
            }
            timers.push(window.setTimeout(tick, 18));
          }
        };
        timers.push(window.setTimeout(tick, 1400 + i * 900));
      });
    }

    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return null;
}
