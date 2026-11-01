"use client";

/* Last resort, when even the root layout fails. It renders its own document,
   so it can't use the app's styles or fonts: everything is inline. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          boxSizing: "border-box",
          background: "#FAF8F4",
          color: "#1E1C19",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <title>HumanSoul</title>
        <main role="alert" style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontWeight: 500, fontSize: 32, lineHeight: "38px" }}>
            Something went wrong
          </h1>
          <p style={{ margin: 0, color: "#6A645B", lineHeight: 1.5 }}>
            HumanSoul couldn&apos;t load. Your writing is saved. Try again in a moment.
          </p>
          {error.digest ? <p style={{ margin: 0, color: "#9A938A", fontSize: 13 }}>Reference {error.digest}</p> : null}
          <div>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                minHeight: 44,
                padding: "0 20px",
                border: 0,
                borderRadius: 999,
                background: "#4F6E55",
                color: "#FFFFFF",
                font: "600 15px/20px system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
