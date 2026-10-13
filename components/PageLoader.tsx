/** Calm loading state: three dots that breathe in turn. Used while a screen gathers its data. */
export default function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="hs-loader" role="status" aria-live="polite">
      <span className="hs-loader-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="hs-loader-sr">{label}</span>
    </div>
  );
}
