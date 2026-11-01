import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ds";

export const metadata: Metadata = { title: "Page not found" };

/* Any address that doesn't exist, in the app or on the landing. */
export default function NotFound() {
  return (
    <main className="hs-status-page">
      <Logo size={22} />
      <div className="hs-status-body">
        <p className="hs-status-over">404</p>
        <h1 className="text-h2">This page isn&apos;t here</h1>
        <p className="hs-status-text">The link may be old, or the address has a typo. Everything you have written is safe.</p>
      </div>
      <div className="hs-status-actions">
        <Link href="/dashboard" className="hs-btn hs-btn-default">Go to Home</Link>
        <Link href="/" className="hs-btn hs-btn-secondary">HumanSoul.co</Link>
      </div>
    </main>
  );
}
