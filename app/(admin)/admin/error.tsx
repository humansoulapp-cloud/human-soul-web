"use client";

import { useEffect } from "react";

/* Admin errors show here, on the page, instead of a blank screen. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="ad-card ad-pad" role="alert" style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1 className="text-h3" style={{ margin: 0 }}>
        This page couldn&apos;t load
      </h1>
      <p className="ad-soft" style={{ margin: 0, fontSize: 14 }}>
        {error.message || "Something went wrong on the server."}
        {error.digest ? ` · Reference ${error.digest}` : ""}
      </p>
      <div>
        <button type="button" className="hs-btn hs-btn-secondary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
