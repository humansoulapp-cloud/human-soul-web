/**
 * Journeys moved from internal codes (HS-J-001) to readable addresses
 * (/journeys/the-art-of-reflection) in November 2026. Links people saved, shared
 * or received by email still use the old codes, so they keep working here: the
 * journey page and the admin editor redirect an old code to its new address.
 *
 * When a journey's address is changed again in Admin, add the old one here too.
 */
export const LEGACY_JOURNEY_IDS: Record<string, string> = {
  "hs-j-001": "the-art-of-reflection",
  "hs-j-002": "living-authentically",
  "hs-j-003": "conversations-that-matter",
  "hs-j-004": "the-shape-of-a-feeling",
  "hs-j-005": "the-need-to-belong",
  "hs-j-008": "the-things-we-avoid",
  "hs-j-009": "what-makes-a-life-meaningful",
  "hs-j-10": "the-meaning-we-give-money",
  "hs-j-010": "the-weight-of-a-choice",
  "hs-j-011": "the-habits-that-become-us",
  "hs-j-015": "our-relationship-with-technology",
  "hs-j-016": "the-child-we-once-were",
  "hs-j-037": "courage-in-small-moments",
};

/** The current address for an old one, or null when it isn't a known old code. */
export function legacyJourneyId(id: string): string | null {
  const key = decodeURIComponent(id).trim().toLowerCase();
  return LEGACY_JOURNEY_IDS[key] ?? null;
}

/** A readable address from a title: "The Art of Reflection" → "the-art-of-reflection". */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
