/**
 * Everything Home shows about a person's writing is derived from the
 * `reflections` table — there is no separate progress or streak table.
 * These helpers keep that derivation in one place.
 */

export type ReflectionRow = {
  id: string;
  content: string | null;
  tags: string[] | null;
  mood?: string | null;
  favorite?: boolean | null;
  created_at: string;
};

/** The prompts Home offers. Editable from Admin only once there's a table for them. */
export const PROMPTS = [
  "What did you almost overlook today?",
  "Which part of today would you describe differently to a stranger than to yourself?",
  "What has been asking for your attention that you keep postponing?",
  "When did you feel most like yourself today?",
];

/** Reflect offers its own set, including an opt-out of the question. */
export const REFLECT_PROMPTS = [
  "What caught your attention today?",
  "What did you almost overlook today?",
  "When did you feel most like yourself today?",
  "What are you carrying that is not yours to carry?",
  "Write freely. No question today.",
];

export const EMOTION_TAGS = [
  "Gratitude",
  "Calm",
  "Clarity",
  "Tired",
  "Hopeful",
  "Uncertain",
  "Peaceful",
  "Reflective",
];

export const MOODS = ["Calm", "Steady", "Grateful", "Restless", "Heavy", "Unsettled"];

/** Local-calendar day key, so a 23:50 entry counts for that day, not UTC's. */
export function dayKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function writtenDays(reflections: ReflectionRow[]) {
  return new Set(reflections.map((r) => dayKey(r.created_at)));
}

/**
 * Days written in a row, counting back from today. Today not being written
 * yet doesn't break the streak — it only stops counting at yesterday.
 */
export function currentStreak(days: Set<string>, today = new Date()) {
  let streak = 0;
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(days: Set<string>) {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const key of sorted) {
    run = previous && dayKey(addDays(new Date(`${previous}T12:00:00`), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

/** The seven days ending today — today is always the last dot, as in the design. */
export function weekDots(days: Set<string>, today = new Date()) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return {
      key: dayKey(date),
      label: labels[date.getDay()],
      done: days.has(dayKey(date)),
      isToday: i === 6,
    };
  });
}

/** How many distinct journeys the person has written in, via reflection tags. */
export function journeysTouched(reflections: ReflectionRow[], journeyTitles: string[]) {
  const titles = new Set(journeyTitles);
  const seen = new Set<string>();
  for (const r of reflections) {
    for (const tag of r.tags ?? []) if (titles.has(tag)) seen.add(tag);
  }
  return seen.size;
}

/**
 * `reflections` has no title column. The first line doubles as one when it
 * reads like a heading; otherwise we take the opening words and leave the
 * rest as the snippet.
 */
export function titleAndSnippet(content: string | null) {
  const text = (content ?? "").trim();
  if (!text) return { title: "Untitled entry", snippet: "" };

  const [firstLine, ...rest] = text.split("\n").map((l) => l.trim());
  const body = rest.filter(Boolean).join(" ");

  if (firstLine.length <= 60 && body) {
    return { title: firstLine, snippet: body };
  }

  const words = firstLine.split(/\s+/);
  const title = words.slice(0, 6).join(" ") + (words.length > 6 ? "…" : "");
  const snippet = [words.slice(6).join(" "), body].filter(Boolean).join(" ");
  return { title, snippet };
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** An entry from around this date a year ago, within a few days either side. */
export function oneYearAgo(reflections: ReflectionRow[], today = new Date(), windowDays = 4) {
  const target = new Date(today);
  target.setFullYear(target.getFullYear() - 1);
  const span = windowDays * 24 * 60 * 60 * 1000;

  let closest: ReflectionRow | null = null;
  let closestDistance = Infinity;

  for (const r of reflections) {
    const distance = Math.abs(new Date(r.created_at).getTime() - target.getTime());
    if (distance <= span && distance < closestDistance) {
      closest = r;
      closestDistance = distance;
    }
  }
  return closest;
}

export type JourneyDay = { day: number; title: string; prompt: string };
export type Journey = {
  id: string;
  title: string;
  category: string | null;
  tagline: string | null;
  image_url: string | null;
  status?: string | null;
  scheduled_publish_at?: string | null;
  featured?: boolean | null;
  premium?: boolean | null;
  journey_days: JourneyDay[];
};

export type ActiveJourney = {
  journey: Journey;
  completedDays: number;
  totalDays: number;
  nextDay: JourneyDay;
};

const DAY_TAG = /^Day (\d+)$/;

/**
 * Progress lives implicitly in `reflections`: each journey reflection is
 * tagged with the journey title and `Day N` (see JourneyDetailClient).
 */
export function findActiveJourney(journeys: Journey[], reflections: ReflectionRow[]): ActiveJourney | null {
  const byTitle = new Map(journeys.map((j) => [j.title, j]));
  const seen = new Set<string>();

  // reflections arrive newest-first, so the first match is the latest activity
  for (const r of reflections) {
    const tags: string[] = r.tags ?? [];
    const journey = tags.map((t) => byTitle.get(t)).find(Boolean);
    if (!journey || seen.has(journey.id)) continue;
    seen.add(journey.id);

    const days = [...(journey.journey_days ?? [])].sort((a, b) => a.day - b.day);
    if (days.length === 0) continue;

    const daysDone = reflections
      .filter((x) => (x.tags ?? []).includes(journey.title))
      .map((x) => {
        const tag = (x.tags ?? []).map((t) => DAY_TAG.exec(t)).find(Boolean);
        return tag ? Number(tag[1]) : 0;
      });

    const completedDays = Math.max(0, ...daysDone);
    const nextDay = days.find((d) => d.day > completedDays);

    // finished journeys are no longer "in progress" — keep looking
    if (!nextDay) continue;

    return { journey, completedDays, totalDays: days.length, nextDay };
  }

  return null;
}
