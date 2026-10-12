/* Shown while an admin page gathers its numbers. */
export default function AdminLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }} aria-busy="true" aria-label="Loading">
      <div className="ad-card" style={{ height: 72, opacity: 0.5 }} />
      <div className="ad-card" style={{ height: 320, opacity: 0.4 }} />
      <div className="ad-card" style={{ height: 240, opacity: 0.3 }} />
    </div>
  );
}
