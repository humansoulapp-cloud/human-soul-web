"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  entries: number;
  streak: number;
  lastActive: string | null;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return serviceClient;
}

/**
 * The admin list joins three sources: the auth users (email, name, last sign
 * in), their profile (role and plan) and their reflections (entries, streak,
 * last written).
 */
export async function getUsers(): Promise<UserRow[]> {
  const serviceClient = await requireAdmin();

  const [{ data: profiles }, { data: authData }, { data: reflections }] = await Promise.all([
    serviceClient.from("profiles").select("*"),
    serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    serviceClient.from("reflections").select("user_id, created_at"),
  ]);

  const byUser = new Map<string, string[]>();
  for (const r of (reflections ?? []) as { user_id: string; created_at: string }[]) {
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.created_at]);
  }

  const authUsers = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        email: u.email ?? "—",
        name: (u.user_metadata?.display_name as string) || u.email?.split("@")[0] || "—",
        lastSignIn: u.last_sign_in_at ?? null,
      },
    ])
  );

  return ((profiles ?? []) as { user_id: string; role?: string | null; plan?: string | null; created_at: string }[]).map(
    (p) => {
      const dates = byUser.get(p.user_id) ?? [];
      const auth = authUsers.get(p.user_id);
      const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));

      // days in a row, counting back from today
      let streak = 0;
      const cursor = new Date();
      if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
      while (days.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      const lastWritten = dates.sort().at(-1) ?? null;

      return {
        id: p.user_id,
        email: auth?.email ?? "—",
        name: auth?.name ?? "—",
        role: p.role ?? "user",
        plan: p.plan && p.plan !== "free" ? "Plus" : "Free",
        entries: dates.length,
        streak,
        lastActive: lastWritten ?? auth?.lastSignIn ?? null,
        created_at: p.created_at,
      };
    }
  );
}

export async function updateUserPlan(userId: string, plan: "free" | "plus") {
  const serviceClient = await requireAdmin();

  const { error } = await serviceClient.from("profiles").update({ plan }).eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
  const serviceClient = await requireAdmin();

  const { error } = await serviceClient
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getStats() {
  const serviceClient = createServiceClient();

  const [journeysRes, usersRes] = await Promise.all([
    serviceClient.from("journeys").select("id, featured, premium, status, scheduled_publish_at"),
    serviceClient.from("profiles").select("user_id", { count: "exact", head: true }),
  ]);

  const journeys = (journeysRes.data ?? []) as {
    id: string;
    featured: boolean;
    premium: boolean;
    status?: string | null;
    scheduled_publish_at?: string | null;
  }[];

  const scheduled = journeys.filter(
    (j) => j.status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) > new Date()
  );
  const drafts = journeys.filter((j) => j.status === "draft");
  const archived = journeys.filter((j) => j.status === "archived");

  return {
    totalJourneys: journeys.length,
    totalUsers: usersRes.count ?? 0,
    featuredJourneys: journeys.filter((j) => j.featured).length,
    premiumJourneys: journeys.filter((j) => j.premium).length,
    scheduledJourneys: scheduled.length,
    draftJourneys: drafts.length,
    archivedJourneys: archived.length,
    publishedJourneys: journeys.length - scheduled.length - drafts.length - archived.length,
  };
}


export type JourneyPerformance = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  starts: number;
  finished: number;
  dropOff: string;
};

/**
 * Journey performance without a progress table: journey reflections are
 * tagged [journey title, "Day N"], so a person who wrote day 1 started it,
 * one who wrote every day finished it, and the day where the number of
 * people falls the most is where the journey loses them.
 */
export async function getJourneyPerformance(): Promise<JourneyPerformance[]> {
  const serviceClient = createServiceClient();

  const [{ data: journeys }, { data: reflections }] = await Promise.all([
    serviceClient.from("journeys").select("id, title, category, status, journey_days(day)"),
    serviceClient.from("reflections").select("user_id, tags"),
  ]);

  const rows = (reflections ?? []) as { user_id: string; tags: string[] | null }[];

  return ((journeys ?? []) as {
    id: string;
    title: string;
    category: string | null;
    status: string | null;
    journey_days: { day: number }[];
  }[]).map((journey) => {
    const totalDays = (journey.journey_days ?? []).length;

    // day number → the people who wrote it
    const perDay = new Map<number, Set<string>>();
    for (const r of rows) {
      const tags = r.tags ?? [];
      if (!tags.includes(journey.title)) continue;
      for (const tag of tags) {
        const match = /^Day (\d+)$/.exec(tag);
        if (!match) continue;
        const day = Number(match[1]);
        if (!perDay.has(day)) perDay.set(day, new Set());
        perDay.get(day)!.add(r.user_id);
      }
    }

    const countFor = (day: number) => perDay.get(day)?.size ?? 0;
    const starts = countFor(1);
    const finished = totalDays > 0 ? countFor(totalDays) : 0;

    let dropOff = "—";
    let worstLoss = 0;
    for (let day = 2; day <= totalDays; day += 1) {
      const loss = countFor(day - 1) - countFor(day);
      if (loss > worstLoss) {
        worstLoss = loss;
        dropOff = `Day ${day}`;
      }
    }

    return {
      id: journey.id,
      title: journey.title,
      category: journey.category,
      status: journey.status || "published",
      starts,
      finished,
      dropOff,
    };
  });
}

export async function getWritingStats() {
  const serviceClient = createServiceClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [entries, recentEntries, profiles] = await Promise.all([
    serviceClient.from("reflections").select("id", { count: "exact", head: true }),
    serviceClient
      .from("reflections")
      .select("user_id")
      .gte("created_at", since.toISOString()),
    serviceClient.from("profiles").select("plan"),
  ]);

  const activeWriters = new Set(
    ((recentEntries.data ?? []) as { user_id: string }[]).map((r) => r.user_id)
  ).size;

  const plus = ((profiles.data ?? []) as { plan?: string | null }[]).filter(
    (p) => p.plan && p.plan !== "free"
  ).length;

  return {
    totalEntries: entries.count ?? 0,
    entriesLast30: (recentEntries.data ?? []).length,
    activeWriters,
    plusSubscribers: plus,
  };
}
