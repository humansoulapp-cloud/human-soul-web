"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_TAGS, REFLECT_PROMPTS, wordCount } from "@/lib/journal";

const DRAFT_KEY = "humansoul:reflect-draft";

const PRIMARY_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60";
const GHOST_BTN =
  "px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px] whitespace-nowrap transition-colors cursor-pointer";
const MICRO = "text-[10.5px] font-semibold tracking-[0.11em] text-[var(--ds-text-muted)]";

export default function ReflectPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // "Draft kept as you type" — it survives a reload until the entry is saved
  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) setDraft(stored);
  }, []);

  useEffect(() => {
    if (saved) return;
    if (draft) localStorage.setItem(DRAFT_KEY, draft);
    else localStorage.removeItem(DRAFT_KEY);
  }, [draft, saved]);

  const words = wordCount(draft);

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!draft.trim()) {
      setError("Write something before saving.");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("You must be signed in to save your reflection.");
      return;
    }

    const { error: insertError } = await supabase.from("reflections").insert([
      {
        user_id: user.id,
        content: draft.trim(),
        tags,
        photo,
        favorite: false,
      },
    ]);

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    setSaved(true);
  };

  const today = new Date();

  if (saved) {
    const tagNote = tags.length ? `, tagged ${tags.join(", ").toLowerCase()}` : "";
    return (
      <div className="w-full max-w-[760px] mx-auto py-20 text-center">
        <span className="w-[52px] h-[52px] mx-auto rounded-full grid place-items-center bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] border border-[var(--ds-accent)]">
          <Check className="w-5 h-5" strokeWidth={2.2} />
        </span>
        <h1 className="text-[28px] font-semibold mt-5 mb-2.5">
          Saved to{" "}
          {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="text-[15px] leading-[1.7] opacity-80 max-w-[40ch] mx-auto mb-[26px]">
          {words} words{tagNote}. It is in your journal whenever you want to reread it.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/journal" className={PRIMARY_BTN}>
            Open journal
          </Link>
          <button
            onClick={() => {
              setSaved(false);
              setDraft("");
              setTags([]);
              setPhoto(null);
              setPromptIndex((i) => (i + 1) % REFLECT_PROMPTS.length);
            }}
            className={GHOST_BTN}
          >
            Write another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[760px] mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/journal"
          className="inline-flex items-center gap-[7px] text-[12.5px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to journal
        </Link>
        <span className="flex-1" />
        <span className={MICRO}>
          {today
            .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
            .toUpperCase()}
        </span>
      </div>

      <div className="flex items-start gap-3.5 mt-[26px]">
        <h1 className="flex-1 text-[22px] md:text-[27px] font-semibold leading-[1.3] tracking-[-0.012em] m-0 max-w-[32ch]">
          {REFLECT_PROMPTS[promptIndex]}
        </h1>
        <button
          onClick={() => setPromptIndex((i) => (i + 1) % REFLECT_PROMPTS.length)}
          className="inline-flex items-center gap-1.5 flex-shrink-0 mt-1 px-[11px] py-1.5 rounded-full border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)] text-[11.5px] transition-colors"
        >
          <RefreshCw className="w-[13px] h-[13px]" strokeWidth={1.9} />
          Change
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write as it comes. No one else reads this."
        className="w-full min-h-[44vh] my-[22px] mb-2 px-[22px] py-5 rounded-[14px] border border-[var(--ds-line-strong)] bg-[var(--ds-surface)] text-[var(--ds-text)] text-[17px] leading-[1.85] resize-none"
      />

      {photo && (
        <div className="relative inline-block mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="max-h-40 rounded-xl border border-[var(--ds-line)]" />
          <button
            onClick={() => setPhoto(null)}
            aria-label="Remove photo"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full grid place-items-center bg-[var(--ds-surface)] border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2.5 flex-wrap pt-5 border-t border-[var(--ds-line)]">
        {EMOTION_TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-[7px] rounded-full text-[12.5px] transition-colors ${
                on
                  ? "border border-transparent bg-[var(--ds-accent-soft)] text-[var(--ds-text)] font-semibold"
                  : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3.5 mt-[22px] flex-wrap">
        <span className={MICRO}>{words} WORDS</span>
        <span className="text-[12.5px] text-[var(--ds-text-muted)]">
          {words ? "Draft kept as you type" : "Nothing saved yet"}
        </span>
        <span className="flex-1" />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="hidden"
        />
        <button onClick={() => fileInput.current?.click()} className={GHOST_BTN}>
          Attach photo
        </button>
        <button onClick={handleSave} disabled={saving || !draft.trim()} className={PRIMARY_BTN}>
          {saving ? "Saving…" : "Save reflection"}
        </button>
      </div>

      {error && <p className="mt-3 text-[12.5px] text-[var(--ds-danger)]">{error}</p>}
    </div>
  );
}
