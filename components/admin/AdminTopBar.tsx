"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin", exact: true },
  { label: "Journeys", href: "/admin/journeys" },
  { label: "Users", href: "/admin/users" },
];

/** Admin top bar: same pill navigation and container width as the app. */
export default function AdminTopBar() {
  const pathname = usePathname();
  return (
    <header className="ad-top">
      <div className="ad-top-in">
        <Link className="ad-brand" href="/admin" aria-label="HumanSoul Admin">
          <span className="ad-logo">
            <span className="hs-logo-human">Human</span>
            <span className="hs-logo-soul">Soul</span>
          </span>
          <span className="text-overline" style={{ color: "var(--primary)" }}>
            Admin
          </span>
        </Link>
        <nav className="ad-nav" aria-label="Admin">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link className="ad-exit" href="/dashboard">
          <LogOut size={16} aria-hidden="true" className="ai" />
          Exit to app
        </Link>
      </div>
    </header>
  );
}
