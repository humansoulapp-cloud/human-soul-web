"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return serviceClient;
}

export async function getUsers(): Promise<UserRow[]> {
  const serviceClient = await requireAdmin();

  const { data, error } = await serviceClient
    .from("profiles")
    .select("user_id, role, created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: { user_id: string; role: string; created_at: string }) => ({
    id: p.user_id,
    email: "—",
    role: p.role ?? "user",
    created_at: p.created_at,
  }));
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
    serviceClient.from("journeys").select("id, featured, premium"),
    serviceClient.from("profiles").select("user_id", { count: "exact", head: true }),
  ]);

  const journeys = journeysRes.data ?? [];

  return {
    totalJourneys: journeys.length,
    totalUsers: usersRes.count ?? 0,
    featuredJourneys: journeys.filter((j: { featured: boolean }) => j.featured).length,
    premiumJourneys: journeys.filter((j: { premium: boolean }) => j.premium).length,
  };
}
