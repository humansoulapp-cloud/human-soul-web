"use client";

import React from "react";
import { useParams } from "next/navigation";
import ReflectionEditor from "@/components/ReflectionEditor";

export default function EditReflectionPage() {
  const params = useParams<{ id: string }>();
  return <ReflectionEditor key={params.id} id={params.id} />;
}
