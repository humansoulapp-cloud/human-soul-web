"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import {
  createJourney,
  updateJourney,
  uploadJourneyImage,
  type JourneyInput,
  type JourneyRow,
} from "@/lib/actions/journeys";

const CATEGORIES = [
  "Human Soul Foundations",
  "Awareness & Reflection",
  "Identity & Self-Discovery",
  "The Inner Landscape",
  "Emotional Awareness",
  "Character & Virtue",
  "Relationships",
  "Purpose & Daily Living",
  "Healing & Growth",
  "Meaning & Wisdom",
];

type DayForm = {
  day: number;
  title: string;
  prompt: string;
  purpose: string;
  deeper: string;
};

function emptyDay(dayNumber: number): DayForm {
  return { day: dayNumber, title: "", prompt: "", purpose: "", deeper: "" };
}

export default function JourneyForm({ journey }: { journey?: JourneyRow }) {
  const isEdit = !!journey;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────
  const [id, setId] = useState(journey?.id ?? "");
  const [title, setTitle] = useState(journey?.title ?? "");
  const [category, setCategory] = useState(journey?.category ?? "");
  const [realm, setRealm] = useState(journey?.realm ?? "");
  const [tagline, setTagline] = useState(journey?.tagline ?? "");
  const [purpose, setPurpose] = useState(journey?.purpose ?? "");
  const [intro, setIntro] = useState(journey?.intro ?? "");
  const [timeRequired, setTimeRequired] = useState(journey?.time_required ?? "");
  const [completionMessage, setCompletionMessage] = useState(journey?.completion_message ?? "");
  const [premium, setPremium] = useState(journey?.premium ?? false);
  const [featured, setFeatured] = useState(journey?.featured ?? false);

  // ── Image state ─────────────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState(journey?.image_url ?? "");
  const [imagePreview, setImagePreview] = useState(journey?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Days state ───────────────────────────────────────────────────────────
  const [days, setDays] = useState<DayForm[]>(
    journey?.journey_days?.length
      ? journey.journey_days.map((d) => ({
          day: d.day,
          title: d.title ?? "",
          prompt: d.prompt ?? "",
          purpose: d.purpose ?? "",
          deeper: d.deeper ?? "",
        }))
      : [emptyDay(1)]
  );
  const [expandedDay, setExpandedDay] = useState<number>(0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleUrlChange(val: string) {
    setImageUrl(val);
    setImagePreview(val);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const journeyId = id || `temp-${Date.now()}`;
    const result = await uploadJourneyImage(journeyId, formData);

    setUploading(false);
    if (result.error) {
      setError(`Image upload failed: ${result.error}`);
    } else if (result.url) {
      setImageUrl(result.url);
      setImagePreview(result.url);
    }
  }

  function addDay() {
    const newDay = emptyDay(days.length + 1);
    setDays((prev) => [...prev, newDay]);
    setExpandedDay(days.length);
  }

  function removeDay(idx: number) {
    setDays((prev) => {
      const updated = prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
      return updated;
    });
    if (expandedDay >= idx && expandedDay > 0) setExpandedDay(expandedDay - 1);
  }

  function updateDay(idx: number, field: keyof DayForm, value: string) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  }

  function moveDay(idx: number, direction: "up" | "down") {
    const newDays = [...days];
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= newDays.length) return;
    [newDays[idx], newDays[target]] = [newDays[target], newDays[idx]];
    setDays(newDays.map((d, i) => ({ ...d, day: i + 1 })));
    setExpandedDay(target);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id.trim()) { setError("Journey ID is required"); return; }
    if (!title.trim()) { setError("Title is required"); return; }

    const input: JourneyInput = {
      id: id.trim(),
      title: title.trim(),
      category: category || null,
      realm: realm || null,
      tagline: tagline || null,
      purpose: purpose || null,
      intro: intro || null,
      time_required: timeRequired || null,
      image_url: imageUrl || null,
      premium,
      featured,
      completion_message: completionMessage || null,
      days: days.map((d) => ({
        day: d.day,
        title: d.title,
        prompt: d.prompt,
        purpose: d.purpose,
        deeper: d.deeper || null,
      })),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateJourney(journey!.id, input)
        : await createJourney(input);

      if (result?.error) setError(result.error);
    });
  }

  const inputClass =
    "w-full px-4 py-2.5 bg-[#0F0F0F] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#8BA58F]/60 transition-colors";
  const labelClass = "block text-xs text-white/40 mb-1.5 uppercase tracking-wider";
  const textareaClass = `${inputClass} resize-none`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/journeys")}
          className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {isEdit ? "Edit Journey" : "New Journey"}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isEdit ? journey.title : "Create a new guided journey"}
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ─── General Info ─────────────────────────────────────────────────── */}
      <section className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white border-b border-white/[0.06] pb-3">
          General Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Journey ID *</label>
            <input
              id="journey-id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="e.g. becoming-more-human"
              className={inputClass}
              disabled={isEdit}
              required
            />
            {isEdit && (
              <p className="text-white/25 text-xs mt-1">ID cannot be changed after creation</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Time Required</label>
            <input
              id="journey-time"
              type="text"
              value={timeRequired}
              onChange={(e) => setTimeRequired(e.target.value)}
              placeholder="e.g. About 7 minutes a day"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Title *</label>
          <input
            id="journey-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Journey title"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Tagline</label>
          <input
            id="journey-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Short description shown on the card"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select
              id="journey-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Realm</label>
            <input
              id="journey-realm"
              type="text"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              placeholder="Same as category usually"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              id="journey-featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded accent-[#8BA58F]"
            />
            <span className="text-sm text-white/60">Featured</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              id="journey-premium"
              type="checkbox"
              checked={premium}
              onChange={(e) => setPremium(e.target.checked)}
              className="w-4 h-4 rounded accent-[#8BA58F]"
            />
            <span className="text-sm text-white/60">Premium only</span>
          </label>
        </div>
      </section>

      {/* ─── Cover Image ───────────────────────────────────────────────────── */}
      <section className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-medium text-white border-b border-white/[0.06] pb-3">
          Cover Image
        </h2>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              imageMode === "url"
                ? "bg-[#8BA58F]/20 text-[#8BA58F] border border-[#8BA58F]/30"
                : "text-white/40 hover:text-white/60 border border-white/[0.06]"
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            External URL
          </button>
          <button
            type="button"
            onClick={() => setImageMode("upload")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              imageMode === "upload"
                ? "bg-[#8BA58F]/20 text-[#8BA58F] border border-[#8BA58F]/30"
                : "text-white/40 hover:text-white/60 border border-white/[0.06]"
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload file
          </button>
        </div>

        <div className="grid grid-cols-[1fr_200px] gap-4 items-start">
          <div>
            {imageMode === "url" ? (
              <div>
                <label className={labelClass}>Image URL</label>
                <input
                  id="journey-image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Upload image</label>
                <input
                  ref={fileRef}
                  id="journey-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-white/[0.08] border-dashed rounded-xl text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Choose JPG, PNG or WebP"}
                </button>
                {imageUrl && imageMode === "upload" && (
                  <p className="text-white/30 text-xs mt-2 truncate">{imageUrl}</p>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="h-32 rounded-xl overflow-hidden bg-[#0F0F0F] border border-white/[0.06] flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreview("")}
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-white/10" />
            )}
          </div>
        </div>
      </section>

      {/* ─── Long-form content ─────────────────────────────────────────────── */}
      <section className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-white border-b border-white/[0.06] pb-3">
          Content
        </h2>

        <div>
          <label className={labelClass}>Purpose / Description</label>
          <textarea
            id="journey-purpose"
            rows={6}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe the purpose of this journey…"
            className={textareaClass}
          />
        </div>

        <div>
          <label className={labelClass}>Intro (shown before starting)</label>
          <textarea
            id="journey-intro"
            rows={4}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Optional intro text shown when the user opens the journey…"
            className={textareaClass}
          />
        </div>

        <div>
          <label className={labelClass}>Completion Message</label>
          <textarea
            id="journey-completion"
            rows={4}
            value={completionMessage}
            onChange={(e) => setCompletionMessage(e.target.value)}
            placeholder="Message shown when the user completes all days…"
            className={textareaClass}
          />
        </div>
      </section>

      {/* ─── Days Editor ───────────────────────────────────────────────────── */}
      <section className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-medium text-white">
            Days{" "}
            <span className="ml-1 text-white/30 font-normal">({days.length})</span>
          </h2>
          <button
            type="button"
            onClick={addDay}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8BA58F] hover:text-white bg-[#8BA58F]/10 hover:bg-[#8BA58F]/20 rounded-lg transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Day
          </button>
        </div>

        <div className="space-y-2">
          {days.map((day, idx) => (
            <div
              key={idx}
              className="border border-white/[0.06] rounded-xl overflow-hidden"
            >
              {/* Day Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedDay(expandedDay === idx ? -1 : idx)}
              >
                <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
                <span className="text-xs font-medium text-[#8BA58F] w-12 flex-shrink-0">
                  Day {day.day}
                </span>
                <span className="text-sm text-white/60 flex-1 truncate">
                  {day.title || <span className="text-white/25 italic">No title yet</span>}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveDay(idx, "up"); }}
                    disabled={idx === 0}
                    className="p-1 text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveDay(idx, "down"); }}
                    disabled={idx === days.length - 1}
                    className="p-1 text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeDay(idx); }}
                    disabled={days.length === 1}
                    className="p-1 text-white/25 hover:text-red-400 disabled:opacity-20 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Body */}
              {expandedDay === idx && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06] pt-4">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      id={`day-${idx}-title`}
                      type="text"
                      value={day.title}
                      onChange={(e) => updateDay(idx, "title", e.target.value)}
                      placeholder={`Day ${day.day} title`}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Prompt</label>
                    <textarea
                      id={`day-${idx}-prompt`}
                      rows={5}
                      value={day.prompt}
                      onChange={(e) => updateDay(idx, "prompt", e.target.value)}
                      placeholder="The main reflection prompt for this day…"
                      className={textareaClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Purpose (italic note)</label>
                    <textarea
                      id={`day-${idx}-purpose`}
                      rows={2}
                      value={day.purpose}
                      onChange={(e) => updateDay(idx, "purpose", e.target.value)}
                      placeholder="Why this day matters…"
                      className={textareaClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Deeper question (optional)</label>
                    <input
                      id={`day-${idx}-deeper`}
                      type="text"
                      value={day.deeper}
                      onChange={(e) => updateDay(idx, "deeper", e.target.value)}
                      placeholder="A follow-up question to go deeper…"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={() => router.push("/admin/journeys")}
          className="px-6 py-3 text-sm text-white/50 hover:text-white/70 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="px-8 py-3 text-sm font-medium text-white bg-[#8BA58F] hover:bg-[#78937C] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Journey"}
        </button>
      </div>
    </form>
  );
}
