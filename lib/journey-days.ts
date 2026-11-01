/**
 * Journey days open one per morning.
 *
 * Day 1 is always open. Each later day opens the first morning after the day
 * before it was written, in the person's time zone. A "morning" starts at 5:00,
 * the same hour the Home greeting switches to "Good morning", so writing Day 2
 * at 1:00 still counts as the night before.
 */
export const DAY_STARTS_AT_HOUR = 5;

/** The calendar day (YYYY-MM-DD) a moment belongs to, once the day starts at 5:00. */
export function journeyDayStamp(at: Date | string, timeZone?: string | null): string {
  const shifted = new Date(new Date(at).getTime() - DAY_STARTS_AT_HOUR * 60 * 60 * 1000);
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  try {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone: timeZone || undefined }).format(shifted);
  } catch {
    /* An unknown time zone name falls back to the runtime's own. */
    return new Intl.DateTimeFormat("en-CA", options).format(shifted);
  }
}

/** True once a new morning has come since the previous day was written. */
export function nextDayHasOpened(previousWrittenAt: string, timeZone?: string | null, now: Date = new Date()) {
  return journeyDayStamp(previousWrittenAt, timeZone) < journeyDayStamp(now, timeZone);
}

/**
 * The server only uses this to decide which days' text it sends. When the
 * person hasn't saved a time zone, it uses the earliest one on Earth, so a day
 * is never held back on the server longer than on the person's own screen.
 */
export const EARLIEST_TIME_ZONE = "Pacific/Kiritimati";
