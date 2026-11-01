"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ds";

/* Unexpected errors anywhere in the app show this instead of a blank screen.
   Admin keeps its own page (app/(admin)/admin/error.tsx). */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="hs-status-page" role="alert">
      <Logo size={22} />
      <div className="hs-status-body">
        <h1 className="text-h2">Something went wrong</h1>
        <p className="hs-status-text">
          This page couldn&apos;t load. Your writing is saved. Try again, or come back in a moment.
        </p>
        {error.digest ? <p className="hs-status-ref">Reference {error.digest}</p> : null}
      </div>
      <div className="hs-status-actions">
        <button type="button" className="hs-btn hs-btn-default" onClick={() => unstable_retry()}>
          Try again
        </button>
        <Link href="/dashboard" className="hs-btn hs-btn-secondary">Go to Home</Link>
      </div>
    </main>
  );
}
