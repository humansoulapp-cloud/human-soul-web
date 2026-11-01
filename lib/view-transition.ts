/**
 * Light page-to-page transitions for the App Router.
 *
 * `transitionTo(push)` navigates straight away — the page is never frozen.
 * While the destination loads, the current page dims slightly and a thin bar
 * runs along the top, so the tap is acknowledged at once. When the destination
 * calls `markPageReady()` (or after a timeout), it fades in with a short rise.
 * With reduced motion, it simply navigates.
 */

const LEAVING = "pt-leaving";
const ENTERING = "pt-entering";
let safety: ReturnType<typeof setTimeout> | null = null;
let enterTimer: ReturnType<typeof setTimeout> | null = null;

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function transitionTo(push: () => void, timeoutMs = 4000) {
  if (reducedMotion()) return push();
  const root = document.documentElement;
  root.classList.remove(ENTERING);
  root.classList.add(LEAVING);
  if (safety) clearTimeout(safety);
  safety = setTimeout(markPageReady, timeoutMs);
  push();
}

/** Called by a destination page once its content is on screen. */
export function markPageReady() {
  const root = document.documentElement;
  if (!root.classList.contains(LEAVING)) return;
  if (safety) clearTimeout(safety);
  safety = null;
  root.classList.remove(LEAVING);
  root.classList.add(ENTERING);
  if (enterTimer) clearTimeout(enterTimer);
  enterTimer = setTimeout(() => root.classList.remove(ENTERING), 300);
}
