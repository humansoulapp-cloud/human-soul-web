"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Camera, Compass, Heart, Lock, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserJournal } from "@/lib/journal";
import {
  MAX_PHOTO_BYTES,
  dayGroupLabel,
  entryBody,
  entryLabels,
  entryTitle,
  inJournal,
  journeyInfo,
  longDate,
  resolvePhotos,
  uploadPhoto,
  type Reflection,
} from "@/lib/reflections";
import { Button, Chip, EmptyState, Icon, Input, ReflectionCard, Select, Textarea } from "@/components/ds";

type Filter = { kind: "all" } | { kind: "journeys" } | { kind: "favorites" } | { kind: "journal"; id: string };

function JournalPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const journalParam = params.get("journal_id");
  const filterParam = params.get("filter");
  const entryParam = params.get("entry");
  const newJournalParam = params.get("new_journal");

  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Reflection[]>([]);
  const [journals, setJournals] = useState<UserJournal[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Composer
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [composerJournal, setComposerJournal] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [composerError, setComposerError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Journal management
  const [creating, setCreating] = useState(Boolean(newJournalParam));
  const [newJournal, setNewJournal] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [journalError, setJournalError] = useState("");

  const filter: Filter = journalParam
    ? { kind: "journal", id: journalParam }
    : filterParam === "journeys"
      ? { kind: "journeys" }
      : filterParam === "favorites"
        ? { kind: "favorites" }
        : { kind: "all" };

  // Old links opened an entry inside the feed; entries now have their own page.
  useEffect(() => {
    if (entryParam) router.replace(`/journal/${entryParam}`);
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

  useEffect(() => {
    if (filter.kind === "journal") setComposerJournal(filter.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalParam]);

  const setFilter = useCallback(
    (next: Filter) => {
      setRenaming(false);
      const url =
        next.kind === "journal"
          ? `/journal?journal_id=${next.id}`
          : next.kind === "all"
            ? "/journal"
            : `/journal?filter=${next.kind}`;
      router.replace(url, { scroll: false });
    },
    [router]
  );

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
      const label = dayGroupLabel(e.created_at);
      map.set(label, [...(map.get(label) ?? []), e]);
    }
    return [...map.entries()];
  }, [visible]);

  const toggleFavorite = async (entry: Reflection) => {
    const next = !entry.favorite;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, favorite: next } : e)));
    await createClient().from("reflections").update({ favorite: next }).eq("id", entry.id);
  };

  /* ── Composer ── */
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_PHOTO_BYTES) {
      setComposerError("That photo is larger than 10 MB. Try a smaller one.");
      return;
    }
    setComposerError("");
    setPhotoFile(file);
  };

  const saveReflection = async () => {
    if (!userId || !draft.trim()) return;
    setSaving(true);
    setComposerError("");
    const supabase = createClient();
    try {
      const photo = photoFile ? await uploadPhoto(supabase, userId, photoFile) : null;
      const journal = journals.find((j) => j.id === composerJournal);
      const { data, error } = await supabase
        .from("reflections")
        .insert([
          {
            user_id: userId,
            title: title.trim() || null,
            content: draft.trim(),
            tags: journal ? [journal.title] : [],
            journal_id: journal ? journal.id : null,
            photo,
            favorite: false,
          },
        ])
        .select();
      if (error || !data?.[0]) throw new Error(error?.message ?? "Could not save your reflection.");
      const saved = data[0] as Reflection;
      setEntries((prev) => [saved, ...prev]);
      if (photo && photoFile) {
        const preview = URL.createObjectURL(photoFile);
        setPhotos((prev) => ({ ...prev, [saved.id]: preview }));
      }
      setTitle("");
      setDraft("");
      setPhotoFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setComposerError(
        `${err instanceof Error ? err.message : "Could not save your reflection."} Your text is still here; try again.`
      );
    } finally {
      setSaving(false);
    }
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

  const first = activeJournal ? visible[visible.length - 1] : null;
  const journalOptions = [{ value: "", label: "No journal" }, ...journals.map((j) => ({ value: j.id, label: j.title }))];

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <span className="hs-kind">
            <Icon icon={BookOpen} size={16} />
            Free writing
          </span>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Your Journal
          </h1>
          <p className="text-body-lg hidden md:block" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            No prompts and no streaks. A private place for whatever is on your mind.
          </p>
        </div>
        <span className="hs-meta">
          <Icon icon={Lock} size={16} />
          Only you can read this
        </span>
      </div>

      {/* Mobile: a quiet entry point that opens the full-screen editor */}
      <div className="md:hidden">
        <Link
          className="hs-prompt hs-focusable"
          href={activeJournal ? `/journal/new?journal_id=${activeJournal.id}` : "/journal/new"}
        >
          <span className="hs-prompt-ico">
            <Icon icon={PenLine} size={20} />
          </span>
          <span>What&apos;s on your mind today?</span>
        </Link>
      </div>

      {/* Tablet and desktop: write in place */}
      <div className="hidden md:block">
        <section className="hs-composer" aria-label="Write a reflection">
          <label className="hs-sr-only" htmlFor="composer-title">
            Title
          </label>
          <input
            id="composer-title"
            className="hs-title-input"
            type="text"
            placeholder="Give it a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="hs-sr-only" htmlFor="composer-text">
            Reflection
          </label>
          <Textarea
            id="composer-text"
            writing
            rows={4}
            placeholder="What's on your mind today?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {photoFile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="hs-meta">
                <Icon icon={Camera} size={16} />
                {photoFile.name}
              </span>
              <button
                type="button"
                className="hs-link-btn"
                onClick={() => {
                  setPhotoFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <Icon icon={X} size={16} />
                Remove
              </button>
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <label className="hs-meta" htmlFor="composer-journal">
              Journal
            </label>
            <Select
              id="composer-journal"
              options={journalOptions}
              value={composerJournal}
              onChange={(e) => setComposerJournal(e.target.value)}
              style={{ width: 200 }}
            />
            <input ref={fileInput} type="file" accept="image/*" onChange={onPhoto} className="hs-sr-only" tabIndex={-1} aria-hidden="true" />
            <Button variant="ghost" icon={Camera} onClick={() => fileInput.current?.click()}>
              Add photo
            </Button>
            <span style={{ flex: 1 }} />
            <Button onClick={saveReflection} disabled={!draft.trim()} loading={saving}>
              Save Reflection
            </Button>
          </div>
          {composerError ? (
            <p className="hs-error" role="alert">
              {composerError}
            </p>
          ) : null}
        </section>
      </div>

      <section className="hs-sec" aria-labelledby="journal-list" style={{ gap: 20 }}>
        <div className="hs-sec-head" style={{ alignItems: "center" }}>
          <h2 id="journal-list" className="text-h3" style={{ margin: 0 }}>
            {activeJournal ? activeJournal.title : "All reflections"}
          </h2>
          <Input
            icon={Search}
            placeholder="Search your reflections"
            aria-label="Search your reflections"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-[300px]"
          />
        </div>

        <div className="hs-scroll-row" role="group" aria-label="Filter by journal">
          <Chip selected={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })}>
            All · {counts.all}
          </Chip>
          {journals.map((j) => (
            <Chip
              key={j.id}
              icon={BookOpen}
              selected={filter.kind === "journal" && filter.id === j.id}
              onClick={() => setFilter({ kind: "journal", id: j.id })}
            >
              {j.title} · {counts.byJournal[j.id] ?? 0}
            </Chip>
          ))}
          <Chip icon={Compass} selected={filter.kind === "journeys"} onClick={() => setFilter({ kind: "journeys" })}>
            From journeys · {counts.journeys}
          </Chip>
          <Chip icon={Heart} selected={filter.kind === "favorites"} onClick={() => setFilter({ kind: "favorites" })}>
            Favorites · {counts.favorites}
          </Chip>
          <Chip icon={Plus} selected={creating} onClick={() => setCreating((v) => !v)}>
            New journal
          </Chip>
        </div>

        {creating ? (
          <form className="hs-filter-sum" onSubmit={createJournal}>
            <label className="hs-sr-only" htmlFor="new-journal">
              Journal name
            </label>
            <Input
              id="new-journal"
              autoFocus
              placeholder="Name your journal, e.g. Gratitude"
              value={newJournal}
              onChange={(e) => setNewJournal(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button type="submit" disabled={!newJournal.trim()}>
              Create journal
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </form>
        ) : null}

        {activeJournal ? (
          renaming ? (
            <form className="hs-filter-sum" onSubmit={renameJournal}>
              <label className="hs-sr-only" htmlFor="rename-journal">
                New name
              </label>
              <Input
                id="rename-journal"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Button type="submit">Save name</Button>
              <Button variant="ghost" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <div className="hs-filter-sum" role="status">
              <Icon icon={BookOpen} size={20} />
              <span style={{ font: "500 15px/20px var(--hs-font-sans)" }}>Showing {activeJournal.title}</span>
              <span className="hs-meta">
                {visible.length} {visible.length === 1 ? "reflection" : "reflections"}
                {first ? ` · since ${longDate(first.created_at, false)}` : ""}
              </span>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="hs-link-btn"
                onClick={() => {
                  setRenameValue(activeJournal.title);
                  setRenaming(true);
                }}
              >
                <Icon icon={PenLine} size={16} />
                Rename
              </button>
              <button type="button" className="hs-link-btn" style={{ color: "var(--destructive)" }} onClick={deleteJournal}>
                <Icon icon={Trash2} size={16} />
                Delete
              </button>
              <button
                type="button"
                className="hs-link-btn"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => setFilter({ kind: "all" })}
              >
                <Icon icon={X} size={16} />
                Clear filter
              </button>
            </div>
          )
        ) : null}

        {journalError ? (
          <p className="hs-error" role="alert">
            {journalError}
          </p>
        ) : null}

        {groups.length === 0 ? (
          entries.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Your journal is empty"
              description="Everything you write, on your own or inside a journey, is kept here."
              actions={<Button href="/journal/new" icon={PenLine}>Write your first reflection</Button>}
            />
          ) : activeJournal ? (
            <EmptyState
              icon={BookOpen}
              title={`Nothing in ${activeJournal.title} yet`}
              description="Choose this journal when you save a reflection and it will appear here."
              actions={<Button href={`/journal/new?journal_id=${activeJournal.id}`} icon={PenLine}>Reflect</Button>}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="Nothing matches that"
              description="Try a shorter word, or clear the filter to see every reflection again."
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter({ kind: "all" });
                  }}
                >
                  Clear search and filter
                </Button>
              }
            />
          )
        ) : (
          groups.map(([label, list]) => (
            <React.Fragment key={label}>
              <span className="hs-day">{label}</span>
              {list.map((e) => (
                <ReflectionCard
                  key={e.id}
                  href={`/journal/${e.id}`}
                  date={longDate(e.created_at)}
                  title={entryTitle(e)}
                  text={entryBody(e.content)}
                  tags={entryLabels(e, journals)}
                  photo={photos[e.id] || null}
                  favorite={Boolean(e.favorite)}
                  onToggleFavorite={() => toggleFavorite(e)}
                />
              ))}
            </React.Fragment>
          ))
        )}
      </section>
    </>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalPageInner />
    </Suspense>
  );
}
