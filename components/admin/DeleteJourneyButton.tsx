"use client";

import React, { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteJourney } from "@/lib/actions/journeys";

export default function DeleteJourneyButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteJourney(id);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--admin-danger)" }}
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-2 py-1 rounded-lg text-xs transition-colors"
          style={{
            background: "var(--admin-surface)",
            color: "var(--admin-text-muted)",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg transition-colors text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
      title={`Delete "${title}"`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
