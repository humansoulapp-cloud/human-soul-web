"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { endNavigation, isLoading, startNavigation, subscribe } from "@/lib/progress";

/** Ends the current navigation once the new address is on screen. */
function RouteWatcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    endNavigation();
  }, [pathname, search]);
  return null;
}

/** Internal link clicks start the bar straight away, before the next page answers. */
function useLinkClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      startNavigation();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

type Phase = "idle" | "running" | "finishing";

export default function TopProgress() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = useRef(false);
  useLinkClicks();

  useEffect(() => {
    let wasLoading = false;
    const update = () => {
      const loading = isLoading();
      if (loading === wasLoading) return;
      wasLoading = loading;
      if (timer.current) clearTimeout(timer.current);
      if (loading) {
        if (!shown.current) setPhase("idle"); // restart from the left, never shrink back
        // Quick loads finish before the bar would show, so nothing flickers.
        timer.current = setTimeout(() => {
          shown.current = true;
          setPhase("running");
        }, 120);
      } else if (shown.current) {
        shown.current = false;
        setPhase("finishing");
        timer.current = setTimeout(() => setPhase("idle"), 400);
      }
    };
    const unsubscribe = subscribe(update);
    update();
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <RouteWatcher />
      </Suspense>
      <div className={`hs-progress hs-progress-${phase}`} aria-hidden="true" />
    </>
  );
}
