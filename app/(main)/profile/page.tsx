"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Heart, Sparkles, LogOut, Shield, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reflectionsCount, setReflectionsCount] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        // Fetch counts
        const { count: refCount } = await supabase
          .from("reflections")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id);

        const { count: favCount } = await supabase
          .from("reflections")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("favorite", true);

        setReflectionsCount(refCount || 0);
        setFavoritesCount(favCount || 0);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif-editorial text-4xl text-[var(--text-primary)]">
          Your Profile
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-light mt-1">
          Your personal space and account settings.
        </p>
      </div>

      {/* User Card */}
      <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 flex items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary)] flex-shrink-0">
          <User className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
            {displayName}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">{userEmail}</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center space-y-1">
          <span className="font-serif-editorial text-3xl text-[var(--text-primary)] font-normal">
            {reflectionsCount}
          </span>
          <p className="text-xs text-[var(--text-secondary)]">Reflections written</p>
        </div>

        <Link
          href="/favorites"
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center space-y-1 hover:border-[var(--brand-primary)] transition-colors"
        >
          <span className="font-serif-editorial text-3xl text-[var(--brand-primary)] font-normal">
            {favoritesCount}
          </span>
          <p className="text-xs text-[var(--text-secondary)]">Favorite reflections</p>
        </Link>
      </div>

      {/* Account Links */}
      <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-4 space-y-1">
        <Link
          href="/favorites"
          className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--border-subtle)]/50 transition-colors text-sm text-[var(--text-primary)]"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>View My Favorites</span>
          </div>
          <span>→</span>
        </Link>

        <Link
          href="/subscription"
          className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--border-subtle)]/50 transition-colors text-sm text-[var(--text-primary)]"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>Premium Subscription</span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] rounded-full font-medium">
            Free
          </span>
        </Link>
      </div>

      {/* Logout button */}
      <div className="pt-4">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-[#D4A3A3]/20 hover:bg-[#D4A3A3]/30 text-[var(--text-primary)] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
