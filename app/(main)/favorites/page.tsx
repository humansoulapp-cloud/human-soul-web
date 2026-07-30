"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Calendar, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .eq("favorite", true)
        .order("created_at", { ascending: false });

      setFavorites(data || []);
      setLoading(false);
    }

    loadFavorites();
  }, []);

  const toggleFavorite = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("reflections")
      .update({ favorite: false })
      .eq("id", id);

    if (!error) {
      setFavorites((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to profile</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-serif-editorial text-4xl text-[var(--text-primary)]">
          Your Favorites
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-light mt-1">
          Special reflections you've chosen to keep.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
          Loading favorites...
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-[var(--bg-surface-secondary)]/60 border border-dashed border-[var(--border-subtle)] rounded-3xl p-12 text-center space-y-3">
          <Heart className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">
            You haven't marked any reflections as favorites yet.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tap the heart icon on any entry to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <button
                  onClick={() => toggleFavorite(r.id)}
                  className="p-1.5 rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              {r.photo && (
                <div className="rounded-xl overflow-hidden max-h-60 border border-[var(--border-subtle)]">
                  <img
                    src={r.photo}
                    alt="Attached photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-light">
                {r.content}
              </p>

              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {r.tags.map((t: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full text-[11px] text-[var(--text-secondary)]"
                    >
                      <Tag className="w-3 h-3 text-[var(--brand-primary)]" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
