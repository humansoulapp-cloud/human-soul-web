import React from "react";
import Link from "next/link";

/**
 * The redesign's auth layout: the form on the left, an image panel on the
 * right that each screen fills with its own content. The panel is hidden
 * below lg, where the form takes the whole width.
 */
export function AuthShell({
  children,
  aside,
  image,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  image: string;
}) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[var(--ds-bg)] text-[var(--ds-text)]">
      <div className="flex flex-col px-6 py-8 md:px-11">
        <Link
          href="/"
          className="text-[19px] font-bold tracking-[-0.015em] text-[var(--ds-text)] hover:text-[var(--ds-text)]"
        >
          Human<span className="font-normal">Soul</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center w-full max-w-[400px] mx-auto py-10">
          {children}
        </div>

        <div className="text-[11.5px] text-[var(--ds-text-muted)]">
          Private by default. Your entries are yours.
        </div>
      </div>

      <div className="relative overflow-hidden hidden lg:flex items-end">
        <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} />
        <span className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/80" />
        <div className="relative p-11 max-w-[560px]">{aside}</div>
      </div>
    </main>
  );
}

export const AUTH_FIELD = "flex flex-col gap-[7px]";
export const AUTH_LABEL = "text-[9.5px] font-bold tracking-[0.11em] text-[var(--ds-text-muted)]";
export const AUTH_INPUT =
  "w-full px-3.5 py-3 rounded-[10px] border border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-[var(--ds-text)] text-sm";
export const AUTH_SUBMIT =
  "block w-full mt-5 p-3.5 rounded-[10px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] text-sm font-semibold text-center transition-colors disabled:opacity-60";
export const AUTH_SMALL_LINK = "text-xs font-semibold text-[var(--ds-accent)]";

/** Social sign-in is designed but not wired up yet, so the buttons are inert. */
export function SocialButtons({ verb }: { verb: string }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 mt-6">
        {["Apple", "Google"].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            title="Coming soon"
            className="flex items-center justify-center gap-2.5 p-3 rounded-[10px] border border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-[var(--ds-text)] text-[13.5px] font-semibold opacity-50 cursor-not-allowed"
          >
            {verb} with {provider}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 my-5 text-[10px] font-bold tracking-[0.12em] text-[var(--ds-text-muted)]">
        <span className="flex-1 h-px bg-[var(--ds-line)]" />
        OR
        <span className="flex-1 h-px bg-[var(--ds-line)]" />
      </div>
    </>
  );
}
