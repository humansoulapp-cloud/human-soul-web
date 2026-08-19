"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  Compass,
  Heart,
  LogOut,
  PenLine,
  Moon,
  Sun,
  Shield,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

/** Navigation entries shared by the sidebar and the mobile tab bar. */
const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Journeys", href: "/journeys", icon: Compass },
  { label: "Favorites", href: "/favorites", icon: Heart },
];

/** The tab bar drops Favorites and swaps Profile in as "You". */
const TAB_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Journeys", href: "/journeys", icon: Compass },
  { label: "You", href: "/profile", icon: User },
];

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");
      setName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");

      // `select("*")` so the sidebar keeps working before `plan` exists.
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
      setSubscribed(Boolean(profile?.plan && profile.plan !== "free"));
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      {/* ── Desktop: full-height sidebar ── */}
      <nav className="hidden md:flex flex-col flex-shrink-0 w-[216px] h-screen sticky top-0 px-3 pt-5 pb-4 bg-[var(--ds-side)] border-r border-[var(--ds-line)]">
        <Link
          href="/dashboard"
          className="px-2.5 pt-1.5 pb-5 text-[19px] font-bold tracking-[-0.015em] text-[var(--ds-text)] hover:text-[var(--ds-text)]"
        >
          Human<span className="font-normal">Soul</span>
        </Link>

        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] text-[13.5px] transition-colors ${
                  active
                    ? "font-semibold text-[var(--ds-text)] bg-[var(--ds-accent-soft)]"
                    : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {!subscribed && (
          <div className="my-8 mx-0.5 p-4 rounded-xl border border-[var(--ds-line)] bg-[var(--ds-accent-soft)] text-[var(--ds-text)]">
            <div className="text-[10px] font-bold tracking-[0.13em] text-[var(--ds-gold)]">
              HUMANSOUL PLUS
            </div>
            <p className="text-[12.5px] leading-relaxed my-[7px] opacity-80">
              Unlock every journey and keep your full journal history.
            </p>
            <Link
              href="/subscription"
              className="inline-block px-3.5 py-2 rounded-lg bg-[var(--ds-gold)] text-[var(--ds-on-gold)] hover:text-[var(--ds-on-gold)] text-[12.5px] font-semibold"
            >
              See plans
            </Link>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-0.5">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-[11px] px-[11px] py-[9px] mb-1.5 rounded-[9px] border border-dashed border-[var(--ds-line-strong)] text-[13px] text-[var(--ds-accent)]"
            >
              <Shield className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
              <span>Admin dashboard</span>
            </Link>
          )}

          <Link
            href="/journal/new"
            className="flex items-center gap-[11px] px-3 py-[11px] rounded-[9px] bg-[var(--ds-accent)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13.5px] font-semibold transition-colors hover:bg-[var(--ds-accent-hover)]"
          >
            <PenLine className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
            <span>Reflect</span>
          </Link>

          <div className="h-px bg-[var(--ds-line)] mx-0.5 my-[11px]" />

          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-[9px] py-2 rounded-[9px] text-[var(--ds-text)] hover:text-[var(--ds-text)] hover:bg-[var(--ds-surface-2)] transition-colors"
          >
            <span className="w-[30px] h-[30px] flex-shrink-0 rounded-full grid place-items-center bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[11.5px] font-bold">
              {initials(name, email)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold truncate">{name || "Your profile"}</span>
              <span className="block text-[11px] text-[var(--ds-text-muted)] truncate">{email}</span>
            </span>
          </Link>

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] text-[13.5px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] transition-colors text-left"
          >
            {isDark ? (
              <Sun className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
            ) : (
              <Moon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
            )}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] text-[13.5px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] transition-colors text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile: bottom tab bar, with Reflect as the centre action ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex px-1.5 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] border-t border-[var(--ds-line)] bg-[var(--ds-surface)]/95 backdrop-blur-xl">
        {TAB_ITEMS.slice(0, 2).map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}

        <Link
          href="/journal/new"
          className="flex-1 flex flex-col items-center gap-1 hover:text-[var(--ds-text-muted)]"
        >
          <span className="w-11 h-8 rounded-full grid place-items-center bg-[var(--ds-accent)] text-[var(--ds-on-accent)]">
            <PenLine className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </span>
          <span className="text-[10.5px] text-[var(--ds-text-muted)]">Reflect</span>
        </Link>

        {TAB_ITEMS.slice(2).map((item) => (
          <TabLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </>
  );
}

function TabLink({
  item,
  pathname,
}: {
  item: (typeof TAB_ITEMS)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={`flex-1 flex flex-col items-center gap-1 transition-colors ${
        active
          ? "text-[var(--ds-accent)] hover:text-[var(--ds-accent)]"
          : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text-muted)]"
      }`}
    >
      <Icon className="w-[22px] h-[22px]" strokeWidth={1.7} />
      <span className={`text-[10.5px] ${active ? "font-semibold" : ""}`}>{item.label}</span>
    </Link>
  );
}
