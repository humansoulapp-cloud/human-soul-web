import { notFound } from "next/navigation";
import { getJourney } from "@/lib/actions/journeys";
import JourneyDetailClient from "@/components/JourneyDetailClient";

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

  const initialDay = day ? Number(day) : undefined;

  return (
    <JourneyDetailClient
      journey={journey}
      initialDay={Number.isFinite(initialDay) ? initialDay : undefined}
    />
  );
}
