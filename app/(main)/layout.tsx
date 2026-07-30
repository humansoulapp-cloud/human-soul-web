import React from "react";
import { Navigation } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      <Navigation />
      <main className="w-full px-6 pt-8 pb-24 md:pl-76 md:pr-10 md:pb-10">
        {children}
      </main>
    </div>
  );
}
