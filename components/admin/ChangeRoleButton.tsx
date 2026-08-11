"use client";

import React, { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/users";

export default function ChangeRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: "admin" | "user";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
          currentRole === "admin"
            ? "text-white/40 hover:text-white/70 bg-white/[0.05] hover:bg-white/[0.08]"
            : "text-[#8BA58F] hover:text-white bg-[#8BA58F]/10 hover:bg-[#8BA58F]/20"
        }`}
      >
        {isPending
          ? "…"
          : currentRole === "admin"
          ? "Revoke admin"
          : "Make admin"}
      </button>
      {error && (
        <p className="text-red-400 text-[10px] mt-1 text-right">{error}</p>
      )}
    </div>
  );
}
