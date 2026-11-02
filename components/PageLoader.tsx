"use client";

import { useEffect } from "react";
import { addBusy } from "@/lib/progress";

/**
 * Shown while a screen gathers its data. The app's single loading indicator is
 * the thin bar at the top (components/TopProgress); this keeps the space and
 * runs that bar, and the content fades in when it arrives.
 */
export default function PageLoader({ label = "Loading" }: { label?: string }) {
  useEffect(() => addBusy(), []);
  return (
    <div className="hs-loader" role="status" aria-live="polite">
      <span className="hs-loader-sr">{label}</span>
    </div>
  );
}
