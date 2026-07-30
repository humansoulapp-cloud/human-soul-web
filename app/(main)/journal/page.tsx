"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PenTool, Search, Heart, Tag, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function JournalFeed() {
  const searchParams = useSearchParams();
  const selectedJournalId = searchParams.get("journal_id");

  const [reflections, setReflections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReflections() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedJournalId) {
        query = query.eq("journal_id", selectedJournalId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setReflections(data);
      }
      setLoading(false);
    }

    loadReflections();
  }, [selectedJournalId]);

  const toggleFavorite = async (id: string, currentFav: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("reflections")
      .update({ favorite: !currentFav })
      .eq("id", id);

    if (!error) {
      setReflections((prev) =>
        prev.map((r) => (r.id === id ? { ...r, favorite: !currentFav } : r))
      );
    }
  };

  const filteredReflections = reflections.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const matchContent = r.content?.toLowerCase().includes(term);
    const matchTags = r.tags?.some((t: string) => t.toLowerCase().includes(term));
    return matchContent || matchTags;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-editorial text-4xl text-[var(--text-primary)]">
            Your Reflections
          </h1>
          <p className="text-sm text-[var(--text-secondary)] font-light mt-1">
            A record of your thoughts and saved moments.
          </p>
        </div>

        <Link
          href="/journal/new"
          className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <PenTool className="w-4 h-4" />
          <span>New Reflection</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by keyword or tag..."
          className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
        />
      </div>

      {/* List / Feed */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
          Loading reflections...
        </div>
      ) : filteredReflections.length === 0 ? (
        <div className="bg-[var(--bg-surface-secondary)]/60 border border-dashed border-[var(--border-subtle)] rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)]/15 flex items-center justify-center mx-auto text-[var(--brand-primary)]">
            <PenTool className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif-editorial text-2xl text-[var(--text-primary)]">
              No reflections yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto font-light">
              Take a few minutes today to write what's on your mind.
            </p>
          </div>
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-[var(--brand-primary)] text-[var(--bg-surface)] text-xs font-medium rounded-xl hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            <span>Write your first reflection</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReflections.map((r) => (
            <div
              key={r.id}
              className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4 hover:border-[var(--brand-primary)]/60 transition-colors shadow-sm"
            >
              {/* Header Info */}
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
                  onClick={() => toggleFavorite(r.id, !!r.favorite)}
                  className={`p-1.5 rounded-full transition-colors ${
                    r.favorite
                      ? "text-red-500 bg-red-50"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${r.favorite ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {/* Photo preview if available */}
              {r.photo && (
                <div className="rounded-xl overflow-hidden max-h-60 border border-[var(--border-subtle)]">
                  <img
                    src={r.photo}
                    alt="Attached photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content text */}
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-light">
                {r.content}
              </p>

              {/* Tags */}
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

export default function JournalPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-[var(--text-secondary)]">Loading journal...</div>}>
      <JournalFeed />
    </Suspense>
  );
}
