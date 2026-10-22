import React from "react";
import { Navigation } from "@/components/navbar";

/**
 * Design System v2 shell: one 1120px content column for every page,
 * aligned with the top navigation. On mobile the navigation moves to a
 * bottom bar (see components/navbar.tsx); pages leave room for it.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navigation />
      <main className="flex-1 min-w-0">
        <div className="hs-container hs-page">{children}</div>
      </main>
    </div>
  );
}
