"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export async function getJourneys(): Promise<JourneyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*, journey_days(*)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as JourneyRow[];
}

export async function getJourney(id: string): Promise<JourneyRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*, journey_days(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  // Sort days by day number
  if (data?.journey_days) {
    data.journey_days.sort(
      (a: JourneyDayInput, b: JourneyDayInput) => a.day - b.day
    );
  }
  return data as JourneyRow;
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function createJourney(input: JourneyInput) {
  const supabase = await requireAdmin();

  const { days, ...journeyData } = input;

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
  redirect("/admin/journeys");
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function updateJourney(id: string, input: JourneyInput) {
  const supabase = await requireAdmin();

  const { days, ...journeyData } = input;

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
  redirect("/admin/journeys");
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteJourney(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("journeys").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/journeys");
  revalidatePath("/admin/journeys");
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
