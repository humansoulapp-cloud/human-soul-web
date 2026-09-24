import JourneyForm from "@/components/admin/JourneyForm";

export default async function NewJourneyPage({
  searchParams,
}: {
  searchParams?: Promise<{ import?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialOpenImport = params.import === "open" || params.import === "1";
  return <JourneyForm initialOpenImport={initialOpenImport} />;
}
