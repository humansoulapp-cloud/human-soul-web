"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Compass, Heart, Lock, MoreHorizontal, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import ReflectionEditor from "@/components/ReflectionEditor";
import { JourneyPromptCard, loadJourneyPrompt, type JourneyPrompt } from "@/components/journeys/prompt-card";
import { createClient } from "@/lib/supabase/client";
import type { UserJournal } from "@/lib/journal";
import {
  dayGroupLabel,
  entryBody,
  entryLabels,
  entryTitle,
  inJournal,
  journeyInfo,
  removeStoredPhoto,
  resolvePhotos,
  type Reflection,
} from "@/lib/reflections";
import { Button, EmptyState } from "@/components/ds";

/**
 * Journal · two panes (canvas «App / Journal · Two panes»):
 * find on the left (search, journals, the list by day), read on the right.
 * Both panes fit the window and scroll on their own. On mobile the list
 * fills the screen and a reflection opens full screen.
 */

type Filter = { kind: "all" } | { kind: "journeys" } | { kind: "favorites" } | { kind: "journal"; id: string };

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fullDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${timeOf(iso)}`;
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Runs a state change as a view transition: the reading pane grows into the
 * writing page (and back) because both carry view-transition-name: jsheet.
 * Without support, or with reduced motion, the change simply happens.
 */
function withTransition(change: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) return change();
  doc.startViewTransition(() => flushSync(change));
}

type Writing = { id?: string; focus: "title" | "text" } | null;

function JournalPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const journalParam = params.get("journal_id");
  const filterParam = params.get("filter");
  const selectedParam = params.get("r");
  const entryParam = params.get("entry");
  const newJournalParam = params.get("new_journal");
  const writeParam = params.get("write");

  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Reflection[]>([]);
  const [journals, setJournals] = useState<UserJournal[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [creating, setCreating] = useState(Boolean(newJournalParam));
  const [newJournal, setNewJournal] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [journalError, setJournalError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  /* Writing happens over the Journal page, so the pane can grow into it. */
  const [writing, setWriting] = useState<Writing>(writeParam ? { id: writeParam === "new" ? undefined : writeParam, focus: "text" } : null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<JourneyPrompt | null>(null);

  const filter: Filter = journalParam
    ? { kind: "journal", id: journalParam }
    : filterParam === "journeys"
      ? { kind: "journeys" }
      : filterParam === "favorites"
        ? { kind: "favorites" }
        : { kind: "all" };

  // Older links pointed at ?entry=<id>; they now open the reflection in the reading pane.
  useEffect(() => {
    if (entryParam) router.replace(`/journal?r=${entryParam}`);
  }, [entryParam, router]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setUserId(user.id);
      const [{ data: rows }, { data: journalRows }] = await Promise.all([
        supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("journals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      const list = (rows ?? []) as Reflection[];
      setEntries(list);
      setJournals((journalRows ?? []) as UserJournal[]);
      setLoading(false);
      setPhotos(await resolvePhotos(supabase, list));
    }
    load();
  }, []);

  /** Keeps the filter and the open reflection in the URL, so links and Back work. */
  const go = useCallback(
    (next: { filter?: Filter; r?: string | null }) => {
      const f = next.filter ?? filter;
      const sp = new URLSearchParams();
      if (f.kind === "journal") sp.set("journal_id", f.id);
      else if (f.kind !== "all") sp.set("filter", f.kind);
      const r = next.r === undefined ? selectedParam : next.r;
      if (r) sp.set("r", r);
      const qs = sp.toString();
      router.replace(qs ? `/journal?${qs}` : "/journal", { scroll: false });
    },
    [filter, selectedParam, router]
  );

  const setFilter = (next: Filter) => {
    setRenaming(false);
    go({ filter: next, r: null });
  };

  const activeJournal = filter.kind === "journal" ? journals.find((j) => j.id === filter.id) ?? null : null;

  const counts = useMemo(() => {
    const byJournal: Record<string, number> = {};
    for (const j of journals) byJournal[j.id] = entries.filter((e) => inJournal(e, j)).length;
    return {
      all: entries.length,
      journeys: entries.filter((e) => journeyInfo(e)).length,
      favorites: entries.filter((e) => e.favorite).length,
      byJournal,
    };
  }, [entries, journals]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter.kind === "journeys" && !journeyInfo(e)) return false;
      if (filter.kind === "favorites" && !e.favorite) return false;
      if (filter.kind === "journal") {
        const j = journals.find((x) => x.id === filter.id);
        if (!j || !inJournal(e, j)) return false;
      }
      if (!q) return true;
      return `${entryTitle(e)} ${e.content ?? ""} ${(e.tags ?? []).join(" ")}`.toLowerCase().includes(q);
    });
  }, [entries, journals, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Reflection[]>();
    for (const e of visible) {
      const label = dayGroupLabel(e.created_at).split(" · ")[0];
      map.set(label, [...(map.get(label) ?? []), e]);
    }
    return [...map.entries()];
  }, [visible]);

  /* The open reflection is the one in the URL; with none, the right pane is a blank sheet. */
  const explicit = selectedParam ? entries.find((e) => e.id === selectedParam) ?? null : null;
  const selected = explicit;

  useEffect(() => {
    setMenuOpen(false);
  }, [selected?.id]);

  /* A journey entry shows the day's prompt it was written for. */
  const selJourney = selected ? journeyInfo(selected) : null;
  const selJourneyKey = selJourney ? `${selJourney.title}|${selJourney.day}` : "";
  useEffect(() => {
    if (!selJourney) return;
    let alive = true;
    loadJourneyPrompt(selJourney.title, selJourney.day).then((p) => alive && setPrompt(p));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selJourneyKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  const startWriting = (target: Writing) =>
    withTransition(() => {
      document.documentElement.classList.add("jx-writing");
      setWriting(target);
    });

  const finishWriting = (saved: Reflection | null) => {
    withTransition(() => {
      document.documentElement.classList.remove("jx-writing");
      setWriting(null);
      if (saved) {
        setEntries((prev) => [saved, ...prev.filter((e) => e.id !== saved.id)].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setFresh(saved.id);
      }
    });
    if (saved) {
      go({ r: saved.id });
      resolvePhotos(createClient(), [saved]).then((urls) => setPhotos((prev) => ({ ...prev, ...urls })));
    } else if (writeParam) go({});
  };

  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setFresh(null), 1600);
    return () => clearTimeout(t);
  }, [fresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("jx-writing", Boolean(writing));
    return () => document.documentElement.classList.remove("jx-writing");
  }, [writing]);

  const toggleFavorite = async (entry: Reflection) => {
    const next = !entry.favorite;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, favorite: next } : e)));
    await createClient().from("reflections").update({ favorite: next }).eq("id", entry.id);
  };

  const removeEntry = async (entry: Reflection) => {
    setMenuOpen(false);
    if (!window.confirm("Delete this reflection? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("reflections").delete().eq("id", entry.id);
    if (error) {
      setJournalError(error.message);
      return;
    }
    await removeStoredPhoto(supabase, entry.photo);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    go({ r: null });
  };

  /* ── Journals ── */
  const createJournal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = newJournal.trim();
    if (!userId || !value) return;
    setJournalError("");
    const { data, error } = await createClient()
      .from("journals")
      .insert([{ user_id: userId, title: value }])
      .select();
    if (error || !data?.[0]) {
      setJournalError(error?.message ?? "Could not create the journal.");
      return;
    }
    const created = data[0] as UserJournal;
    setJournals((prev) => [...prev, created]);
    setNewJournal("");
    setCreating(false);
    setFilter({ kind: "journal", id: created.id });
  };

  const renameJournal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = renameValue.trim();
    if (!activeJournal || !value || value === activeJournal.title) return setRenaming(false);
    setJournalError("");
    const { error } = await createClient().from("journals").update({ title: value }).eq("id", activeJournal.id);
    if (error) {
      setJournalError(error.message);
      return;
    }
    setJournals((prev) => prev.map((j) => (j.id === activeJournal.id ? { ...j, title: value } : j)));
    setRenaming(false);
  };

  const deleteJournal = async () => {
    if (!activeJournal) return;
    if (!window.confirm(`Delete the journal "${activeJournal.title}"? Its reflections stay in your Journal.`)) return;
    const { error } = await createClient().from("journals").delete().eq("id", activeJournal.id);
    if (error) {
      setJournalError(error.message);
      return;
    }
    setJournals((prev) => prev.filter((j) => j.id !== activeJournal.id));
    setFilter({ kind: "all" });
  };

  if (loading) {
    return <p className="text-body-sm" style={{ color: "var(--muted-foreground)", padding: "80px 0", textAlign: "center" }}>Loading…</p>;
  }

  const chips: { key: string; label: string; n: number; on: boolean; icon?: React.ReactNode; onClick: () => void }[] = [
    { key: "all", label: "All", n: counts.all, on: filter.kind === "all", onClick: () => setFilter({ kind: "all" }) },
    ...journals.map((j) => ({
      key: j.id,
      label: j.title,
      n: counts.byJournal[j.id] ?? 0,
      on: filter.kind === "journal" && filter.id === j.id,
      onClick: () => setFilter({ kind: "journal", id: j.id }),
    })),
    {
      key: "journeys",
      label: "From journeys",
      n: counts.journeys,
      on: filter.kind === "journeys",
      icon: <Compass size={14} aria-hidden="true" />,
      onClick: () => setFilter({ kind: "journeys" }),
    },
    {
      key: "favorites",
      label: "Favorites",
      n: counts.favorites,
      on: filter.kind === "favorites",
      icon: <Heart size={14} aria-hidden="true" />,
      onClick: () => setFilter({ kind: "favorites" }),
    },
  ];

  const selectedJourney = selected ? journeyInfo(selected) : null;
  const promptForSelected =
    prompt && selectedJourney && prompt.journeyTitle === selectedJourney.title && prompt.day === selectedJourney.day ? prompt : null;
  const selectedLabel = selected ? entryLabels(selected, journals)[0] : "";

  return (
    <div className="jx" data-open={explicit ? "true" : "false"}>
      {/* ── Left: find ── */}
      <section className="jl" aria-labelledby="jl-title">
        <div className="jl-head">
          <h1 id="jl-title" className="text-h2" style={{ margin: 0 }}>
            Journal
          </h1>
          <span className="jl-private">
            <Lock size={14} aria-hidden="true" />
            Private
          </span>
        </div>

        <label className="jl-search">
          <span className="hs-sr-only">Search your reflections</span>
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search your reflections" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className="jl-chips" role="group" aria-label="Filter by journal">
          {chips.map((c) => (
            <button key={c.key} type="button" className="jl-chip" aria-pressed={c.on} onClick={c.onClick}>
              {c.icon}
              {c.label}
              <span className="jl-n">{c.n}</span>
            </button>
          ))}
          <button
            type="button"
            className="jl-chip jl-chip-add"
            aria-label="New journal"
            aria-expanded={creating}
            onClick={() => setCreating((v) => !v)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>

        {creating ? (
          <form className="jl-form" onSubmit={createJournal}>
            <label className="hs-sr-only" htmlFor="new-journal">
              Journal name
            </label>
            <input
              id="new-journal"
              className="jl-input"
              autoFocus
              placeholder="Name your journal, e.g. Gratitude"
              value={newJournal}
              onChange={(e) => setNewJournal(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={!newJournal.trim()}>
              Create
            </Button>
            <button type="button" className="jl-icon" aria-label="Cancel" onClick={() => setCreating(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </form>
        ) : null}

        {activeJournal ? (
          renaming ? (
            <form className="jl-form" onSubmit={renameJournal}>
              <label className="hs-sr-only" htmlFor="rename-journal">
                New name
              </label>
              <input id="rename-journal" className="jl-input" autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
              <Button type="submit" size="sm">
                Save
              </Button>
              <button type="button" className="jl-icon" aria-label="Cancel" onClick={() => setRenaming(false)}>
                <X size={16} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="jl-manage">
              <button
                type="button"
                className="jl-link"
                onClick={() => {
                  setRenameValue(activeJournal.title);
                  setRenaming(true);
                }}
              >
                Rename {activeJournal.title}
              </button>
              <button type="button" className="jl-link jl-danger" onClick={deleteJournal}>
                Delete journal
              </button>
            </div>
          )
        ) : null}

        {journalError ? (
          <p className="hs-error" role="alert" style={{ margin: 0 }}>
            {journalError}
          </p>
        ) : null}


        {groups.length === 0 ? (
          <div className="jl-empty">
            {entries.length === 0 ? (
              <EmptyState icon={BookOpen} title="Your journal is empty" description="Everything you write, on your own or inside a journey, is kept here." />
            ) : activeJournal ? (
              <EmptyState icon={BookOpen} title={`Nothing in ${activeJournal.title} yet`} description="Choose this journal when you write and it will appear here." />
            ) : (
              <EmptyState
                icon={Search}
                title="Nothing matches that"
                description="Try a shorter word, or clear the search."
                actions={
                  <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <ul className="jl-list" role="list" aria-label="Reflections">
            {groups.map(([label, list]) => (
              <React.Fragment key={label}>
                <li className="jl-day" aria-hidden="true">
                  {label}
                </li>
                {list.map((e) => {
                  const on = selected?.id === e.id;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        className={`jl-row${on ? " on" : ""}${fresh === e.id ? " fresh" : ""}`}
                        aria-current={on ? "true" : undefined}
                        onClick={() => go({ r: e.id })}
                      >
                        <span className="jl-row-top">
                          <span className="jl-title">{entryTitle(e)}</span>
                          <span className="jl-time">{timeOf(e.created_at)}</span>
                        </span>
                        <span className="jl-snip">{entryBody(e.content)}</span>
                        <span className="jl-lab">
                          <span className="jl-lab-t">{entryLabels(e, journals)[0]}</span>
                          {e.favorite ? (
                            <span className="jl-fav" aria-label="Favorite">
                              <Heart size={14} fill="currentColor" aria-hidden="true" />
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </ul>
        )}
      </section>

      {/* ── Right: read ── */}
      <article className={`jr${writing ? " jr-away" : ""}`} aria-labelledby={selected ? "jr-title" : undefined}>
        {selected ? (
          <>
            <div className="jr-bar">
              <button type="button" className="jr-btn jr-back" onClick={() => go({ r: null })}>
                <ArrowLeft size={18} aria-hidden="true" />
                Journal
              </button>
              <span className="jr-meta">{fullDate(selected.created_at)}</span>
              <div className="jr-actions">
                <button type="button" className="jr-btn jr-new" onClick={() => go({ r: null })}>
                  <Plus size={16} aria-hidden="true" />
                  New
                </button>
                <button
                  type="button"
                  className="jr-btn"
                  aria-label={selected.favorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={Boolean(selected.favorite)}
                  onClick={() => toggleFavorite(selected)}
                >
                  <Heart size={18} fill={selected.favorite ? "currentColor" : "none"} aria-hidden="true" style={{ color: selected.favorite ? "var(--primary)" : undefined }} />
                </button>
                <button type="button" className="jr-btn pri" onClick={() => startWriting({ id: selected.id, focus: "text" })}>
                  <PenLine size={16} aria-hidden="true" />
                  Edit
                </button>
                <div className="jr-menu-wrap" ref={menuRef}>
                  <button type="button" className="jr-btn" aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                  {menuOpen ? (
                    <div className="jr-menu" role="menu">
                      <button type="button" role="menuitem" className="jr-menu-item danger" onClick={() => removeEntry(selected)}>
                        <Trash2 size={16} aria-hidden="true" />
                        Delete reflection
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="jr-body">
              <h2 id="jr-title" className="text-h1 jr-title">
                {entryTitle(selected)}
              </h2>
              {promptForSelected ? <JourneyPromptCard key={selected.id} data={promptForSelected} /> : null}
              {selectedLabel && !promptForSelected ? (
                <span className="jr-tag">
                  {selectedJourney ? <Compass size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
                  {selectedLabel}
                </span>
              ) : null}
              <div className="jr-text">
                {paragraphs(entryBody(selected.content)).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {photos[selected.id] ? (
                <div className="jr-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[selected.id]} alt="Photo attached to this reflection" />
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="js" aria-label="Start a new reflection">
            <span className="js-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            <button type="button" className="js-title" onClick={() => startWriting({ focus: "title" })}>
              Title
            </button>
            <button type="button" className="js-text" onClick={() => startWriting({ focus: "text" })}>
              What&apos;s on your mind today?
            </button>
            <button type="button" className="js-rest" aria-hidden="true" tabIndex={-1} onClick={() => startWriting({ focus: "text" })} />
          </div>
        )}
      </article>

      {writing ? (
        <ReflectionEditor
          key={writing.id ?? "new"}
          id={writing.id}
          initialJournalId={activeJournal?.id ?? null}
          embedded
          focusField={writing.focus}
          journeyPrompt={writing.id && promptForSelected && selected?.id === writing.id ? promptForSelected : null}
          onDone={finishWriting}
          preloaded={
            userId
              ? {
                  userId,
                  journals,
                  entry: writing.id ? entries.find((e) => e.id === writing.id) ?? null : null,
                  photoUrl: writing.id ? photos[writing.id] ?? null : null,
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalPageInner />
    </Suspense>
  );
}
