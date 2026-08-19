"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Heart, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { titleAndSnippet, type ReflectionRow } from "@/lib/journal";

const DAY_TAG = /^Day (\d+)$/;

/** Journey entries carry a "[Journey - Day N: Title]" header and their tags. */
function describe(entry: ReflectionRow) {
  const text = (entry.content ?? "").trim();
  const tags = entry.tags ?? [];
  const dayTag = tags.find((t) => DAY_TAG.test(t));
  const journeyTitle = tags.find((t) => t !== dayTag && !DAY_TAG.test(t));

  if (text.startsWith("[")) {
    const header = text.slice(1, text.indexOf("]"));
    const body = text.slice(text.indexOf("]") + 1).trim();
    const title = header.includes(":") ? header.slice(header.indexOf(":") + 1).trim() : header;
    return {
      title,
      body,
      source: dayTag && journeyTitle ? `${journeyTitle} · ${dayTag}` : "Journey",
    };
  }

  const { title, snippet } = titleAndSnippet(text);
  return { title, body: snippet || text, source: tags.length ? tags.join(" · ") : "Free writing" };
}

export default function FavoritesPage() {
  const [items, setItems] = useState<ReflectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data } = await supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .eq("favorite", true)
        .order("created_at", { ascending: false });

      setItems((data ?? []) as ReflectionRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const remove = async (entry: ReflectionRow) => {
    setItems((prev) => prev.filter((e) => e.id !== entry.id));
    const supabase = createClient();
    await supabase.from("reflections").update({ favorite: false }).eq("id", entry.id);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((e) => {
      if (!q) return true;
      const { title, body, source } = describe(e);
      return `${title} ${body} ${source}`.toLowerCase().includes(q);
    });
    return sortNewest ? list : [...list].reverse();
  }, [items, query, sortNewest]);

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-[var(--ds-text-muted)]">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-end gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-[28px] md:text-[37px] font-semibold tracking-[-0.015em] m-0 mb-1.5">
            Favorites
          </h1>
          <p className="text-sm text-[var(--ds-text-muted)] m-0">
            {items.length === 0
              ? "Nothing saved yet."
              : `${items.length} saved ${items.length === 1 ? "reflection" : "reflections"}`}
          </p>
        </div>
      </div>

      <div className="mt-[26px]">
        <div className="flex items-center gap-3 px-4 h-12 rounded-xl border border-[var(--ds-line)] bg-[var(--ds-surface)]">
          <Search className="w-4 h-4 flex-shrink-0 text-[var(--ds-text-muted)]" strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your saved reflections"
            className="flex-1 min-w-0 bg-transparent border-none text-sm text-[var(--ds-text)]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[12.5px] font-semibold text-[var(--ds-accent)]"
            >
              Clear
            </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 mt-3.5 flex-wrap">
            <span className="flex-1" />
            <button
              onClick={() => setSortNewest((v) => !v)}
              className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] text-xs transition-colors"
            >
              <ArrowDownUp className="w-[13px] h-[13px]" strokeWidth={1.9} />
              {sortNewest ? "Recently saved" : "Oldest saved"}
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="mt-5 px-6 py-[46px] rounded-[14px] border border-dashed border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-center flex flex-col items-center">
            <span className="w-11 h-11 rounded-full grid place-items-center bg-[var(--ds-accent-soft)] text-[var(--ds-accent)]">
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.7} />
            </span>
            <div className="text-[17px] font-semibold mt-3.5">
              {items.length === 0 ? "Nothing saved yet" : "Nothing matches that search"}
            </div>
            <p className="text-sm text-[var(--ds-text-muted)] mt-2 max-w-[42ch]">
              {items.length === 0
                ? "Tap the heart on any entry in your journal and it will be kept here."
                : "Try a shorter word, or clear the search to see everything you saved."}
            </p>
            {items.length === 0 ? (
              <Link
                href="/journal"
                className="mt-4 px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px]"
              >
                Open your journal
              </Link>
            ) : (
              <button
                onClick={() => setQuery("")}
                className="mt-4 px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px]"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mt-5">
            {visible.map((entry) => {
              const { title, body, source } = describe(entry);
              const isOpen = Boolean(open[entry.id]);
              return (
                <div
                  key={entry.id}
                  className="px-5 pt-[18px] pb-[17px] rounded-[14px] border border-[var(--ds-line)] bg-[var(--ds-surface)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-[3px] rounded-full bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[10px] font-bold tracking-[0.11em]">
                      REFLECTION
                    </span>
                    <span className="text-[12.5px] text-[var(--ds-text-muted)] whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="flex-1" />
                    <button
                      onClick={() => remove(entry)}
                      aria-label="Remove from favorites"
                      className="p-1 grid place-items-center text-[var(--ds-accent)]"
                    >
                      <Heart className="w-[15px] h-[15px]" strokeWidth={1.7} fill="currentColor" />
                    </button>
                  </div>

                  <button
                    onClick={() => setOpen((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                    className="block w-full text-left mt-3 text-[var(--ds-text)]"
                  >
                    <span className="block text-base font-semibold leading-[1.35] mb-2">{title}</span>
                    <span
                      className={`text-[15px] leading-[1.72] text-[var(--ds-text-mid)] whitespace-pre-line ${
                        isOpen ? "block" : "line-clamp-2"
                      }`}
                    >
                      {body}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[11.5px] text-[var(--ds-text-muted)]">{source}</span>
                    <span className="flex-1" />
                    <button
                      onClick={() => setOpen((p) => ({ ...p, [entry.id]: !p[entry.id] }))}
                      className="text-[12.5px] font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)]"
                    >
                      {isOpen ? "Show less" : "Read all"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
