"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReflectionEditor from "@/components/ReflectionEditor";

function NewReflection() {
  const params = useSearchParams();
  return <ReflectionEditor initialJournalId={params.get("journal_id")} />;
}

export default function NewReflectionPage() {
  return (
    <Suspense fallback={null}>
      <NewReflection />
    </Suspense>
  );
}
