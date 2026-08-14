"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JourneyStatus = "published" | "scheduled" | "draft";

export type JourneyDayInput = {
  day: number;
  title: string;
  prompt: string;
  purpose: string;
  deeper?: string | null;
};

export type JourneyInput = {
  id: string;
  title: string;
  category?: string | null;
  realm?: string | null;
  tagline?: string | null;
  purpose?: string | null;
  intro?: string | null;
  time_required?: string | null;
  image_url?: string | null;
  premium?: boolean;
  featured?: boolean;
  completion_message?: string | null;
  status?: JourneyStatus;
  scheduled_publish_at?: string | null;
  days: JourneyDayInput[];
};

export type JourneyRow = {
  id: string;
  title: string;
  category: string | null;
  realm: string | null;
  tagline: string | null;
  purpose: string | null;
  intro: string | null;
  time_required: string | null;
  image_url: string | null;
  premium: boolean;
  featured: boolean;
  completion_message: string | null;
  status: JourneyStatus;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  journey_days: JourneyDayInput[];
};

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  // Get session user via SSR cookie client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Use service client to bypass RLS when verifying admin role
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  // Return service client so writes also bypass RLS
  return serviceClient;
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getJourneys(options?: { includeAll?: boolean }): Promise<JourneyRow[]> {
  const supabase = await createClient();
  const query = supabase
    .from("journeys")
    .select("*, journey_days(*)")
    .order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rawList = (data ?? []) as any[];
  const now = new Date();

  // If includeAll is requested (admin area), return all journeys
  if (options?.includeAll) {
    return rawList.map((j) => ({
      ...j,
      status: j.status || "published",
      scheduled_publish_at: j.scheduled_publish_at || null,
    })) as JourneyRow[];
  }

  // Otherwise (public view), only return published journeys or scheduled whose time has passed
  const visible = rawList.filter((j) => {
    const status = j.status || "published";
    if (status === "published") return true;
    if (status === "scheduled" && j.scheduled_publish_at) {
      return new Date(j.scheduled_publish_at) <= now;
    }
    return false;
  });

  return visible.map((j) => ({
    ...j,
    status: j.status || "published",
    scheduled_publish_at: j.scheduled_publish_at || null,
  })) as JourneyRow[];
}

export async function getJourney(
  id: string,
  options?: { allowUnpublished?: boolean }
): Promise<JourneyRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*, journey_days(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const status: JourneyStatus = data.status || "published";
  const scheduledAt = data.scheduled_publish_at;
  const now = new Date();

  if (!options?.allowUnpublished) {
    const isLive =
      status === "published" ||
      (status === "scheduled" && scheduledAt && new Date(scheduledAt) <= now);
    if (!isLive) return null;
  }

  // Sort days by day number
  if (data?.journey_days) {
    data.journey_days.sort(
      (a: JourneyDayInput, b: JourneyDayInput) => a.day - b.day
    );
  }

  return {
    ...data,
    status,
    scheduled_publish_at: scheduledAt || null,
  } as JourneyRow;
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function createJourney(input: JourneyInput) {
  const supabase = await requireAdmin();

  const { days, ...journeyData } = input;

  const status = journeyData.status || "published";
  const scheduledPublishAt =
    status === "scheduled" && journeyData.scheduled_publish_at
      ? new Date(journeyData.scheduled_publish_at).toISOString()
      : null;

  const { error: jErr } = await supabase.from("journeys").insert({
    id: journeyData.id,
    title: journeyData.title,
    category: journeyData.category ?? null,
    realm: journeyData.realm ?? null,
    tagline: journeyData.tagline ?? null,
    purpose: journeyData.purpose ?? null,
    intro: journeyData.intro ?? null,
    time_required: journeyData.time_required ?? null,
    image_url: journeyData.image_url ?? null,
    premium: journeyData.premium ?? false,
    featured: journeyData.featured ?? false,
    completion_message: journeyData.completion_message ?? null,
    status,
    scheduled_publish_at: scheduledPublishAt,
  });

  if (jErr) return { error: jErr.message };

  if (days.length > 0) {
    const { error: dErr } = await supabase.from("journey_days").insert(
      days.map((d) => ({ ...d, journey_id: input.id }))
    );
    if (dErr) return { error: dErr.message };
  }

  revalidatePath("/journeys");
  revalidatePath("/admin/journeys");
  revalidatePath("/admin");
  redirect("/admin/journeys");
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function updateJourney(id: string, input: JourneyInput) {
  const supabase = await requireAdmin();

  const { days, ...journeyData } = input;

  const status = journeyData.status || "published";
  const scheduledPublishAt =
    status === "scheduled" && journeyData.scheduled_publish_at
      ? new Date(journeyData.scheduled_publish_at).toISOString()
      : null;

  const { error: jErr } = await supabase
    .from("journeys")
    .update({
      title: journeyData.title,
      category: journeyData.category ?? null,
      realm: journeyData.realm ?? null,
      tagline: journeyData.tagline ?? null,
      purpose: journeyData.purpose ?? null,
      intro: journeyData.intro ?? null,
      time_required: journeyData.time_required ?? null,
      image_url: journeyData.image_url ?? null,
      premium: journeyData.premium ?? false,
      featured: journeyData.featured ?? false,
      completion_message: journeyData.completion_message ?? null,
      status,
      scheduled_publish_at: scheduledPublishAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (jErr) return { error: jErr.message };

  // Replace all days: delete then re-insert
  await supabase.from("journey_days").delete().eq("journey_id", id);

  if (days.length > 0) {
    const { error: dErr } = await supabase
      .from("journey_days")
      .insert(days.map((d) => ({ ...d, journey_id: id })));
    if (dErr) return { error: dErr.message };
  }

  revalidatePath("/journeys");
  revalidatePath(`/journeys/${id}`);
  revalidatePath("/admin/journeys");
  revalidatePath("/admin");
  redirect("/admin/journeys");
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

export async function publishJourneyNow(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("journeys")
    .update({
      status: "published",
      scheduled_publish_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/journeys");
  revalidatePath(`/journeys/${id}`);
  revalidatePath("/admin/journeys");
  revalidatePath("/admin");
  return { success: true };
}

export async function publishOverdueJourneys() {
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  // Find all scheduled journeys whose scheduled_publish_at <= now
  const { data: overdueJourneys, error: fetchErr } = await serviceClient
    .from("journeys")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_publish_at", now);

  if (fetchErr) return { error: fetchErr.message, count: 0 };
  if (!overdueJourneys || overdueJourneys.length === 0) return { success: true, count: 0 };

  const ids = overdueJourneys.map((j) => j.id);

  const { error: updateErr } = await serviceClient
    .from("journeys")
    .update({
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (updateErr) return { error: updateErr.message, count: 0 };

  revalidatePath("/journeys");
  revalidatePath("/admin/journeys");
  revalidatePath("/admin");

  return { success: true, count: ids.length };
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteJourney(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("journeys").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/journeys");
  revalidatePath("/admin/journeys");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Image Upload ──────────────────────────────────────────────────────────────

export async function uploadJourneyImage(
  journeyId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop();
  const path = `${journeyId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("journey-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("journey-images").getPublicUrl(path);

  return { url: publicUrl };
}

