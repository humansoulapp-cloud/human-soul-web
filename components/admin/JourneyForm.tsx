"use client";

import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Link as LinkIcon,
  Calendar,
  Clock,
  Globe,
  FileText,
  Sparkles,
  Archive,
  Eye,
} from "lucide-react";
import JourneyPreviewModal from "@/components/admin/JourneyPreviewModal";
import {
  createJourney,
  updateJourney,
  uploadJourneyImage,
  type JourneyInput,
  type JourneyDayInput,
  type JourneyRow,
  type JourneyStatus,
} from "@/lib/actions/journeys";

export default function JourneyForm({ journey }: { journey?: JourneyRow }) {
  const isEditing = !!journey;

  const [id, setId] = useState(journey?.id ?? "");
  const [title, setTitle] = useState(journey?.title ?? "");
  const [category, setCategory] = useState(journey?.category ?? "Human Soul Foundations");
  const [realm, setRealm] = useState(journey?.realm ?? "Human Soul Foundations");
  const [tagline, setTagline] = useState(journey?.tagline ?? "");
  const [purpose, setPurpose] = useState(journey?.purpose ?? "");
  const [intro, setIntro] = useState(journey?.intro ?? "");
  const [timeRequired, setTimeRequired] = useState(journey?.time_required ?? "About 7 minutes a day");
  const [imageUrl, setImageUrl] = useState(journey?.image_url ?? "");
  const [premium, setPremium] = useState(journey?.premium ?? false);
  const [featured, setFeatured] = useState(journey?.featured ?? false);
  const [completionMessage, setCompletionMessage] = useState(journey?.completion_message ?? "");
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>(
    journey?.reflection_questions && journey.reflection_questions.length > 0
      ? [...journey.reflection_questions, "", "", ""].slice(0, 3)
      : ["", "", ""]
  );

  // Publishing & Scheduling state
  const [status, setStatus] = useState<JourneyStatus>(journey?.status ?? "published");
  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Format initial ISO date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoDate?: string | null) => {
    if (!isoDate) return "";
    try {
      const d = new Date(isoDate);
      // Offset to local timezone
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return "";
    }
  };

  const [scheduledPublishAt, setScheduledPublishAt] = useState<string>(
    formatForInput(journey?.scheduled_publish_at)
  );

  const [days, setDays] = useState<JourneyDayInput[]>(
    journey?.journey_days ?? [
      { day: 1, title: "Beginning Where You Are", prompt: "", purpose: "", deeper: "" },
    ]
  );

  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [textsOpen, setTextsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  // Preset helper for scheduling
  const setQuickSchedule = (hoursAhead: number) => {
    const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    // Round to nearest 15 minutes
    const minutes = 15 * Math.ceil(target.getMinutes() / 15);
    target.setMinutes(minutes, 0, 0);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localStr = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledPublishAt(localStr);
    setStatus("scheduled");
    markDirty();
  };

  // Day handlers
  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    setDays([
      ...days,
      { day: nextDayNum, title: `Day ${nextDayNum}`, prompt: "", purpose: "", deeper: "" },
    ]);
    setActiveDay(days.length);
    markDirty();
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = days
      .filter((_, i) => i !== index)
      .map((d, idx) => ({ ...d, day: idx + 1 }));
    setDays(updated);
    setActiveDay((prev) => Math.min(prev, updated.length - 1));
    markDirty();
  };

  const handleDayChange = (index: number, field: keyof JourneyDayInput, value: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
    markDirty();
  };

  const handleReflectionQuestionChange = (index: number, value: string) => {
    const updated = [...reflectionQuestions];
    updated[index] = value;
    setReflectionQuestions(updated);
    markDirty();
  };

  // Image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadJourneyImage(id || "temp", formData);
    setUploadingImage(false);

    if (result.error) {
      setError(`Image upload failed: ${result.error}`);
    } else if (result.url) {
      setImageUrl(result.url);
      markDirty();
    }
  };

  // Save submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("A title is the one thing a journey needs. Everything else can wait.");
      return;
    }

    // The id is the primary key, so a new journey still needs one — derive it
    // from the title rather than making it another field to fill in.
    const slug =
      id.trim() ||
      title
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug) {
      setError("Give the journey a title with letters or numbers, or set an id by hand.");
      return;
    }

    if (status === "scheduled" && !scheduledPublishAt) {
      setError("Please specify a publication date and time when scheduling a journey.");
      return;
    }

    const payload: JourneyInput = {
      id: slug,
      title: title.trim(),
      category: category.trim(),
      realm: realm.trim(),
      tagline: tagline.trim(),
      purpose: purpose.trim(),
      intro: intro.trim(),
      time_required: timeRequired.trim(),
      image_url: imageUrl.trim(),
      premium,
      featured,
      completion_message: completionMessage.trim(),
      reflection_questions: reflectionQuestions
        .map((q) => q.trim())
        .filter((q) => q.length > 0),
      status,
      scheduled_publish_at:
        status === "scheduled" && scheduledPublishAt
          ? new Date(scheduledPublishAt).toISOString()
          : null,
      days,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateJourney(id.trim(), payload)
        : await createJourney(payload);
      if (result?.error) {
        setError(result.error);
      } else {
        setDirty(false);
        setSaved(true);
      }
    });
  };


  const day = days[activeDay];

  const inputStyle = {
    background: "var(--admin-input-bg)",
    borderColor: "var(--admin-input-border)",
    color: "var(--admin-text)",
  };
  const labelClass = "text-[11px] font-semibold uppercase tracking-wider mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Top bar */}
      <div
        className="flex items-center gap-3.5 -mx-8 -mt-8 mb-6 px-8 py-3.5 border-b sticky top-0 z-10 backdrop-blur"
        style={{ background: "var(--admin-bg)", borderColor: "var(--admin-border)" }}
      >
        <Link
          href="/admin/journeys"
          className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--admin-surface)",
            borderColor: "var(--admin-border)",
            color: "var(--admin-text-secondary)",
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div className="min-w-0">
          <h1
            className="font-serif-editorial text-lg font-semibold leading-tight truncate"
            style={{ color: "var(--admin-text)" }}
          >
            {title || (isEditing ? "Edit Journey" : "New Journey")}
          </h1>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--admin-text-muted)" }}>
            {id || "untitled"} · {days.length} day{days.length === 1 ? "" : "s"}
            {category ? ` · ${category}` : ""}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
          {/* Quick status, mirroring the detailed publishing section below */}
          <div className="hidden lg:flex items-center gap-1.5">
            {([
              ["draft", "Draft"],
              ["scheduled", "Scheduled"],
              ["published", "Live"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  markDirty();
                }}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold tracking-[0.04em] border ${
                  status === value
                    ? "border-transparent bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                    : "border-[var(--admin-border-hover)] text-[var(--admin-text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {saved ? "Saved" : dirty ? "Unsaved changes" : ""}
          </span>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-colors border"
            style={{
              background: "var(--admin-surface)",
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)",
            }}
            title="Preview how users experience this journey"
          >
            <Eye className="w-4 h-4 text-[#8BA58F]" />
            <span>Preview as User</span>
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4.5 py-2 rounded-lg text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl border text-sm mb-6"
          style={{
            background: "var(--admin-danger-bg)",
            borderColor: "var(--admin-danger)",
            color: "var(--admin-danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5 max-w-[1240px]">
        {/* Journey settings */}
        <section
          className="rounded-xl border p-5"
          style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
            {/* Cover */}
            <div>
              <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                Cover
              </span>
              <div
                className="relative rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/10", background: "var(--admin-input-bg)" }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Cover" className="w-full h-full object-cover block" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--admin-text-muted)" }}>
                    No image
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImageMode("upload");
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingImage}
                  className="absolute right-1.5 bottom-1.5 px-2.5 py-1 rounded-md text-[11px] disabled:opacity-60"
                  style={{ background: "rgba(20,24,20,.72)", color: "#f4f1ea" }}
                >
                  {uploadingImage ? "Uploading..." : "Change"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setImageMode(imageMode === "url" ? "upload" : "url")}
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  <LinkIcon className="w-3 h-3" />
                  {imageMode === "url" ? "Hide URL field" : "Use external URL"}
                </button>
                {imageMode === "url" && (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full mt-1.5 px-2.5 py-1.5 rounded-md text-xs border font-mono"
                    style={inputStyle}
                  />
                )}
              </div>
              <div className="flex gap-3.5 mt-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--admin-text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-[var(--admin-accent)]"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--admin-text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={premium}
                    onChange={(e) => setPremium(e.target.checked)}
                    className="accent-[var(--admin-accent)]"
                  />
                  Premium only
                </label>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Title
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Becoming More Human"
                  className="px-3 py-2 rounded-lg text-sm border font-medium"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Tagline
                </span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A short subtitle shown on cards"
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Category
                </span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Human Soul Foundations"
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Realm
                </span>
                <input
                  value={realm}
                  onChange={(e) => setRealm(e.target.value)}
                  placeholder="e.g. Human Soul Foundations"
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Time required
                </span>
                <input
                  value={timeRequired}
                  onChange={(e) => setTimeRequired(e.target.value)}
                  placeholder="About 7 minutes a day"
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                  Journey ID{" "}
                  <span className="normal-case font-normal tracking-normal">
                    {isEditing ? "(locked)" : ""}
                  </span>
                </span>
                <input
                  disabled={isEditing}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={title.trim() ? "Left blank: from the title" : "e.g. inner-peace"}
                  className="px-3 py-2 rounded-lg text-sm border font-mono disabled:opacity-50"
                  style={
                    isEditing
                      ? { ...inputStyle, background: "transparent", borderStyle: "dashed" }
                      : inputStyle
                  }
                />
              </label>
            </div>
          </div>

          {/* Detailed texts, collapsible */}
          <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--admin-border)" }}>
            <button
              type="button"
              onClick={() => setTextsOpen(!textsOpen)}
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              <ChevronRight
                className="w-3 h-3 transition-transform"
                style={{ transform: textsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
              Detailed texts
              <span className="font-normal text-xs" style={{ color: "var(--admin-text-muted)" }}>
                purpose, full introduction
              </span>
            </button>

            {textsOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                <label className="flex flex-col gap-1">
                  <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                    Purpose / short intro
                  </span>
                  <textarea
                    rows={7}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="What is the intention behind this journey?"
                    className="px-2.5 py-2 rounded-lg text-[12.5px] leading-relaxed border resize-y"
                    style={inputStyle}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                    Full introduction
                  </span>
                  <textarea
                    rows={7}
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    placeholder="Detailed text shown on the journey landing page..."
                    className="px-2.5 py-2 rounded-lg text-[12.5px] leading-relaxed border resize-y"
                    style={inputStyle}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Publishing & Scheduling Section */}
        <section
          className="rounded-xl border p-5"
          style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
                <Calendar className="w-4 h-4 text-[var(--admin-accent)]" />
                Publishing & Schedule
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                Control when this guided journey becomes accessible to users.
              </p>
            </div>
            
            {/* Status indicator badge */}
            <div className="flex items-center gap-2">
              {status === "published" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Live & Published
                </span>
              )}
              {status === "scheduled" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Scheduled Release
                </span>
              )}
              {status === "draft" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Draft Only
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Option 1: Published */}
            <button
              type="button"
              onClick={() => {
                setStatus("published");
                markDirty();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                status === "published"
                  ? "ring-2 ring-[var(--admin-accent)] border-[var(--admin-accent)] bg-[var(--admin-surface-2)]"
                  : "hover:border-[var(--admin-border-hover)]"
              }`}
              style={{
                background: status === "published" ? "var(--admin-surface-2)" : "var(--admin-input-bg)",
                borderColor: status === "published" ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            >
              <div className="flex items-center gap-2 font-medium text-xs mb-1" style={{ color: "var(--admin-text)" }}>
                <Globe className="w-4 h-4 text-emerald-500" />
                Publish Immediately
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                Live right now and immediately visible to all app users.
              </p>
            </button>

            {/* Option 2: Scheduled */}
            <button
              type="button"
              onClick={() => {
                setStatus("scheduled");
                if (!scheduledPublishAt) {
                  // Default to tomorrow 9am if not set
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  const tzOffset = tomorrow.getTimezoneOffset() * 60000;
                  setScheduledPublishAt(new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16));
                }
                markDirty();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                status === "scheduled"
                  ? "ring-2 ring-[var(--admin-accent)] border-[var(--admin-accent)] bg-[var(--admin-surface-2)]"
                  : "hover:border-[var(--admin-border-hover)]"
              }`}
              style={{
                background: status === "scheduled" ? "var(--admin-surface-2)" : "var(--admin-input-bg)",
                borderColor: status === "scheduled" ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            >
              <div className="flex items-center gap-2 font-medium text-xs mb-1" style={{ color: "var(--admin-text)" }}>
                <Clock className="w-4 h-4 text-amber-500" />
                Schedule for Future Date
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                Automatically uploads & unlocks on your specified date and time.
              </p>
            </button>

            {/* Option 3: Draft */}
            <button
              type="button"
              onClick={() => {
                setStatus("draft");
                markDirty();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                status === "draft"
                  ? "ring-2 ring-[var(--admin-accent)] border-[var(--admin-accent)] bg-[var(--admin-surface-2)]"
                  : "hover:border-[var(--admin-border-hover)]"
              }`}
              style={{
                background: status === "draft" ? "var(--admin-surface-2)" : "var(--admin-input-bg)",
                borderColor: status === "draft" ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            >
              <div className="flex items-center gap-2 font-medium text-xs mb-1" style={{ color: "var(--admin-text)" }}>
                <FileText className="w-4 h-4 text-zinc-400" />
                Save as Draft
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                Hidden from users. Only administrators can view or edit this.
              </p>
            </button>

            {/* Option 4: Archived */}
            <button
              type="button"
              onClick={() => {
                setStatus("archived");
                markDirty();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                status === "archived"
                  ? "ring-2 ring-[var(--admin-accent)] border-[var(--admin-accent)] bg-[var(--admin-surface-2)]"
                  : "hover:border-[var(--admin-border-hover)]"
              }`}
              style={{
                background: status === "archived" ? "var(--admin-surface-2)" : "var(--admin-input-bg)",
                borderColor: status === "archived" ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            >
              <div className="flex items-center gap-2 font-medium text-xs mb-1" style={{ color: "var(--admin-text)" }}>
                <Archive className="w-4 h-4 text-purple-400" />
                Archive Journey
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                Hidden from public app. Retained safely for record keeping.
              </p>
            </button>
          </div>

          {/* DateTime Picker if Scheduled */}
          {status === "scheduled" && (
            <div
              className="p-4 rounded-xl border mt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              style={{
                background: "var(--admin-surface-2)",
                borderColor: "var(--admin-border)",
              }}
            >
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
                  Scheduled Release Date & Time
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={scheduledPublishAt}
                    onChange={(e) => {
                      setScheduledPublishAt(e.target.value);
                      markDirty();
                    }}
                    className="px-3 py-2 rounded-lg text-sm border font-sans"
                    style={inputStyle}
                  />
                  <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                    (in your local time)
                  </span>
                </div>
              </div>

              {/* Quick schedule presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium mr-1" style={{ color: "var(--admin-text-muted)" }}>
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setQuickSchedule(24)}
                  className="px-2.5 py-1 rounded-md text-xs border transition-colors hover:border-[var(--admin-accent)]"
                  style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule(72)}
                  className="px-2.5 py-1 rounded-md text-xs border transition-colors hover:border-[var(--admin-accent)]"
                  style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule(168)}
                  className="px-2.5 py-1 rounded-md text-xs border transition-colors hover:border-[var(--admin-accent)]"
                  style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
                >
                  +1 Week
                </button>
              </div>
            </div>
          )}
        </section>


        {/* Days: master-detail */}
        <section
          className="rounded-xl border overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]"
          style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", minHeight: 520 }}
        >
          <aside className="border-b md:border-b-0 md:border-r flex flex-col" style={{ borderColor: "var(--admin-border)" }}>
            <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2.5">
              <div className="text-[13px] font-semibold" style={{ color: "var(--admin-text)" }}>
                Journey Days{" "}
                <span className="font-normal" style={{ color: "var(--admin-text-muted)" }}>
                  · {days.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddDay}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-2 pb-2.5 flex flex-col gap-0.5 max-h-[460px] md:max-h-none">
              {days.map((dayItem, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveDay(index)}
                  className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg"
                  style={{
                    color: "var(--admin-text)",
                    background: index === activeDay ? "var(--admin-accent-soft)" : "transparent",
                  }}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-md grid place-items-center text-[11px] font-semibold"
                    style={
                      index === activeDay
                        ? { background: "var(--admin-accent)", color: "#FFFFFF" }
                        : {
                            background: "var(--admin-input-bg)",
                            color: "var(--admin-text-muted)",
                            border: "1px solid var(--admin-border)",
                          }
                    }
                  >
                    {dayItem.day}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate">
                      {dayItem.title || "Untitled day"}
                    </span>
                    <span className="block text-[11px] mt-0.5 truncate" style={{ color: "var(--admin-text-muted)" }}>
                      {dayItem.purpose || "No purpose yet"}
                    </span>
                  </span>
                  {!dayItem.prompt?.trim() && (
                    <span
                      className="flex-shrink-0 ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.08em]"
                      style={{ background: "var(--admin-gold-soft)", color: "var(--admin-gold)" }}
                    >
                      EMPTY
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className="p-4.5 md:p-5.5 flex flex-col gap-3.5 min-w-0">
            {day ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full"
                    style={{ color: "var(--admin-accent)", background: "var(--admin-surface-2)" }}
                  >
                    DAY {day.day}
                  </span>
                  <span className="flex-1" />
                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(activeDay)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete day
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                      Day title
                    </span>
                    <input
                      value={day.title}
                      onChange={(e) => handleDayChange(activeDay, "title", e.target.value)}
                      placeholder="e.g. Beginning Where You Are"
                      className="px-3 py-2 rounded-lg text-sm border font-medium"
                      style={inputStyle}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                      Short purpose / subtitle
                    </span>
                    <input
                      value={day.purpose}
                      onChange={(e) => handleDayChange(activeDay, "purpose", e.target.value)}
                      placeholder="Brief intention for today..."
                      className="px-3 py-2 rounded-lg text-sm border"
                      style={inputStyle}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 flex-1">
                  <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                    Daily prompt
                  </span>
                  <textarea
                    rows={9}
                    value={day.prompt}
                    onChange={(e) => handleDayChange(activeDay, "prompt", e.target.value)}
                    placeholder="The main reflection text for this day..."
                    className="px-3 py-2.5 rounded-lg text-sm leading-relaxed border flex-1 resize-y"
                    style={inputStyle}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                    Deeper reflection question{" "}
                    <span className="normal-case font-normal tracking-normal">(optional)</span>
                  </span>
                  <input
                    value={day.deeper ?? ""}
                    onChange={(e) => handleDayChange(activeDay, "deeper", e.target.value)}
                    placeholder="What did you almost overlook today?"
                    className="px-3 py-2 rounded-lg text-sm border italic"
                    style={inputStyle}
                  />
                </label>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                Add a day to get started.
              </p>
            )}
          </div>
        </section>

        {/* Journey Completion: reflection questions + completion message */}
        <section
          className="rounded-xl border p-5"
          style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <Sparkles className="w-4 h-4 text-[var(--admin-accent)]" />
              Journey Completion
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
              Shown to users after they finish all {days.length} day{days.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            <div>
              <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                Reflection questions
              </span>
              <div className="flex flex-col gap-2.5 mt-1">
                {reflectionQuestions.map((question, index) => (
                  <input
                    key={index}
                    value={question}
                    onChange={(e) => handleReflectionQuestionChange(index, e.target.value)}
                    placeholder={`Reflection question ${index + 1}...`}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={inputStyle}
                  />
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className={labelClass} style={{ color: "var(--admin-text-muted)" }}>
                Completion message
              </span>
              <textarea
                rows={5}
                value={completionMessage}
                onChange={(e) => {
                  setCompletionMessage(e.target.value);
                  markDirty();
                }}
                placeholder="Shown when a user finishes all days..."
                className="px-3 py-2.5 rounded-lg text-sm leading-relaxed border resize-y"
                style={inputStyle}
              />
            </label>
          </div>
        </section>
      </div>

      {/* Live User Experience Preview Modal */}
      <JourneyPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        journey={{
          id,
          title,
          category,
          realm,
          tagline,
          purpose,
          intro,
          time_required: timeRequired,
          image_url: imageUrl,
          premium,
          featured,
          completion_message: completionMessage,
          reflection_questions: reflectionQuestions.filter((q) => q.trim().length > 0),
          status,
          scheduled_publish_at: scheduledPublishAt,
          days,
        }}
      />
    </form>
  );
}
