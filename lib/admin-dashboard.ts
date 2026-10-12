/**
 * Admin dashboard metrics, all derived from what the app already stores:
 * profiles (sign-up date, plan, reminder) and reflections (who wrote, when,
 * which journey day). Nothing personal leaves this file: only totals.
 *
 * Server-only (service client). The admin layout has already checked the role.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { getJourneys } from "@/lib/actions/journeys";
import { getJourneyPerformance } from "@/lib/actions/users";

const DAY = 86_400_000;
const TZ = "Europe/Madrid";

type Profile = { user_id: string; created_at: string; plan?: string | null; reminder_hour?: number | null };
type Entry = { user_id: string; created_at: string; tags: string[] | null; content?: string | null; photo?: string | null };

/* PostgREST returns at most 1000 rows per request, so read in pages. */
async function readAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error || !data) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

export type Delta = { text: string; good: boolean; dir: "up" | "down" | "flat" } | null;

function pctDelta(now: number, before: number): Delta {
  if (!before) return now ? { text: "new", good: true, dir: "up" } : null;
  const d = Math.round(((now - before) / before) * 100);
  return { text: `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)}%`, good: d >= 0, dir: d > 0 ? "up" : d < 0 ? "down" : "flat" };
}
function ptsDelta(now: number | null, before: number | null): Delta {
  if (now === null || before === null) return null;
  const d = Math.round(now - before);
  return { text: `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)} pts`, good: d >= 0, dir: d > 0 ? "up" : d < 0 ? "down" : "flat" };
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export async function getDashboard(period: 7 | 30 | 90) {
  const db = createServiceClient();
  const now = Date.now();
  const since = new Date(now - 130 * DAY).toISOString();

  const [profiles, entries, recent, journeys, performance] = await Promise.all([
    readAll<Profile>((a, b) => db.from("profiles").select("*").range(a, b)),
    readAll<Entry>((a, b) => db.from("reflections").select("user_id, created_at, tags").gte("created_at", since).order("created_at").range(a, b)),
    readAll<Entry>((a, b) =>
      db
        .from("reflections")
        .select("user_id, created_at, tags, content, photo")
        .gte("created_at", new Date(now - period * DAY).toISOString())
        .range(a, b)
    ),
    getJourneys({ includeAll: true }),
    getJourneyPerformance(),
  ]);

  // First entry ever, per person (not only the last 130 days).
  const firsts = await readAll<{ user_id: string; created_at: string }>((a, b) =>
    db.from("reflections").select("user_id, created_at").order("created_at").range(a, b)
  );
  const firstAt = new Map<string, number>();
  for (const r of firsts) if (!firstAt.has(r.user_id)) firstAt.set(r.user_id, Date.parse(r.created_at));

  const times = entries.map((e) => ({ u: e.user_id, t: Date.parse(e.created_at), tags: e.tags ?? [] }));
  const writersIn = (from: number, to: number) => {
    const s = new Set<string>();
    for (const e of times) if (e.t >= from && e.t < to) s.add(e.u);
    return s;
  };
  const signup = new Map(profiles.map((p) => [p.user_id, Date.parse(p.created_at)]));

  /* ── Weekly active writers, 12 weeks ── */
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * DAY;
    return { end, count: writersIn(end - 7 * DAY, end).size };
  });
  const waw = weeks[11].count;
  const wawDelta = pctDelta(waw, weeks[10].count);

  /* ── Sign-ups ── */
  const signupsIn = (from: number, to: number) => profiles.filter((p) => {
    const t = Date.parse(p.created_at);
    return t >= from && t < to;
  });
  const signups = signupsIn(now - period * DAY, now).length;
  const signupsDelta = pctDelta(signups, signupsIn(now - 2 * period * DAY, now - period * DAY).length);
  const signupSpark = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * DAY;
    return signupsIn(end - 7 * DAY, end).length;
  });

  /* ── Activation: first entry within 24 h of signing up ── */
  const activation = (from: number, to: number) => {
    // Only people who have had their full 24 hours.
    const people = signupsIn(from, Math.min(to, now - DAY));
    const active = people.filter((p) => {
      const f = firstAt.get(p.user_id);
      return f !== undefined && f - Date.parse(p.created_at) <= DAY;
    });
    return { rate: pct(active.length, people.length), n: people.length };
  };
  const act = activation(now - period * DAY - DAY, now);
  const actPrev = activation(now - 2 * period * DAY - DAY, now - period * DAY - DAY);
  const actSpark = Array.from({ length: 12 }, (_, i) => {
    const end = now - (11 - i) * 7 * DAY;
    return activation(end - 7 * DAY, end).rate ?? 0;
  });

  /* ── Coming back: weekly ÷ monthly writers ── */
  const stickiness = (end: number) => pct(writersIn(end - 7 * DAY, end).size, writersIn(end - 30 * DAY, end).size);
  const back = stickiness(now);
  const backPrev = stickiness(now - 7 * DAY);
  const backSpark = Array.from({ length: 12 }, (_, i) => stickiness(now - (11 - i) * 7 * DAY) ?? 0);

  /* ── Journeys finished ── */
  const live = journeys.filter((j) => j.status === "published" || (j.status === "scheduled" && j.scheduled_publish_at && Date.parse(j.scheduled_publish_at) <= now));
  const liveIds = new Set(live.map((j) => j.id));
  const livePerf = performance.filter((p) => liveIds.has(p.id));
  const starts = livePerf.reduce((s, p) => s + p.starts, 0);
  const finishedAll = livePerf.reduce((s, p) => s + p.finished, 0);
  const finishedRate = pct(finishedAll, starts);

  /* ── Funnel: people who signed up in the period ending two weeks ago ── */
  const fEnd = now - 14 * DAY;
  const fStart = fEnd - period * DAY;
  const cohort = signupsIn(fStart, fEnd);
  const userDays = new Map<string, number[]>();
  for (const e of times) userDays.set(e.u, [...(userDays.get(e.u) ?? []), e.t]);
  const wroteFirst = cohort.filter((p) => firstAt.has(p.user_id));
  const secondDay = wroteFirst.filter((p) => {
    const ds = new Set((userDays.get(p.user_id) ?? []).map((t) => new Date(t).toISOString().slice(0, 10)));
    return ds.size >= 2;
  });
  const week2 = cohort.filter((p) => {
    const s = Date.parse(p.created_at);
    return (userDays.get(p.user_id) ?? []).some((t) => t >= s + 7 * DAY && t < s + 14 * DAY);
  });
  const funnel = [
    { label: "Signed up", n: cohort.length },
    { label: "Wrote a first entry", n: wroteFirst.length },
    { label: "Wrote on a second day", n: secondDay.length },
    { label: "Still writing in week 2", n: week2.length },
  ];
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });
  const funnelRange = `${fmt(fStart)} – ${fmt(fEnd - DAY)}`;

  /* ── Cohorts: by sign-up week, % writing in weeks 1, 2, 4 and 8 ── */
  const cohorts = [1, 2, 3, 4, 5].map((k) => {
    const end = now - k * 7 * DAY;
    const start = end - 7 * DAY;
    const people = signupsIn(start, end);
    const cells = [1, 2, 4, 8].map((w) => {
      if (end + w * 7 * DAY > now) return null; // not reached yet
      if (!people.length) return null;
      const n = people.filter((p) => {
        const s = Date.parse(p.created_at);
        return (userDays.get(p.user_id) ?? []).some((t) => t >= s + (w - 1) * 7 * DAY && t < s + w * 7 * DAY);
      }).length;
      return pct(n, people.length);
    });
    return { label: fmt(start), n: people.length, cells };
  }).reverse();

  /* ── Journeys table ── */
  const journeyRows = livePerf
    .filter((p) => p.starts > 0)
    .sort((a, b) => b.starts - a.starts)
    .slice(0, 6)
    .map((p) => {
      const curve = p.curve.map((c) => (p.starts ? Math.round((c / p.starts) * 100) : 0));
      let worst = -1;
      let loss = 0;
      for (let i = 1; i < curve.length; i++) {
        if (curve[i - 1] - curve[i] > loss) {
          loss = curve[i - 1] - curve[i];
          worst = i;
        }
      }
      return { id: p.id, title: p.title, days: p.curve.length, starts: p.starts, finished: pct(p.finished, p.starts), curve, worst, loss };
    });

  /* ── Writing, in the chosen period ── */
  const periodWriters = new Set(recent.map((e) => e.user_id));
  const words = recent.map((e) => (e.content ?? "").replace(/^\[[^\]]*\]\s*/, "").trim().split(/\s+/).filter(Boolean).length);
  const fromJourneys = recent.filter((e) => (e.tags ?? []).some((t) => /^Day \d+$/.test(t))).length;
  const heat = Array.from({ length: 7 }, () => Array(8).fill(0) as number[]);
  const dayIdx: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const partsFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", hour12: false });
  for (const e of recent) {
    const parts = partsFmt.formatToParts(new Date(e.created_at));
    const wd = dayIdx[parts.find((p) => p.type === "weekday")?.value ?? "Mon"] ?? 0;
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
    heat[wd][Math.floor(h / 3)] += 1;
  }
  const heatMax = Math.max(1, ...heat.flat());

  // Current streak per active writer (days in a row up to today or yesterday).
  const dayKey = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });
  const streakBuckets = [0, 0, 0, 0];
  const active30 = writersIn(now - 30 * DAY, now);
  for (const u of active30) {
    const ds = new Set((userDays.get(u) ?? []).map(dayKey));
    let c = now;
    if (!ds.has(dayKey(c))) c -= DAY;
    let s = 0;
    while (ds.has(dayKey(c))) {
      s += 1;
      c -= DAY;
    }
    streakBuckets[s <= 1 ? 0 : s <= 6 ? 1 : s <= 13 ? 2 : 3] += 1;
  }
  const streakTotal = streakBuckets.reduce((a, b) => a + b, 0);

  // Reminders: entries per person with a reminder vs without (people who wrote in the period).
  const withReminder = new Set(profiles.filter((p) => p.reminder_hour !== null && p.reminder_hour !== undefined).map((p) => p.user_id));
  const perUser = new Map<string, number>();
  for (const e of recent) perUser.set(e.user_id, (perUser.get(e.user_id) ?? 0) + 1);
  const avg = (us: string[]) => (us.length ? us.reduce((s, u) => s + (perUser.get(u) ?? 0), 0) / us.length : 0);
  const writersArr = [...periodWriters];
  const remAvg = avg(writersArr.filter((u) => withReminder.has(u)));
  const noRemAvg = avg(writersArr.filter((u) => !withReminder.has(u)));

  /* ── Plus ── */
  const plus = profiles.filter((p) => p.plan && p.plan !== "free").length;

  /* ── Needs attention ── */
  const lastWeek = writersIn(now - 7 * DAY, now);
  let quiet = 0;
  for (const [u, ts] of userDays) {
    if (lastWeek.has(u)) continue;
    const weeksWritten = [1, 2, 3].filter((w) => ts.some((t) => t >= now - (w + 1) * 7 * DAY && t < now - w * 7 * DAY)).length;
    if (weeksWritten >= 2) quiet += 1;
  }
  const worstJourney = [...journeyRows].filter((j) => j.starts >= 3 && j.worst > 0).sort((a, b) => b.loss - a.loss)[0] ?? null;
  const scheduled = journeys.filter((j) => j.status === "scheduled" && j.scheduled_publish_at && Date.parse(j.scheduled_publish_at) > now);
  const drafts = journeys.filter((j) => j.status === "draft");
  const noDays = journeys.filter((j) => j.status !== "archived" && (j.journey_days ?? []).length === 0);

  return {
    period,
    waw,
    wawDelta,
    wawSeries: weeks.map((w) => ({ label: fmt(w.end - 7 * DAY), count: w.count })),
    signups,
    signupsDelta,
    signupSpark,
    activation: act.rate,
    activationDelta: ptsDelta(act.rate, actPrev.rate),
    activationSpark: actSpark,
    back,
    backDelta: ptsDelta(back, backPrev),
    backSpark,
    finishedRate,
    starts,
    funnel,
    funnelRange,
    cohorts,
    journeyRows,
    writing: {
      entries: recent.length,
      perWriter: periodWriters.size ? recent.length / periodWriters.size : 0,
      words: words.length ? Math.round(words.reduce((a, b) => a + b, 0) / words.length) : 0,
      photo: pct(recent.filter((e) => e.photo).length, recent.length),
      journeyShare: pct(fromJourneys, recent.length),
    },
    heat,
    heatMax,
    streaks: streakBuckets.map((n, i) => ({ label: ["1 day", "2–6 days", "7–13 days", "14+ days"][i], pct: pct(n, streakTotal) ?? 0 })),
    reminders: {
      share: pct(withReminder.size, profiles.length),
      ratio: noRemAvg ? remAvg / noRemAvg : null,
    },
    plus,
    totalUsers: profiles.length,
    freeToPlus: pct(plus, profiles.length),
    quiet,
    worstJourney,
    scheduled: scheduled.map((j) => ({ id: j.id, title: j.title, at: j.scheduled_publish_at! })),
    drafts: drafts.map((j) => ({ id: j.id, title: j.title })),
    noDays: noDays.map((j) => ({ id: j.id, title: j.title })),
  };
}
