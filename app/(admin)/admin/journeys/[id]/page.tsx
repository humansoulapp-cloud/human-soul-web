import { notFound } from "next/navigation";
import { getJourney } from "@/lib/actions/journeys";
import JourneyForm from "@/components/admin/JourneyForm";

export default async function EditJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const journey = await getJourney(id);

  if (!journey) notFound();

  return <JourneyForm journey={journey} />;
}
