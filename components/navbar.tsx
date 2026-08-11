"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  Compass,
  User,
  Heart,
  LogOut,
  PenTool,
  Moon,
  Sun
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { Shield } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    async function checkAdminRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (profile?.role === "admin") {
          setIsAdmin(true);
        }
      }
    }
    checkAdminRole();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const navItems = [
    { label: "Home",      href: "/dashboard", icon: Home },
    { label: "Journal",   href: "/journal",   icon: BookOpen },
    { label: "Journeys",  href: "/journeys",  icon: Compass },
    { label: "Favorites", href: "/favorites", icon: Heart },
    { label: "Profile",   href: "/profile",   icon: User },
  ];

  const adminItem = { label: "Admin Panel", href: "/admin", icon: Shield };

  return (
    <>
      {/* ── Desktop: floating left sidebar ── */}
      <aside className="hidden md:flex flex-col fixed top-4 bottom-4 left-4 z-50 w-64">
        <nav className="flex flex-col h-full px-5 py-6 bg-[var(--bg-surface-secondary)]/90 backdrop-blur-md border border-[var(--border-subtle)] rounded-3xl shadow-sm">

          {/* Logo */}
          <Link href="/dashboard" className="flex justify-center items-center px-1 pb-6 mb-4 border-b border-[var(--border-subtle)]">
            <div className="text-[var(--logo-color)] flex items-center text-[28px] tracking-tight">
              <span className="font-dm-sans font-medium mr-[3px]">Human</span>
              <span className="font-serif-editorial">Soul</span>
            </div>
          </Link>

          {/* Nav links — grows to fill space */}
          <div className="flex flex-col gap-1.5 flex-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--brand-primary)]/15 text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--brand-primary)]" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Conditional Admin Button (Desktop) */}
            {isAdmin && (
              <Link
                href={adminItem.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-colors border border-dashed border-[#8BA58F]/40 text-[#8BA58F] hover:bg-[#8BA58F]/10 hover:text-[#78937C] ${
                  pathname.startsWith("/admin") ? "bg-[#8BA58F]/20" : ""
                }`}
              >
                <adminItem.icon className="w-5 h-5 flex-shrink-0 text-[#8BA58F]" />
                <span>{adminItem.label}</span>
              </Link>
            )}
          </div>

          {/* Bottom actions — pinned to bottom */}
          <div className="flex flex-col gap-1.5 pt-4 mt-2 border-t border-[var(--border-subtle)]">
            <Link
              href="/journal/new"
              className="flex items-center gap-3.5 px-4 py-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-2xl transition-colors"
            >
              <PenTool className="w-5 h-5 flex-shrink-0" />
              <span>Write</span>
            </Link>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)] transition-colors w-full"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5 flex-shrink-0" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 flex-shrink-0" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm text-[var(--text-secondary)] hover:bg-[#D4A3A3]/20 hover:text-[var(--text-primary)] transition-colors w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Mobile: bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface-secondary)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-6 py-2 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 text-xs transition-colors ${
                isActive ? "text-[var(--brand-primary)] font-medium" : "text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        {/* Conditional Admin Button (Mobile) */}
        {isAdmin && (
          <Link
            href={adminItem.href}
            className={`flex flex-col items-center gap-1 p-2 text-xs transition-colors ${
              pathname.startsWith("/admin") ? "text-[#8BA58F] font-medium" : "text-[var(--text-secondary)]"
            }`}
          >
            <adminItem.icon className="w-5 h-5" />
            <span className="text-[10px]">Admin</span>
          </Link>
        )}
      </nav>
    </>
  );
}
