"use client";

import React, { useState, useTransition } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteJourney } from "@/lib/actions/journeys";

export default function DeleteJourneyButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteJourney(id);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-400/[0.05] hover:bg-red-400/[0.1] rounded-lg transition-all"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>

      {/* Confirm Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Delete Journey</h3>
                <p className="text-white/40 text-xs mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-white/60 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">&ldquo;{title}&rdquo;</span>?
              All {" "}days and data associated with this journey will be permanently removed.
            </p>

            {error && (
              <p className="text-red-400 text-xs mb-4 bg-red-400/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
