"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

export async function getUsers(): Promise<UserRow[]> {
  const supabase = await requireAdmin();

  // Join profiles (role) with auth.users (email, created_at) via RPC or view
  // We select from profiles and get email via auth.users using service approach
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: { id: string; role: string; created_at: string }) => ({
    id: p.id,
    email: "—", // email not exposed via anon key for security; admin sees via Supabase Dashboard
    role: p.role ?? "user",
    created_at: p.created_at,
  }));
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getStats() {
  const supabase = await createClient();

  const [journeysRes, usersRes] = await Promise.all([
    supabase.from("journeys").select("id, featured, premium"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const journeys = journeysRes.data ?? [];

  return {
    totalJourneys: journeys.length,
    totalUsers: usersRes.count ?? 0,
    featuredJourneys: journeys.filter((j: { featured: boolean }) => j.featured).length,
    premiumJourneys: journeys.filter((j: { premium: boolean }) => j.premium).length,
  };
}
