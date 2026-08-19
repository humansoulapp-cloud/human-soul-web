/**
 * Plus pricing as it appears in the redesign. There is no payment provider
 * yet, so these are presentation-only until Stripe lands.
 */
export const PLANS = [
  { key: "month", label: "MONTHLY", price: "€4.99", note: "per month" },
  { key: "year", label: "YEARLY", price: "€39", note: "€3.25 / month" },
] as const;

export const PLUS_PERKS = [
  "Every journey in the library, including new ones each month",
  "All seven days of each journey, unlocked as you go",
  "Your complete journal history, kept and searchable",
];
