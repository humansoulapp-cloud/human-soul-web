/**
 * Page-to-page view transitions for the App Router.
 *
 * `transitionTo(push)` starts a view transition, navigates, and lets the
 * browser capture the new page once the destination calls `markPageReady()`
 * (or after a timeout, so a slow page never stays frozen). The destination is a
 * server page, so the wait covers its round trip; prefetching it shortens that. Elements that
 * share a `view-transition-name` on both pages morph from one to the other;
 * everything else cross-fades. Without support, or with reduced motion, it
 * simply navigates.
 */

type Doc = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } };

let pending: (() => void) | null = null;

export function transitionTo(push: () => void, timeoutMs = 2500) {
  const doc = document as Doc;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce || pending) return push();
  doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          if (pending === done) pending = null;
          resolve();
        };
        pending = done;
        push();
        setTimeout(done, timeoutMs);
      })
  );
}

/** Called by a destination page once its content is on screen. */
export function markPageReady() {
  if (!pending) return;
  const done = pending;
  // Let React paint the committed tree before the browser captures it.
  requestAnimationFrame(() => done());
}
