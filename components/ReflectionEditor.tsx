"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Camera, Check, ChevronDown, Compass, Plus, X } from "lucide-react";
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
import { Button, EmptyState } from "@/components/ds";
import PageLoader from "@/components/PageLoader";

const DRAFT_KEY = "humansoul:reflect-draft";
const TITLE_KEY = "humansoul:reflect-draft-title";

/** Journey entries are saved with a "[Journey - Day N: Title]" first line; it stays untouched. */
function splitHeader(content: string) {
  const text = content.trim();
  if (text.startsWith("[") && text.includes("]")) {
    const end = text.indexOf("]") + 1;
    return { header: text.slice(0, end), body: text.slice(end).trim() };
  }
  return { header: "", body: text };
}

function words(text: string) {
  const n = text.trim() ? text.trim().split(/\s+/).length : 0;
  return `${n} ${n === 1 ? "word" : "words"}`;
}

function store(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage can be unavailable; the text stays on screen */
  }
}

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/**
 * Focus writing (canvas «App / Journal · New reflection»): nothing but the page.
 * A quiet top bar (close, the journal it saves to, Done), the date, a title and
 * the text. Photo and word count sit at the bottom. New and existing reflections.
 */
export default function ReflectionEditor({
  id,
  initialJournalId,
  embedded = false,
  focusField = "text",
  onDone,
  preloaded,
}: {
  id?: string;
  initialJournalId?: string | null;
  /** Inside the Journal page: it opens over the page and hands back instead of navigating. */
  embedded?: boolean;
  focusField?: "title" | "text";
  /** Called with the saved reflection, or null when closed without saving. */
  onDone?: (saved: Reflection | null) => void;
  /** Data the Journal page already has, so the page opens without a loading step. */
  preloaded?: { userId: string; journals: UserJournal[]; entry?: Reflection | null; photoUrl?: string | null };
}) {
  const router = useRouter();
  const isNew = !id;
  const fileInput = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [init] = useState(() => {
    if (!preloaded) return null;
    const row = id ? preloaded.entry ?? null : null;
    if (id && !row) return null;
    const parts = splitHeader(row?.content ?? "");
    const byTag = row ? preloaded.journals.find((j) => (row.tags ?? []).includes(j.title)) : undefined;
    return {
      row,
      header: parts.header,
      body: row ? parts.body : read(DRAFT_KEY),
      title: row ? row.title?.trim() || (parts.header ? entryTitle(row) : "") : read(TITLE_KEY),
      journalId: row ? row.journal_id ?? byTag?.id ?? "" : initialJournalId ?? "",
    };
  });
  const [userId, setUserId] = useState<string | null>(init ? preloaded!.userId : null);
  const [entry, setEntry] = useState<Reflection | null>(init?.row ?? null);
  const [journals, setJournals] = useState<UserJournal[]>(init ? preloaded!.journals : []);
  const [loading, setLoading] = useState(!init);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState(init?.title ?? "");
  const [body, setBody] = useState(init?.body ?? "");
  const [header, setHeader] = useState(init?.header ?? "");
  const [journalId, setJournalId] = useState<string>(init?.journalId ?? initialJournalId ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(init ? preloaded!.photoUrl ?? null : null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [creatingJournal, setCreatingJournal] = useState(false);
  const [newJournal, setNewJournal] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (init) return;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!embedded) router.push("/sign-in");
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
        const byTag = list.find((j) => (row.tags ?? []).includes(j.title));
        setJournalId(row.journal_id ?? byTag?.id ?? "");
        if (row.photo) {
          const urls = await resolvePhotos(supabase, [row]);
          setPhotoUrl(urls[row.id] || null);
        }
      } else {
        setBody(read(DRAFT_KEY));
        setTitle(read(TITLE_KEY));
      }
      setLoading(false);
    }
    load();
  }, [id, router, init, embedded]);

  // A new reflection is kept on this device while you write, until it is saved.
  useEffect(() => {
    if (!isNew || loading) return;
    store(DRAFT_KEY, body);
    store(TITLE_KEY, title);
  }, [body, title, isNew, loading]);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPickerOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [pickerOpen]);

  const journey = entry ? journeyInfo(entry) : null;
  const journal = journals.find((j) => j.id === journalId) ?? null;
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
    setPickerOpen(false);
    touch();
  };

  /** Journal titles live in `tags` too (older entries); swap the old one for the new one. */
  const nextTags = () => {
    const journalTitles = new Set(journals.map((j) => j.title));
    const kept = (entry?.tags ?? []).filter((t) => !journalTitles.has(t));
    return journal ? [...kept, journal.title] : kept;
  };

  const save = async () => {
    if (!userId || !body.trim()) return;
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
      };
      if (photo !== undefined) fields.photo = photo;

      let saved: Reflection;
      if (isNew) {
        const { data, error: err } = await supabase
          .from("reflections")
          .insert([{ ...fields, user_id: userId, favorite: false }])
          .select("*");
        if (err || !data?.[0]) throw new Error(err?.message ?? "Could not save your reflection.");
        saved = data[0] as Reflection;
        store(DRAFT_KEY, "");
        store(TITLE_KEY, "");
      } else {
        const { data, error: err } = await supabase
          .from("reflections")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id as string)
          .select("*");
        if (err || !data?.[0]) throw new Error(err?.message ?? "Could not save your changes.");
        saved = data[0] as Reflection;
        // The old stored photo is no longer referenced
        if (photo !== undefined && entry?.photo && entry.photo !== photo) await removeStoredPhoto(supabase, entry.photo);
      }
      setDirty(false);
      if (onDone) {
        setSaving(false);
        onDone(saved);
        return;
      }
      router.push(`/journal?r=${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Could not save your reflection."} Your text is still here; try again.`);
      setSaving(false);
    }
  };

  const close = () => {
    // A new reflection keeps its draft; changes to a saved one would be lost.
    if (!isNew && dirty && !window.confirm("Leave without saving your changes?")) return;
    if (onDone) return onDone(null);
    router.push(id ? `/journal?r=${id}` : "/journal");
  };

  if (loading) {
    return embedded ? <div className="fw fw-embedded" /> : <PageLoader />;
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
  const dateLabel = when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={`fw${embedded ? " fw-embedded" : ""}`}>
      <header className="fw-bar">
        <button type="button" className="fw-close" aria-label="Close and go back to Journal" onClick={close}>
          <X size={20} aria-hidden="true" />
        </button>

        {journey ? (
          <span className="fw-journal is-static">
            <Compass size={14} aria-hidden="true" />
            {journey.title} · Day {journey.day}
          </span>
        ) : (
          <div className="fw-picker" ref={pickerRef}>
            <button
              type="button"
              className="fw-journal"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              aria-label={`Saving to ${journal ? journal.title : "no journal"}. Change journal`}
              onClick={() => setPickerOpen((v) => !v)}
            >
              <BookOpen size={14} aria-hidden="true" />
              {journal ? journal.title : "No journal"}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {pickerOpen ? (
              <div className="fw-menu" role="listbox" aria-label="Journal">
                {[{ id: "", title: "No journal" }, ...journals].map((j) => (
                  <button
                    key={j.id || "none"}
                    type="button"
                    role="option"
                    aria-selected={journalId === j.id}
                    className="fw-menu-item"
                    onClick={() => {
                      setJournalId(j.id);
                      setPickerOpen(false);
                      touch();
                    }}
                  >
                    <span>{j.title}</span>
                    {journalId === j.id ? <Check size={16} aria-hidden="true" /> : null}
                  </button>
                ))}
                {creatingJournal ? (
                  <form className="fw-menu-form" onSubmit={createJournal}>
                    <label className="hs-sr-only" htmlFor="fw-new-journal">
                      Journal name
                    </label>
                    <input
                      id="fw-new-journal"
                      autoFocus
                      placeholder="Journal name"
                      value={newJournal}
                      onChange={(e) => setNewJournal(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={!newJournal.trim()}>
                      Create
                    </Button>
                  </form>
                ) : (
                  <button type="button" className="fw-menu-item add" onClick={() => setCreatingJournal(true)}>
                    <Plus size={16} aria-hidden="true" />
                    New journal
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="fw-right">
          <Button variant="secondary" size="sm" onClick={save} loading={saving} disabled={!body.trim()}>
            {saving ? "Saving…" : "Done"}
          </Button>
        </div>
      </header>

      <main className="fw-page">
        <span className="fw-date">{dateLabel}</span>
        <label className="hs-sr-only" htmlFor="fw-title">
          Title
        </label>
        <input
          id="fw-title"
          className="fw-title"
          type="text"
          autoFocus={focusField === "title"}
          placeholder="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            touch();
          }}
        />
        <label className="hs-sr-only" htmlFor="fw-text">
          Your reflection
        </label>
        <textarea
          id="fw-text"
          className="fw-text"
          autoFocus={focusField === "text" && (isNew || embedded)}
          placeholder="What's on your mind today?"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            touch();
          }}
        />
        {photoUrl ? (
          <div className="fw-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Attached photo" />
            <button type="button" className="fw-photo-x" aria-label="Remove photo" onClick={removePhoto}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="hs-error" role="alert">
            {error}
          </p>
        ) : null}
      </main>

      <footer className="fw-foot">
        <input ref={fileInput} type="file" accept="image/*" onChange={onPhoto} className="hs-sr-only" tabIndex={-1} aria-hidden="true" />
        <button type="button" className="fw-icon" aria-label={photoUrl ? "Replace photo" : "Add a photo"} onClick={() => fileInput.current?.click()}>
          <Camera size={18} aria-hidden="true" />
        </button>
        <span className="fw-meta">{words(body)}</span>
      </footer>
    </div>
  );
}
