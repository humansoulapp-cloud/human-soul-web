"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Camera, Check, Compass, Heart, Lock, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserJournal } from "@/lib/journal";
import {
  MAX_PHOTO_BYTES,
  entryTitle,
  journeyInfo,
  removeStoredPhoto,
  resolvePhotos,
  uploadPhoto,
  type Reflection,
} from "@/lib/reflections";
import { Button, Chip, EmptyState, Icon, Input, Textarea } from "@/components/ds";

const DRAFT_KEY = "humansoul:reflect-draft";

/** Journey entries are saved with a "[Journey - Day N: Title]" first line; it stays untouched. */
function splitHeader(content: string) {
  const text = content.trim();
  if (text.startsWith("[") && text.includes("]")) {
    const end = text.indexOf("]") + 1;
    return { header: text.slice(0, end), body: text.slice(end).trim() };
  }
  return { header: "", body: text };
}

/**
 * Focus editor for one reflection — new (`id` omitted) or existing.
 * No app navigation: a back link, the writing area, a details panel and a
 * fixed action bar. Desktop puts the panel beside the text; mobile below it.
 */
export default function ReflectionEditor({ id, initialJournalId }: { id?: string; initialJournalId?: string | null }) {
  const router = useRouter();
  const isNew = !id;
  const fileInput = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [entry, setEntry] = useState<Reflection | null>(null);
  const [journals, setJournals] = useState<UserJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [header, setHeader] = useState("");
  const [journalId, setJournalId] = useState<string>(initialJournalId ?? "");
  const [favorite, setFavorite] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [creatingJournal, setCreatingJournal] = useState(false);
  const [newJournal, setNewJournal] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }
      setUserId(user.id);

      const { data: journalRows } = await supabase
        .from("journals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const list = (journalRows ?? []) as UserJournal[];
      setJournals(list);

      if (id) {
        const { data } = await supabase.from("reflections").select("*").eq("id", id).maybeSingle();
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const row = data as Reflection;
        const parts = splitHeader(row.content ?? "");
        setEntry(row);
        setHeader(parts.header);
        setBody(parts.body);
        setTitle(row.title?.trim() || (parts.header ? entryTitle(row) : ""));
        setFavorite(Boolean(row.favorite));
        const byTag = list.find((j) => (row.tags ?? []).includes(j.title));
        setJournalId(row.journal_id ?? byTag?.id ?? "");
        if (row.photo) {
          const urls = await resolvePhotos(supabase, [row]);
          setPhotoUrl(urls[row.id] || null);
        }
      } else {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (stored) setBody(stored);
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  // New reflections keep a draft while you type, until they are saved
  useEffect(() => {
    if (!isNew || loading) return;
    if (body) localStorage.setItem(DRAFT_KEY, body);
    else localStorage.removeItem(DRAFT_KEY);
  }, [body, isNew, loading]);

  const journey = entry ? journeyInfo(entry) : null;
  const journal = journals.find((j) => j.id === journalId) ?? null;
  const backHref = journal ? `/journal?journal_id=${journal.id}` : "/journal";

  const status = useMemo(() => {
    if (saving) return "Saving…";
    if (dirty) return "Unsaved changes";
    if (isNew) return "Draft kept as you type";
    const at = entry?.updated_at || entry?.created_at;
    return at ? `Saved ${new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Saved";
  }, [saving, dirty, isNew, entry]);

  const touch = () => setDirty(true);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("That photo is larger than 10 MB. Try a smaller one.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoRemoved(false);
    touch();
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoUrl(null);
    setPhotoRemoved(true);
    if (fileInput.current) fileInput.current.value = "";
    touch();
  };

  const createJournal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = newJournal.trim();
    if (!userId || !value) return;
    const { data, error: err } = await createClient()
      .from("journals")
      .insert([{ user_id: userId, title: value }])
      .select();
    if (err || !data?.[0]) {
      setError(err?.message ?? "Could not create the journal.");
      return;
    }
    const created = data[0] as UserJournal;
    setJournals((prev) => [...prev, created]);
    setJournalId(created.id);
    setNewJournal("");
    setCreatingJournal(false);
    touch();
  };

  /** Journal titles live in `tags` too (older entries); swap the old one for the new one. */
  const nextTags = () => {
    const journalTitles = new Set(journals.map((j) => j.title));
    const kept = (entry?.tags ?? []).filter((t) => !journalTitles.has(t));
    return journal ? [...kept, journal.title] : kept;
  };

  const save = async () => {
    if (!userId || !body.trim()) {
      setError("Write something before saving.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      let photo: string | null | undefined = undefined;
      if (photoFile) photo = await uploadPhoto(supabase, userId, photoFile);
      else if (photoRemoved) photo = null;

      const content = header ? `${header}\n\n${body.trim()}` : body.trim();
      const fields: Record<string, unknown> = {
        title: title.trim() || null,
        content,
        tags: nextTags(),
        journal_id: journey ? entry?.journal_id ?? null : journal?.id ?? null,
        favorite,
      };
      if (photo !== undefined) fields.photo = photo;

      if (isNew) {
        const { error: err } = await supabase.from("reflections").insert([{ ...fields, user_id: userId }]);
        if (err) throw new Error(err.message);
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const { error: err } = await supabase
          .from("reflections")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id as string);
        if (err) throw new Error(err.message);
        // The old stored photo is no longer referenced
        if (photo !== undefined && entry?.photo && entry.photo !== photo) await removeStoredPhoto(supabase, entry.photo);
      }
      setDirty(false);
      router.push(backHref);
      router.refresh();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Could not save your reflection."} Your text is still here; try again.`);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry) return;
    if (!window.confirm("Delete this reflection? This cannot be undone.")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("reflections").delete().eq("id", entry.id);
    if (err) {
      setError(err.message);
      return;
    }
    await removeStoredPhoto(supabase, entry.photo);
    router.push(backHref);
    router.refresh();
  };

  const cancel = () => {
    if (dirty && !window.confirm("Leave without saving your changes?")) return;
    router.push(backHref);
  };

  if (loading) {
    return <p className="text-body-sm" style={{ color: "var(--muted-foreground)", padding: "80px 0", textAlign: "center" }}>Loading…</p>;
  }

  if (notFound) {
    return (
      <div className="hs-container" style={{ padding: "64px 16px" }}>
        <EmptyState
          icon={BookOpen}
          title="This reflection is not here"
          description="It may have been deleted, or the link is not quite right."
          actions={<Button href="/journal">Back to your Journal</Button>}
        />
      </div>
    );
  }

  const when = new Date(entry?.created_at ?? Date.now());
  const overline = `${isNew ? "New reflection" : "Edit reflection"} · ${when.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })} · ${when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)", color: "var(--foreground)" }}>
      <header className="hs-editor-head">
        <div className="hs-editor-head-in">
          <Link href={backHref} className="hs-pill-link hs-focusable" style={{ justifySelf: "start" }}>
            <Icon icon={ArrowLeft} size={20} />
            Journal
          </Link>
          <span className="hs-meta hs-editor-head-mid" style={{ fontWeight: 500, color: "var(--foreground)" }}>
            {journey ? journey.title : journal ? journal.title : "Free writing"}
          </span>
          <span className="hs-meta" role="status" style={{ justifySelf: "end" }}>
            {!dirty && !saving ? <Icon icon={Check} size={16} /> : null}
            {status}
          </span>
        </div>
      </header>

      <main className="hs-container hs-editor" style={{ flex: 1 }}>
        <div className="hs-editor-main">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
              {overline}
            </span>
            <h1 style={{ margin: 0 }}>
              <label className="hs-sr-only" htmlFor="editor-title">
                Title
              </label>
              <input
                id="editor-title"
                className="hs-title-input lg"
                type="text"
                placeholder="Give it a title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  touch();
                }}
              />
            </h1>
          </div>
          <label className="hs-sr-only" htmlFor="editor-body">
            Reflection
          </label>
          <Textarea
            id="editor-body"
            writing
            rows={12}
            autoFocus={isNew}
            placeholder="Write as it comes. No one else reads this."
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              touch();
            }}
          />
          {error ? (
            <p className="hs-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="hs-editor-aside" aria-label="Reflection details">
          {journey ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
                From a journey
              </span>
              <span className="hs-meta" style={{ color: "var(--foreground)" }}>
                <Icon icon={Compass} size={16} />
                {journey.title} · Day {journey.day}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="text-overline" style={{ color: "var(--muted-foreground)" }} id="journal-label">
                Journal
              </span>
              <div className="hs-scroll-row" role="group" aria-labelledby="journal-label">
                <Chip
                  selected={!journalId}
                  onClick={() => {
                    setJournalId("");
                    touch();
                  }}
                >
                  No journal
                </Chip>
                {journals.map((j) => (
                  <Chip
                    key={j.id}
                    icon={BookOpen}
                    selected={journalId === j.id}
                    onClick={() => {
                      setJournalId(j.id);
                      touch();
                    }}
                  >
                    {j.title}
                  </Chip>
                ))}
                <Chip icon={Plus} selected={creatingJournal} onClick={() => setCreatingJournal((v) => !v)}>
                  New journal
                </Chip>
              </div>
              {creatingJournal ? (
                <form style={{ display: "flex", gap: 8, flexWrap: "wrap" }} onSubmit={createJournal}>
                  <label className="hs-sr-only" htmlFor="editor-new-journal">
                    Journal name
                  </label>
                  <Input
                    id="editor-new-journal"
                    autoFocus
                    placeholder="Journal name"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    className="flex-1 min-w-[160px]"
                  />
                  <Button type="submit" disabled={!newJournal.trim()}>
                    Create
                  </Button>
                </form>
              ) : null}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="text-overline" style={{ color: "var(--muted-foreground)" }}>
              Photo
            </span>
            {photoUrl ? (
              <div className="hs-photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Attached photo" />
              </div>
            ) : null}
            <input ref={fileInput} type="file" accept="image/*" onChange={onPhoto} className="hs-sr-only" tabIndex={-1} aria-hidden="true" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant="secondary" icon={Camera} onClick={() => fileInput.current?.click()}>
                {photoUrl ? "Replace photo" : "Add photo"}
              </Button>
              {photoUrl ? (
                <Button variant="ghost" icon={X} onClick={removePhoto}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              className="hs-link-btn"
              style={{ color: favorite ? "var(--destructive)" : "var(--muted-foreground)", justifyContent: "flex-start" }}
              aria-pressed={favorite}
              onClick={() => {
                setFavorite((v) => !v);
                touch();
              }}
            >
              <Heart width={16} height={16} strokeWidth={2} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
              {favorite ? "In Favorites" : "Add to Favorites"}
            </button>
            <span className="hs-meta">
              <Icon icon={Lock} size={16} />
              Only you can read this
            </span>
          </div>
        </aside>
      </main>

      <div className="hs-actionbar">
        <div className="hs-actionbar-in">
          {!isNew ? (
            <button type="button" className="hs-del hs-focusable" onClick={remove} aria-label="Delete reflection">
              <Icon icon={Trash2} size={18} />
              <span className="hs-del-label">Delete reflection</span>
            </button>
          ) : null}
          <span style={{ flex: 1 }} />
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button icon={Check} onClick={save} loading={saving} disabled={!body.trim()}>
            {isNew ? "Save Reflection" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
