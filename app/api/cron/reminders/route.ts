import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { findActiveJourney, type Journey, type ReflectionRow } from "@/lib/journal";
import { journeyImage } from "@/lib/journey-images";
import { journeyDayStamp } from "@/lib/journey-days";
import { sendEmail } from "@/lib/email/send";
import { absolute, reminderEmail } from "@/lib/email/templates";

/**
 * Daily reminder emails. Called every hour; for each person with a reminder it
 * sends one email when it's their chosen hour in their own time zone, their
 * next journey day is open, and they haven't written in that journey today.
 */
export const maxDuration = 60;

type Profile = { user_id: string; timezone: string | null; reminder_hour: string | null; plan: string | null; preferences: Record<string, unknown> | null };

function localParts(timeZone: string | null, now: Date) {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", hourCycle: "h23" };
  try {
    return Number(new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: timeZone || "UTC" }).format(now));
  } catch {
    return Number(new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(now));
  }
}

function clock(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, hh, mm)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const service = createServiceClient();
  const { data: profiles, error } = await service
    .from("profiles")
    .select("user_id, timezone, reminder_hour, plan, preferences")
    .not("reminder_hour", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = ((profiles ?? []) as Profile[]).filter((p) => {
    const hour = Number((p.reminder_hour ?? "").split(":")[0]);
    if (Number.isNaN(hour) || localParts(p.timezone, now) !== hour) return false;
    return p.preferences?.last_reminder !== journeyDayStamp(now, p.timezone);
  });
  if (!due.length) return NextResponse.json({ ok: true, due: 0, sent: 0 });

  const [{ data: journeys }, { data: authData }] = await Promise.all([
    service.from("journeys").select("*, journey_days(day, title, prompt)"),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const emails = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const live = ((journeys ?? []) as (Journey & { reflection_questions?: string[] | null })[]).filter(
    (j) => (j.status ?? "published") === "published"
  );

  let sent = 0;
  const skipped: Record<string, number> = {};
  const skip = (why: string) => (skipped[why] = (skipped[why] ?? 0) + 1);

  for (const p of due) {
    const to = emails.get(p.user_id);
    if (!to) { skip("no_email"); continue; }

    const { data: rows } = await service
      .from("reflections")
      .select("id, tags, created_at")
      .eq("user_id", p.user_id)
      .order("created_at", { ascending: false });
    const reflections = (rows ?? []) as ReflectionRow[];

    const active = findActiveJourney(live, reflections, { timeZone: p.timezone, now });
    if (!active) { skip("no_journey"); continue; }
    if (active.waitingForMorning) { skip("not_open"); continue; }

    const plus = Boolean(p.plan && p.plan !== "free");
    if (active.journey.premium && !plus && active.nextDay.day > 1) { skip("locked"); continue; }

    const today = journeyDayStamp(now, p.timezone);
    const wroteToday = reflections.some(
      (r) => (r.tags ?? []).includes(active.journey.title) && journeyDayStamp(r.created_at, p.timezone) === today
    );
    if (wroteToday) { skip("wrote_today"); continue; }

    const prompt = (active.nextDay.prompt ?? "").trim();
    const question = prompt && prompt.length <= 220 && prompt.endsWith("?") ? prompt : null;

    const res = await sendEmail({
      to,
      tag: "reminder",
      ...reminderEmail({
        journey: { id: active.journey.id, title: active.journey.title, image: absolute(journeyImage(active.journey)) },
        day: active.nextDay.day,
        total: active.totalDays,
        title: active.nextDay.title,
        question,
        hour: clock(p.reminder_hour as string),
      }),
    });
    if (!res.ok) { skip("send_failed"); continue; }

    sent += 1;
    await service
      .from("profiles")
      .update({ preferences: { ...(p.preferences ?? {}), last_reminder: today } })
      .eq("user_id", p.user_id);
  }

  return NextResponse.json({ ok: true, due: due.length, sent, skipped });
}

export async function POST(request: Request) {
  return GET(request);
}
