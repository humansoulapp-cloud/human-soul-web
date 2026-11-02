/**
 * Page-to-page navigation with the app's single loading indicator.
 *
 * `transitionTo(push)` navigates straight away — the page is never frozen —
 * and runs the top bar (lib/progress) until the destination is on screen.
 * The destination calls `markPageReady()` once its content is there.
 */
import { endNavigation, startNavigation } from "@/lib/progress";

export function transitionTo(push: () => void) {
  startNavigation();
  push();
}

/** Called by a destination page once its content is on screen. */
export function markPageReady() {
  endNavigation();
}
