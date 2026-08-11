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
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        style={
          currentRole === "admin"
            ? {
                color: "var(--admin-text-muted)",
                background: "var(--admin-surface-2)",
              }
            : {
                color: "var(--admin-accent)",
                background: "color-mix(in srgb, var(--admin-accent) 15%, transparent)",
              }
        }
      >
        {isPending
          ? "…"
          : currentRole === "admin"
          ? "Revoke admin"
          : "Make admin"}
      </button>
      {error && (
        <p className="text-[10px] mt-1 text-right" style={{ color: "var(--admin-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
