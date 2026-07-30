import React from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[var(--bg-surface)]">
      <div className="w-full max-w-md bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="text-[var(--logo-color)] flex items-center text-[36px] tracking-tight mb-4">
            <span className="font-dm-sans font-medium mr-[4px]">Human</span>
            <span className="font-serif-editorial">Soul</span>
          </div>
          <h1 className="font-serif-editorial text-3xl font-normal text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-light max-w-xs">
            {subtitle}
          </p>
        </div>

        {/* Children Form */}
        <div className="space-y-4">{children}</div>
      </div>
    </main>
  );
}
