"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, Link as LinkIcon, Sparkles } from "lucide-react";
import {
  createJourney,
  updateJourney,
  uploadJourneyImage,
  type JourneyInput,
  type JourneyDayInput,
  type JourneyRow,
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

  const [days, setDays] = useState<JourneyDayInput[]>(
    journey?.journey_days ?? [
      { day: 1, title: "Beginning Where You Are", prompt: "", purpose: "", deeper: "" },
    ]
  );

  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Day handlers
  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    setDays([
      ...days,
      { day: nextDayNum, title: `Day ${nextDayNum}`, prompt: "", purpose: "", deeper: "" },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    const updated = days
      .filter((_, i) => i !== index)
      .map((d, idx) => ({ ...d, day: idx + 1 }));
    setDays(updated);
  };

  const handleDayChange = (index: number, field: keyof JourneyDayInput, value: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
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
    }
  };

  // Save submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id.trim() || !title.trim()) {
      setError("Journey ID and Title are required.");
      return;
    }

    const payload: JourneyInput = {
      id: id.trim(),
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
      days,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateJourney(id.trim(), payload)
        : await createJourney(payload);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/journeys"
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors"
            style={{
              background: "var(--admin-surface)",
              borderColor: "var(--admin-border)",
              color: "var(--admin-text-secondary)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--admin-text)" }}>
              {isEditing ? "Edit Journey" : "New Journey"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
              {isEditing ? `ID: ${journey.id}` : "Create a new guided multi-day experience"}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
          style={{
            background: "var(--admin-accent)",
            color: "#FFFFFF",
          }}
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Journey"}
        </button>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl border text-sm"
          style={{
            background: "var(--admin-danger-bg)",
            borderColor: "var(--admin-danger)",
            color: "var(--admin-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info & Image */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
          >
            <h2 className="text-sm font-semibold border-b pb-3" style={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}>
              General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Journey ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. inner-peace"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-muted)" }}>ID cannot be changed after creation</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Time Required
                </label>
                <input
                  type="text"
                  value={timeRequired}
                  onChange={(e) => setTimeRequired(e.target.value)}
                  placeholder="About 7 minutes a day"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Becoming More Human"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium transition-colors"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-input-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A short subtitle shown on cards"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-input-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Human Soul Foundations"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Realm
                </label>
                <input
                  type="text"
                  value={realm}
                  onChange={(e) => setRealm(e.target.value)}
                  placeholder="e.g. Human Soul Foundations"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--admin-accent)]"
                />
                Featured
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={premium}
                  onChange={(e) => setPremium(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--admin-accent)]"
                />
                Premium only
              </label>
            </div>
          </div>

          {/* Cover Image Card */}
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
          >
            <h2 className="text-sm font-semibold border-b pb-3" style={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}>
              Cover Image
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors`}
                style={{
                  background: imageMode === "url" ? "var(--admin-accent)" : "var(--admin-surface-2)",
                  color: imageMode === "url" ? "#FFFFFF" : "var(--admin-text-secondary)",
                }}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                External URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode("upload")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors`}
                style={{
                  background: imageMode === "upload" ? "var(--admin-accent)" : "var(--admin-surface-2)",
                  color: imageMode === "upload" ? "#FFFFFF" : "var(--admin-text-secondary)",
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload file
              </button>
            </div>

            {imageMode === "url" ? (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono transition-colors"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                  Upload Cover Image to Supabase Storage
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="block w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-[var(--admin-accent)] file:text-white hover:file:opacity-90 cursor-pointer disabled:opacity-50"
                  style={{ color: "var(--admin-text-muted)" }}
                />
                {uploadingImage && (
                  <p className="text-xs mt-2 text-[var(--admin-accent)]">Uploading image...</p>
                )}
              </div>
            )}

            {imageUrl && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--admin-text-muted)" }}>Preview</p>
                <div className="relative h-40 w-full max-w-sm rounded-xl overflow-hidden border" style={{ borderColor: "var(--admin-border)" }}>
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Descriptions */}
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
          >
            <h2 className="text-sm font-semibold border-b pb-3" style={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}>
              Detailed Texts
            </h2>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Purpose / Short Intro
              </label>
              <textarea
                rows={4}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What is the intention behind this journey?"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors resize-none"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-input-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Full Introduction
              </label>
              <textarea
                rows={6}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Detailed text shown on the journey landing page..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors resize-none"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-input-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium mb-1.5" style={{ color: "var(--admin-text-muted)" }}>
                Completion Message
              </label>
              <textarea
                rows={4}
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
                placeholder="Shown when a user finishes all days..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors resize-none"
                style={{
                  background: "var(--admin-input-bg)",
                  borderColor: "var(--admin-input-border)",
                  color: "var(--admin-text)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Days Section */}
      <div
        className="rounded-2xl border p-6 space-y-6"
        style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--admin-border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--admin-text)" }}>
              Journey Days ({days.length})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
              Configure the daily reflection prompts and guidance for this journey.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddDay}
            className="px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors"
            style={{
              background: "var(--admin-surface-2)",
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)",
            }}
          >
            <Plus className="w-4 h-4 text-[var(--admin-accent)]" />
            Add Day {days.length + 1}
          </button>
        </div>

        <div className="space-y-6">
          {days.map((dayItem, index) => (
            <div
              key={index}
              className="rounded-xl border p-5 space-y-4 relative"
              style={{
                background: "var(--admin-surface-2)",
                borderColor: "var(--admin-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}>
                  Day {dayItem.day}
                </span>

                {days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(index)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]"
                    title="Remove Day"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: "var(--admin-text-muted)" }}>
                    Day Title
                  </label>
                  <input
                    type="text"
                    required
                    value={dayItem.title}
                    onChange={(e) => handleDayChange(index, "title", e.target.value)}
                    placeholder="e.g. Beginning Where You Are"
                    className="w-full px-3 py-2 rounded-lg text-sm border font-medium transition-colors"
                    style={{
                      background: "var(--admin-input-bg)",
                      borderColor: "var(--admin-input-border)",
                      color: "var(--admin-text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: "var(--admin-text-muted)" }}>
                    Short Purpose / Subtitle
                  </label>
                  <input
                    type="text"
                    value={dayItem.purpose}
                    onChange={(e) => handleDayChange(index, "purpose", e.target.value)}
                    placeholder="Brief intention for today..."
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-colors"
                    style={{
                      background: "var(--admin-input-bg)",
                      borderColor: "var(--admin-input-border)",
                      color: "var(--admin-text)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: "var(--admin-text-muted)" }}>
                  Daily Prompt Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={dayItem.prompt}
                  onChange={(e) => handleDayChange(index, "prompt", e.target.value)}
                  placeholder="The main reflection text for this day..."
                  className="w-full px-3 py-2 rounded-lg text-sm border transition-colors resize-none"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium mb-1 flex items-center gap-1" style={{ color: "var(--admin-text-muted)" }}>
                  <Sparkles className="w-3 h-3 text-[var(--admin-accent)]" />
                  Deeper Reflection Question (Optional)
                </label>
                <input
                  type="text"
                  value={dayItem.deeper ?? ""}
                  onChange={(e) => handleDayChange(index, "deeper", e.target.value)}
                  placeholder="What did you almost overlook today?"
                  className="w-full px-3 py-2 rounded-lg text-sm border transition-colors"
                  style={{
                    background: "var(--admin-input-bg)",
                    borderColor: "var(--admin-input-border)",
                    color: "var(--admin-text)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Bottom Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
          style={{
            background: "var(--admin-accent)",
            color: "#FFFFFF",
          }}
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Journey"}
        </button>
      </div>
    </form>
  );
}
