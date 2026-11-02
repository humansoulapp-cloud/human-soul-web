/**
 * One loading indicator for the whole app: a thin bar along the top.
 *
 * It runs while a navigation is under way (`startNavigation`, also started
 * automatically by clicks on internal links) and while a screen gathers its
 * data (`PageLoader` registers itself with `addBusy`). `components/TopProgress`
 * draws it and ends the navigation when the address changes.
 */

type Listener = () => void;

let navigating = false;
let busy = 0;
let safety: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isLoading() {
  return navigating || busy > 0;
}

export function startNavigation() {
  navigating = true;
  if (safety) clearTimeout(safety);
  // A navigation that never lands (error, same page) must not leave the bar running.
  safety = setTimeout(endNavigation, 10000);
  emit();
}

export function endNavigation() {
  if (safety) clearTimeout(safety);
  safety = null;
  if (!navigating) return;
  navigating = false;
  emit();
}

/** A screen is gathering its data; call the returned function when it's done. */
export function addBusy() {
  busy += 1;
  emit();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    busy -= 1;
    emit();
  };
}
