/**
 * A crisis line for where the person is, picked from their time zone (the
 * Profile setting, or the device's). Only national, free, 24/7 lines are listed;
 * anywhere else gets the local emergency number and the Find A Helpline directory.
 * Review this list before adding a country: a wrong number here is worse than none.
 */
export type CrisisLine = { title: string; note: string; href: string };

const LINES: { zones: RegExp; line: CrisisLine }[] = [
  {
    zones: /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky|North_Dakota|Juneau|Sitka|Nome|Adak|Yakutat|Metlakatla|Menominee|Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Whitehorse)|Pacific\/Honolulu)/,
    line: {
      title: "Call or text 988",
      note: "The 988 Suicide & Crisis Lifeline, free and open 24/7 in the US and Canada.",
      href: "tel:988",
    },
  },
  {
    zones: /^(Europe\/Madrid|Africa\/Ceuta|Atlantic\/Canary)$/,
    line: {
      title: "Call 024",
      note: "Línea 024, free and open 24/7 in Spain. In an emergency, call 112.",
      href: "tel:024",
    },
  },
  {
    zones: /^(Europe\/(London|Dublin|Belfast)|Europe\/(Guernsey|Jersey|Isle_of_Man))$/,
    line: {
      title: "Call 116 123",
      note: "Samaritans, free and open 24/7 in the UK and Ireland.",
      href: "tel:116123",
    },
  },
];

const FALLBACK: CrisisLine = {
  title: "Find a helpline near you",
  note: "Free, confidential lines by country. In an emergency, call your local emergency number.",
  href: "https://findahelpline.com",
};

export function crisisLine(timeZone: string | null | undefined): CrisisLine {
  const tz = timeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "");
  return LINES.find((l) => l.zones.test(tz))?.line ?? FALLBACK;
}
