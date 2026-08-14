"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Users,
  LogOut,
  Shield,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react";
import { useAdminTheme } from "./AdminThemeProvider";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/admin",          icon: LayoutDashboard, exact: true },
  { label: "Journeys",  href: "/admin/journeys", icon: Compass },
  { label: "Users",     href: "/admin/users",    icon: Users },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, toggleTheme } = useAdminTheme();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 border-r"
      style={{
        background: "var(--admin-sidebar)",
        borderColor: "var(--admin-border)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--admin-border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--admin-accent)" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide" style={{ color: "var(--admin-text)" }}>
              Human Soul
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-accent)" }}>
              Admin
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                isActive
                  ? {
                      background: `color-mix(in srgb, var(--admin-accent) 12%, transparent)`,
                      color: "var(--admin-accent)",
                    }
                  : {
                      color: "var(--admin-text-secondary)",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--admin-surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--admin-accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--admin-border)" }}>
        {/* User info */}
        <div className="px-3 py-2 rounded-xl mb-2" style={{ background: "var(--admin-surface-2)" }}>
          <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--admin-text-muted)" }}>
            Signed in as
          </p>
          <p className="text-xs font-medium truncate" style={{ color: "var(--admin-text)" }}>
            {userEmail}
          </p>
        </div>

        {/* Return to user app */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: "var(--admin-text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--admin-surface-2)";
            (e.currentTarget as HTMLElement).style.color = "var(--admin-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--admin-text-secondary)";
          }}
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span>Exit to App</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: "var(--admin-text-secondary)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--admin-surface-2)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          {theme === "dark" ? (
            <><Sun className="w-4 h-4" /><span>Light Mode</span></>
          ) : (
            <><Moon className="w-4 h-4" /><span>Dark Mode</span></>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: "var(--admin-text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--admin-danger-bg)";
            (e.currentTarget as HTMLElement).style.color = "var(--admin-danger)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--admin-text-muted)";
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
