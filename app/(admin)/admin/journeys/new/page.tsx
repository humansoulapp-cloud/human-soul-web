import { getJourneys } from "@/lib/actions/journeys";
import JourneyEditor from "@/components/admin/JourneyEditor";

export default async function NewJourneyPage({
  searchParams,
}: {
  searchParams?: Promise<{ import?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const all = await getJourneys({ includeAll: true });
  const categories = [...new Set(all.map((j) => j.category).filter((c): c is string => Boolean(c)))].sort();
  return <JourneyEditor categories={categories} openImport={params.import === "open" || params.import === "1"} />;
}
