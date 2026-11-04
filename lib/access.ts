import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who gets full access (every day of every journey):
 * - people on a paid plan (profiles.plan is anything but "free"), and
 * - beta users until their access ends (beta_invites.access_until, see
 *   scripts/migration-2026-11-beta-access.sql), and
 * - the team (profiles.role = "admin"), so admins can review every journey.
 *
 * Every screen that unlocks Plus content asks here, so the rule lives in one place.
 */
export type Access = {
  /** Every journey day is open. */
  full: boolean;
  kind: "plus" | "beta" | "team" | "free";
  /** When the person's beta access ends or ended (ISO), if they were invited. */
  betaUntil: string | null;
  /** Whole days of beta access left, rounded up; 0 once it has ended. */
  betaDaysLeft: number;
};

const DAY = 86_400_000;

export function accessFrom(
  plan: string | null | undefined,
  betaUntil: string | null | undefined,
  now: number = Date.now(),
  role?: string | null
): Access {
  const until = betaUntil ?? null;
  const left = until ? Math.max(0, Math.ceil((new Date(until).getTime() - now) / DAY)) : 0;
  const paid = Boolean(plan && plan !== "free");
  const beta = Boolean(until && new Date(until).getTime() > now);
  const team = role === "admin";
  return {
    full: paid || beta || team,
    kind: paid ? "plus" : beta ? "beta" : team ? "team" : "free",
    betaUntil: until,
    betaDaysLeft: left,
  };
}

/**
 * Reads the person's beta invite. Returns null when there is none, or when the
 * beta migration hasn't been run yet, so the app keeps working either way.
 */
export async function loadBetaUntil(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("beta_invites")
    .select("access_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.access_until as string | null) ?? null;
}

/** The person's beta window: the day it started (account created) and when it ends. */
export type BetaWindow = { joinedAt: string | null; until: string | null };

export async function loadBeta(supabase: SupabaseClient, userId: string): Promise<BetaWindow> {
  const { data, error } = await supabase
    .from("beta_invites")
    .select("joined_at, access_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { joinedAt: null, until: null };
  return { joinedAt: (data.joined_at as string | null) ?? null, until: (data.access_until as string | null) ?? null };
}

/** "January 22, 2027" */
export function longDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Which day of the beta today is (1 on the day the account was created), and how many there are. */
export function betaProgress(joinedAt: string | null, until: string | null, now: number = Date.now()) {
  if (!until) return null;
  const end = new Date(until).getTime();
  const start = joinedAt ? new Date(joinedAt).getTime() : end - 90 * DAY;
  const total = Math.max(1, Math.round((end - start) / DAY));
  const day = Math.min(total, Math.max(1, Math.floor((now - start) / DAY) + 1));
  return { day, total };
}

