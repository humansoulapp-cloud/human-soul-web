import React from "react";

/**
 * Focus mode: a journey takes over the window. No sidebar, no tab bar —
 * only the journey's own header, as in the redesign.
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)]">{children}</div>;
}
