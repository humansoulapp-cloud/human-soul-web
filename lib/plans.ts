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
  "Every journey in the library, including new ones each month",
  "All seven days of each journey, unlocked as you go",
  "Your complete journal history, kept and searchable",
];
