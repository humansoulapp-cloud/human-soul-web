import React from "react";
import { requireAccess } from "@/lib/paywall";

/**
 * Focus mode: a journey takes over the window. No sidebar, no tab bar —
 * only the journey's own header, as in the redesign.
 */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  await requireAccess();
  return <div className="hs-focus min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</div>;
}
