"use client";

import React, { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { archiveJourney, unarchiveJourney } from "@/lib/actions/journeys";

export default function ArchiveJourneyButton({
  id,
  title,
  isArchived = false,
}: {
  id: string;
  title: string;
  isArchived?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleArchive = () => {
    startTransition(async () => {
      if (isArchived) {
        await unarchiveJourney(id, "draft");
      } else {
        await archiveJourney(id);
      }
      setConfirming(false);
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleArchive}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50 ${
            isArchived ? "bg-indigo-600 hover:bg-indigo-500" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : isArchived ? "Restore?" : "Archive?"}
        </button>
        <button
          type="button"
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
      type="button"
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg transition-colors text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface)]"
      title={isArchived ? `Restore "${title}" to drafts` : `Archive "${title}"`}
    >
      {isArchived ? (
        <ArchiveRestore className="w-4 h-4 text-indigo-400" />
      ) : (
        <Archive className="w-4 h-4" />
      )}
    </button>
  );
}
