import { notFound } from "next/navigation";
import { getJourney, getJourneys } from "@/lib/actions/journeys";
import JourneyEditor from "@/components/admin/JourneyEditor";

export default async function EditJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [journey, all] = await Promise.all([
    getJourney(id, { allowUnpublished: true }),
    getJourneys({ includeAll: true }),
  ]);
  if (!journey) notFound();

  const categories = [...new Set(all.map((j) => j.category).filter((c): c is string => Boolean(c)))].sort();
  return <JourneyEditor key={journey.updated_at} journey={journey} categories={categories} />;
}
