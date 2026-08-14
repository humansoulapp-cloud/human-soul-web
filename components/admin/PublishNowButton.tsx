"use client";

import React, { useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { publishJourneyNow } from "@/lib/actions/journeys";

export default function PublishNowButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    if (
      !confirm(
        `Are you sure you want to publish "${title}" immediately? It will become visible to all users.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      await publishJourneyNow(id);
    });
  };

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPending}
      className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
      title="Publish this journey immediately"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Send className="w-3.5 h-3.5" />
      )}
      <span>Publish Now</span>
    </button>
  );
}
