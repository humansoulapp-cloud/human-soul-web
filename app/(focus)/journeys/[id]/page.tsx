import { notFound } from "next/navigation";
import { getJourney } from "@/lib/actions/journeys";
import { createClient } from "@/lib/supabase/server";
import JourneyDetailClient from "@/components/JourneyDetailClient";
import type { ReflectionRow } from "@/lib/journal";

export default async function JourneyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { id } = await params;
  const { day } = await searchParams;
  const journey = await getJourney(id);

  if (!journey) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reflections: ReflectionRow[] = [];
  let subscribed = false;

  if (user) {
    const [{ data: reflectionRows }, { data: profile }] = await Promise.all([
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .contains("tags", [journey.title])
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    reflections = (reflectionRows ?? []) as ReflectionRow[];
    subscribed = Boolean(profile?.plan && profile.plan !== "free");
  }

  const initialDay = day ? Number(day) : undefined;

  return (
    <JourneyDetailClient
      journey={journey}
      reflections={reflections}
      subscribed={subscribed}
      initialDay={Number.isFinite(initialDay) ? initialDay : undefined}
    />
  );
}
