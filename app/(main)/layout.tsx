import React from "react";
import { Navigation } from "@/components/navbar";

/**
 * The redesign gives the sidebar its own full-height column and lets the
 * main column scroll on its own, so the page itself never scrolls on
 * desktop. On mobile the shell collapses to a bottom tab bar and normal
 * page scrolling, with padding left for the bar.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex md:h-screen bg-[var(--ds-bg)]">
      <Navigation />
      <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto bg-[var(--ds-bg)]">
        <div className="w-[min(1160px,100%-36px)] md:w-[min(1160px,100%-48px)] mx-auto pt-8 md:pt-11 pb-28 md:pb-[70px]">
          {children}
        </div>
      </main>
    </div>
  );
}
