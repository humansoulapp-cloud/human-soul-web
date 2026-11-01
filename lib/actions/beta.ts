"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/*
 * Beta access: invite-only sign-up, a cap on people, and N days of full access.
 * The real gate is in the database (scripts/migration-2026-11-beta-access.sql);
 * these actions give sign-up a friendly answer first and let admins manage it.
 */

export type BetaSettings = { invite_only: boolean; max_users: number; access_days: number };

export type BetaInvite = {
  id: string;
  email: string;
  note: string | null;
  invited_at: string;
  user_id: string | null;
  joined_at: string | null;
  access_until: string | null;
};

export type WaitlistEntry = { id: string; email: string; created_at: string };

export type BetaOverview =
  | { ready: true; settings: BetaSettings; invites: BetaInvite[]; waitlist: WaitlistEntry[] }
  | { ready: false; error: string };

const DEFAULTS: BetaSettings = { invite_only: true, max_users: 30, access_days: 90 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 86_400_000;

function cleanEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return service;
}

async function readSettings(service: ReturnType<typeof createServiceClient>) {
  const { data, error } = await service.from("beta_settings").select("invite_only, max_users, access_days").eq("id", 1).maybeSingle();
  if (error) return null; // the migration hasn't been run
  return (data as BetaSettings | null) ?? DEFAULTS;
}

// ─── Public: sign-up and waitlist ────────────────────────────────────────────

/**
 * Asked by the sign-up form before it creates the account, so a person without
 * an invite sees the waitlist instead of a database error.
 */
export async function checkSignupAllowed(rawEmail: string): Promise<{ ok: true } | { ok: false; reason: "not_invited" | "full" }> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: true }; // the form reports a bad address itself

  const service = createServiceClient();
  const settings = await readSettings(service);
  if (!settings || !settings.invite_only) return { ok: true };

  const [{ data: invite }, { count }] = await Promise.all([
    service.from("beta_invites").select("id").eq("email", email).maybeSingle(),
    service.from("beta_invites").select("id", { count: "exact", head: true }).not("joined_at", "is", null),
  ]);
  if (!invite) return { ok: false, reason: "not_invited" };
  if ((count ?? 0) >= settings.max_users) return { ok: false, reason: "full" };
  return { ok: true };
}

export async function joinWaitlist(rawEmail: string): Promise<{ ok: boolean; error?: string }> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: false, error: "Enter a valid email address." };

  const service = createServiceClient();
  const { error } = await service.from("waitlist").insert({ email });
  // 23505: already on the list, which is fine.
  if (error && error.code !== "23505") return { ok: false, error: "Couldn't add you right now. Try again in a moment." };
  return { ok: true };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getBetaOverview(): Promise<BetaOverview> {
  const service = await requireAdmin();
  const { data: row, error: settingsError } = await service
    .from("beta_settings")
    .select("invite_only, max_users, access_days")
    .eq("id", 1)
    .maybeSingle();
  if (settingsError) {
    const e = settingsError as { code?: string; message?: string; hint?: string | null };
    return { ready: false, error: [e.code, e.message, e.hint].filter(Boolean).join(" · ") };
  }
  const settings = (row as BetaSettings | null) ?? DEFAULTS;

  const [{ data: invites }, { data: waitlist }] = await Promise.all([
    service.from("beta_invites").select("*").order("invited_at", { ascending: false }),
    service.from("waitlist").select("*").order("created_at", { ascending: true }),
  ]);

  const invited = new Set(((invites ?? []) as BetaInvite[]).map((i) => i.email.toLowerCase()));
  return {
    ready: true,
    settings,
    invites: (invites ?? []) as BetaInvite[],
    // People already invited drop off the waitlist view.
    waitlist: ((waitlist ?? []) as WaitlistEntry[]).filter((w) => !invited.has(w.email.toLowerCase())),
  };
}

/**
 * Invites one or more emails (separated by commas, spaces or new lines). If an
 * email already has an account, its access starts now.
 */
export async function inviteToBeta(raw: string, note?: string): Promise<{ added: number; skipped: string[]; error?: string }> {
  const service = await requireAdmin();
  const settings = await readSettings(service);
  if (!settings) return { added: 0, skipped: [], error: "Run the beta migration in Supabase first." };

  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  const emails = [...new Set(parts.map(cleanEmail).filter((e): e is string => Boolean(e)))];
  const skipped = parts.filter((p) => !cleanEmail(p));
  if (!emails.length) return { added: 0, skipped, error: "No valid email addresses." };

  const { data: existing } = await service.from("beta_invites").select("email");
  const already = new Set(((existing ?? []) as { email: string }[]).map((e) => e.email.toLowerCase()));
  const fresh = emails.filter((e) => !already.has(e));
  skipped.push(...emails.filter((e) => already.has(e)).map((e) => `${e} (already invited)`));
  if (!fresh.length) return { added: 0, skipped };

  // Accounts that already exist get their days from today.
  const { data: authData } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const accounts = new Map((authData?.users ?? []).filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.id]));
  const now = new Date();
  const until = new Date(now.getTime() + settings.access_days * DAY).toISOString();

  const rows = fresh.map((email) => {
    const userId = accounts.get(email) ?? null;
    return {
      email,
      note: note?.trim() || null,
      user_id: userId,
      joined_at: userId ? now.toISOString() : null,
      access_until: userId ? until : null,
    };
  });

  const { error } = await service.from("beta_invites").insert(rows);
  if (error) return { added: 0, skipped, error: error.message };

  revalidatePath("/admin/beta");
  return { added: rows.length, skipped };
}

/** Removes an invite. If the person already joined, their beta access ends now. */
export async function removeInvite(id: string): Promise<{ error?: string }> {
  const service = await requireAdmin();
  const { error } = await service.from("beta_invites").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return {};
}

/** Adds days to a joined person's access (from today if it already ended). */
export async function extendAccess(id: string, days: number): Promise<{ error?: string }> {
  const service = await requireAdmin();
  if (!Number.isInteger(days) || days < 1 || days > 365) return { error: "Choose between 1 and 365 days." };

  const { data: invite } = await service.from("beta_invites").select("access_until, user_id").eq("id", id).maybeSingle();
  if (!invite?.user_id) return { error: "This person hasn't joined yet." };

  const base = Math.max(Date.now(), invite.access_until ? new Date(invite.access_until).getTime() : 0);
  const { error } = await service
    .from("beta_invites")
    .update({ access_until: new Date(base + days * DAY).toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return {};
}

export async function updateBetaSettings(patch: Partial<BetaSettings>): Promise<{ error?: string }> {
  const service = await requireAdmin();
  const next: Partial<BetaSettings> & { updated_at: string } = { updated_at: new Date().toISOString() };
  if (typeof patch.invite_only === "boolean") next.invite_only = patch.invite_only;
  if (patch.max_users !== undefined) {
    if (!Number.isInteger(patch.max_users) || patch.max_users < 0 || patch.max_users > 10000) return { error: "Invalid number of people." };
    next.max_users = patch.max_users;
  }
  if (patch.access_days !== undefined) {
    if (!Number.isInteger(patch.access_days) || patch.access_days < 1 || patch.access_days > 365) return { error: "Choose between 1 and 365 days." };
    next.access_days = patch.access_days;
  }

  const { error } = await service.from("beta_settings").update(next).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/beta");
  return {};
}
