import type { Journey } from "@/lib/journal";

/**
 * "What brings you to HumanSoul?" (onboarding). The answers are saved in
 * profiles.preferences.onboarding.intents and used by the Home tour to suggest
 * a first journey.
 */
export const INTENTS = [
  { key: "slow", title: "Slow down", sub: "A quiet pause in a busy day", chip: "Slow down", words: ["calm", "presence", "present", "slow", "rest", "still", "awareness", "attention", "foundations"] },
  { key: "self", title: "Understand myself better", sub: "Notice patterns in how I think and feel", chip: "Understand myself", words: ["identity", "self", "pattern", "inner", "discovery", "awareness", "emotion", "foundations"] },
  { key: "grateful", title: "Feel more grateful", sub: "Keep track of the good things", chip: "Feel more grateful", words: ["gratitude", "grateful", "kindness", "joy", "appreciation", "wonder"] },
  { key: "hard", title: "Get through a hard time", sub: "Put what I'm carrying into words", chip: "A hard time", words: ["uncertainty", "grief", "loneliness", "loss", "fear", "courage", "heavy", "pain", "emotion"] },
  { key: "habit", title: "Build a writing habit", sub: "Write a little, most days", chip: "A writing habit", words: ["foundations", "practice", "daily", "habit", "beginning"] },
  { key: "curious", title: "Just curious", sub: "Show me what this is", chip: "", words: [] },
] as const;

export type IntentKey = (typeof INTENTS)[number]["key"];

/** Which of the chosen intents a journey speaks to, from its category, title and tagline. */
export function fits(j: Journey, intents: readonly string[]) {
  const text = `${j.category ?? ""} ${j.title} ${j.tagline ?? ""}`.toLowerCase();
  return INTENTS.filter((i) => intents.includes(i.key) && i.chip && i.words.some((w) => text.includes(w)));
}

/**
 * Journeys ranked for a first pick: the best fit with the person's intents
 * first, then open-to-everyone ones (when the person has no full access),
 * then featured ones.
 */
export function rankForFirstPick(journeys: Journey[], intents: readonly string[], fullAccess: boolean) {
  return journeys
    .map((j, i) => ({
      j,
      score: fits(j, intents).length * 2 + (fullAccess || !j.premium ? 1.5 : 0) + (j.featured ? 0.5 : 0) - i * 0.001,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.j);
}
