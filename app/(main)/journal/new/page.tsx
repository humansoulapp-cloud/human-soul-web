"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, X, Check, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const EMOTION_TAGS = [
  "Gratitude",
  "Calm",
  "Clarity",
  "Tired",
  "Hopeful",
  "Uncertain",
  "Peaceful",
  "Reflective",
];

export default function NewReflectionPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg("Write something in your reflection before saving.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("You must be signed in to save your reflection.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("reflections").insert([
      {
        user_id: user.id,
        content: content.trim(),
        tags: selectedTags,
        photo: photoBase64,
        favorite: false,
      },
    ]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/journal");
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to journal</span>
        </Link>
        <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
          New Entry
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {errorMsg && (
          <div className="p-3 bg-[#D4A3A3]/20 border border-[#D4A3A3] text-[var(--text-primary)] text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Text Area */}
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm space-y-4">
          <textarea
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What caught your attention today? Take your time..."
            className="w-full bg-transparent text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none leading-relaxed font-light"
          />

          {/* Photo Preview if attached */}
          {photoBase64 && (
            <div className="relative rounded-2xl overflow-hidden max-h-64 border border-[var(--border-subtle)]">
              <img
                src={photoBase64}
                alt="Attached image"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoBase64(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tags Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Tags or emotions (optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selected
                      ? "bg-[var(--brand-primary)] text-[var(--bg-surface)]"
                      : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium rounded-xl cursor-pointer transition-colors border border-[var(--border-subtle)]">
            <Camera className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>{photoBase64 ? "Change photo" : "Attach photo"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Reflection"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
