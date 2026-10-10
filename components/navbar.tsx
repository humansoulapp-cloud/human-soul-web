"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, Heart, Home, LogOut, Moon, PenLine, Shield, Sparkles, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Button, Icon, Logo } from "@/components/ds";

/**
 * Design System v2 navigation.
 * - ≥768px: a sticky top bar — logo, pill navigation, Reflect and the account menu.
 *   Between 768 and 1023px Reflect shows as an icon to make room.
 * - <768px: logo + account menu on top, a bottom bar with five tabs and a
 *   floating Reflect button above it.
 */
const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Journeys", href: "/journeys", icon: Compass },
  { label: "Favorites", href: "/favorites", icon: Heart },
];

const TAB_ITEMS = [...NAV_ITEMS, { label: "Profile", href: "/profile", icon: User }];

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
  const [subscribed, setSubscribed] = React.useState(true);
  const [name, setName] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");

      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

      setIsAdmin(profile?.role === "admin");
      setSubscribed(Boolean(profile?.plan && profile.plan !== "free"));
    }
    loadUser();
  }, []);

  // Close the account menu on outside click, Escape, or navigation
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  React.useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      <header className="hs-topbar">
        <div className="hs-topbar-in">
          <Link href="/dashboard" className="hs-brand hs-focusable" aria-label="HumanSoul home">
            <Logo size={24} />
          </Link>

          <nav className="hs-nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hs-nav-item hs-focusable"
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hs-tools">
            <Button href="/journal/new" icon={PenLine} className="hs-reflect" aria-label="Reflect">
              <span className="hs-reflect-label">Reflect</span>
            </Button>

            <div className="hs-me" ref={menuRef}>
              <button
                type="button"
                className="hs-me-btn hs-focusable"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Avatar name={name || "Profile"} />
              </button>

              {menuOpen && (
                <div className="hs-menu" role="menu">
                  <Link href="/profile" className="hs-menu-item" role="menuitem">
                    <Icon icon={User} size={18} />
                    Profile
                  </Link>
                  {!subscribed && (
                    <Link href="/subscription" className="hs-menu-item" role="menuitem">
                      <Icon icon={Sparkles} size={18} />
                      HumanSoul Plus
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" className="hs-menu-item" role="menuitem">
                      <Icon icon={Shield} size={18} />
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    className="hs-menu-item"
                    role="menuitem"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    <Icon icon={isDark ? Sun : Moon} size={18} />
                    {isDark ? "Light mode" : "Dark mode"}
                  </button>
                  <span className="hs-menu-sep" aria-hidden="true" />
                  <button type="button" className="hs-menu-item" role="menuitem" onClick={handleSignOut}>
                    <Icon icon={LogOut} size={18} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile ── */}
      <Link href="/journal/new" className="hs-fab hs-focusable">
        <Icon icon={PenLine} size={20} />
        Reflect
      </Link>
      <div className="hs-bottombar">
        <nav className="hs hs-bottomnav" aria-label="Main navigation">
          {TAB_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hs-focusable hs-bottomnav-item"
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            >
              <Icon icon={item.icon} size={22} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
