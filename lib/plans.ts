/**
 * Plus pricing, in US dollars. There is no payment provider yet, so these are
 * presentation-only until Stripe lands. Change prices here only: every screen
 * (landing, subscription, profile, journey paywall) reads from this file.
 */
export const PLANS = [
  { key: "month", label: "MONTHLY", price: "$6.99", note: "per month" },
  { key: "year", label: "YEARLY", price: "$49.99", note: "$4.17 / month" },
] as const;

/** What the yearly plan saves against twelve monthly payments, rounded. */
export const YEARLY_SAVING = Math.round((1 - 49.99 / (6.99 * 12)) * 100);

export const PLUS_PERKS = [
  "Every journey in the library, and new ones as they arrive",
  "All seven days of each journey, one each morning",
];

/**
 * False during the beta: there is no payment provider, so nothing shows a price
 * or a checkout button inside the app. Flip it when Stripe is connected.
 */
export const BILLING_LIVE = false;

/**
 * Launch pricing (Nov 2026): one yearly price that depends on how many people have paid before.
 * The first 100 pay $29.99 for the first year, the next 100 pay $39.99. After that the last tier
 * stays until it is changed here. Renewal keeps the price each person joined at.
 */
export const LAUNCH_TIERS = [
  { tier: 1, upTo: 100, cents: 2999, name: "Founding member" },
  { tier: 2, upTo: 200, cents: 3999, name: "Early member" },
] as const;

/**
 * Full access needs payment: no free plan and no trial. People from the beta keep access until their date.
 * Switched on with NEXT_PUBLIC_PAYWALL=on in Vercel (Preview to test with Stripe test keys, Production at launch).
 */
export const PAYWALL = process.env.NEXT_PUBLIC_PAYWALL === "on";

export function launchOffer(sold: number) {
  const current = LAUNCH_TIERS.find((t) => sold < t.upTo) ?? LAUNCH_TIERS[LAUNCH_TIERS.length - 1];
  const next = LAUNCH_TIERS.find((t) => t.tier === current.tier + 1) ?? null;
  return {
    ...current,
    price: `$${(current.cents / 100).toFixed(2)}`,
    /** Spots left at this price, or null once the last tier is reached. */
    left: sold < current.upTo ? current.upTo - sold : null,
    nextPrice: next ? `$${(next.cents / 100).toFixed(2)}` : null,
  };
}
