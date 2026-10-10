/**
 * Shared helpers for showing and saving reflections (Design System v2).
 */
import type { createClient } from "@/lib/supabase/client";
import { titleAndSnippet, type ReflectionRow, type UserJournal } from "@/lib/journal";

export type Reflection = ReflectionRow & {
  title?: string | null;
  journey_id?: string | null;
  journey_day?: number | null;
  journey_title?: string | null;
  updated_at?: string | null;
};

const DAY_TAG = /^Day (\d+)$/;
type SupabaseClient = ReturnType<typeof createClient>;
export const PHOTO_BUCKET = "reflection-photos";

/** Journey entries carry [journey title, "Day N"] in their tags. */
export function journeyInfo(entry: Reflection): { title: string; day: number } | null {
  const tags = entry.tags ?? [];
  const dayTag = tags.find((t) => DAY_TAG.test(t));
  if (entry.journey_title && entry.journey_day) return { title: entry.journey_title, day: entry.journey_day };
  if (!dayTag) return null;
  const title = tags.find((t) => t !== dayTag && !DAY_TAG.test(t));
  if (!title) return null;
  return { title, day: Number(DAY_TAG.exec(dayTag)?.[1] ?? 0) };
}

/** Body text without the "[Journey - Day N: Title]" header journey entries are saved with. */
export function entryBody(content: string | null) {
  const text = (content ?? "").trim();
  if (text.startsWith("[") && text.includes("]")) return text.slice(text.indexOf("]") + 1).trim();
  return text;
}

/**
 * The title to show. New entries have a `title`; older ones fall back to the
 * journey day title (from the header) or the first words of the text.
 */
export function entryTitle(entry: Reflection) {
  if (entry.title && entry.title.trim()) return entry.title.trim();
  const text = (entry.content ?? "").trim();
  if (text.startsWith("[") && text.includes("]")) {
    const header = text.slice(1, text.indexOf("]"));
    if (header.includes(":")) return header.slice(header.indexOf(":") + 1).trim();
  }
  return titleAndSnippet(entryBody(entry.content)).title;
}

/** Which journal an entry belongs to: by `journal_id`, or by the journal's title in its tags. */
export function journalOf(entry: Reflection, journals: UserJournal[]) {
  if (entry.journal_id) {
    const byId = journals.find((j) => j.id === entry.journal_id);
    if (byId) return byId;
  }
  const tags = entry.tags ?? [];
  return journals.find((j) => tags.includes(j.title)) ?? null;
}

export function inJournal(entry: Reflection, journal: UserJournal) {
  return entry.journal_id === journal.id || (entry.tags ?? []).includes(journal.title);
}

/** The one label under a reflection: its journal, or "Journey · Day N". */
export function entryLabels(entry: Reflection, journals: UserJournal[]) {
  const journey = journeyInfo(entry);
  if (journey) return [`${journey.title} · Day ${journey.day}`];
  const journal = journalOf(entry, journals);
  return [journal ? journal.title : "Free writing"];
}

export function longDate(iso: string, withTime = true) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (!withTime) return date;
  return `${date} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

/** "Today · October 10", "Yesterday · October 9", "October 8". */
export function dayGroupLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const label = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const withYear = d.getFullYear() !== now.getFullYear() ? `${label}, ${d.getFullYear()}` : label;
  if (sameDay(d, now)) return `Today · ${label}`;
  if (sameDay(d, yesterday)) return `Yesterday · ${label}`;
  return withYear;
}

/* ── Photos ─────────────────────────────────────────────────────
   Older entries store the photo inline as a data URL. New photos go to the
   private `reflection-photos` bucket under `<user id>/…`, and the row keeps
   only the file path, which is turned into a short-lived signed URL. */

export function isStoredPhoto(photo: string | null | undefined): photo is string {
  return Boolean(photo && !photo.startsWith("data:") && !/^https?:\/\//.test(photo));
}

export async function resolvePhotos(supabase: SupabaseClient, entries: Reflection[]) {
  const paths = entries.map((e) => e.photo).filter(isStoredPhoto);
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
    for (const item of data ?? []) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  const out: Record<string, string> = {};
  for (const e of entries) {
    if (!e.photo) continue;
    out[e.id] = isStoredPhoto(e.photo) ? urls[e.photo] ?? "" : e.photo;
  }
  return out;
}

export async function uploadPhoto(supabase: SupabaseClient, userId: string, file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function removeStoredPhoto(supabase: SupabaseClient, photo: string | null | undefined) {
  if (isStoredPhoto(photo)) await supabase.storage.from(PHOTO_BUCKET).remove([photo]);
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
