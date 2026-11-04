"use client";

/**
 * Product events for PostHog (loaded in components/analytics/PostHog.tsx).
 * Never pass anything a person wrote: only ids, counts and yes/no facts.
 */
type Props = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props?: Props) {
  try {
    (window as unknown as { posthog?: { capture: (e: string, p?: Props) => void } }).posthog?.capture(event, props);
  } catch {}
}
