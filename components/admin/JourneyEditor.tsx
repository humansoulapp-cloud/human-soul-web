"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  Eye,
  Image as ImageIcon,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import {
  createJourney,
  updateJourney,
  uploadJourneyImage,
  type JourneyDayInput,
  type JourneyInput,
  type JourneyRow,
  type JourneyStatus,
} from "@/lib/actions/journeys";
import { journeyToTemplateLines, linesToDocx, type TemplateParse, type TemplateValues } from "@/lib/journey-template";
import { ImportDialog, ImportReview } from "@/components/admin/JourneyImport";

type Day = { day: number; title: string; prompt: string; purpose: string; deeper: string };

type Form = {
  id: string;
  title: string;
  category: string;
  realm: string;
  tagline: string;
  purpose: string;
  intro: string;
  time_required: string;
  image_url: string;
  premium: boolean;
  featured: boolean;
  completion_message: string;
  reflection_questions: string[];
  status: JourneyStatus;
  scheduled: string; // datetime-local
  days: Day[];
};

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fromRow(j?: JourneyRow): Form {
  return {
    id: j?.id ?? "",
    title: j?.title ?? "",
    category: j?.category ?? "",
    realm: j?.realm ?? "",
    tagline: j?.tagline ?? "",
    purpose: j?.purpose ?? "",
    intro: j?.intro ?? "",
    time_required: j?.time_required ?? "About 7 minutes",
    image_url: j?.image_url ?? "",
    premium: j?.premium ?? false,
    featured: j?.featured ?? false,
    completion_message: j?.completion_message ?? "",
    reflection_questions: j?.reflection_questions?.length ? [...j.reflection_questions] : [""],
    status: j?.status ?? "draft",
    scheduled: toLocalInput(j?.scheduled_publish_at),
    days: (j?.journey_days ?? []).map((d) => ({
      day: d.day,
      title: d.title ?? "",
      prompt: d.prompt ?? "",
      purpose: d.purpose ?? "",
      deeper: d.deeper ?? "",
    })),
  };
}

const toTemplate = (f: Form): TemplateValues => ({
  title: f.title,
  category: f.category,
  tagline: f.tagline,
  time_required: f.time_required,
  featured: f.featured,
  premium: f.premium,
  purpose: f.purpose,
  intro: f.intro,
  completion_message: f.completion_message,
  reflection_questions: f.reflection_questions.filter((q) => q.trim()),
  days: f.days,
});

const STATUS_LABEL: Record<JourneyStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

function Field({
  label,
  where,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  where?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hsa-field">
      <div className="hsa-lab">
        <label className="hs-label" htmlFor={htmlFor}>
          {label}
        </label>
        {where ? <span className="hsa-where">{where}</span> : null}
      </div>
      {children}
      {hint ? <span className="hs-hint" style={{ fontSize: 13, lineHeight: "18px" }}>{hint}</span> : null}
    </div>
  );
}

function Switch({ checked, onChange, title, note }: { checked: boolean; onChange: (v: boolean) => void; title: string; note: string }) {
  return (
    <label className="hsa-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="hs-switch" aria-hidden="true" />
      <span className="hsa-switch-t">
        {title}
        <span>{note}</span>
      </span>
    </label>
  );
}

export default function JourneyEditor({
  journey,
  categories,
  openImport = false,
}: {
  journey?: JourneyRow;
  categories: string[];
  openImport?: boolean;
}) {
  const router = useRouter();
  const isNew = !journey;
  const initial = useMemo(() => fromRow(journey), [journey]);
  const [form, setForm] = useState<Form>(initial);
  const [saved, setSaved] = useState<Form>(initial);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [importOpen, setImportOpen] = useState(openImport);
  const [review, setReview] = useState<{ parse: TemplateParse; source: string } | null>(null);
  const [restore, setRestore] = useState<{ form: Form; at: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const draftKey = `humansoul:journey-draft:${journey?.id ?? "new"}`;

  // A long edit is never lost: the form is kept in the browser until saved.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as { form: Form; at: string };
      if (JSON.stringify(stored.form) !== JSON.stringify(initial)) setRestore(stored);
    } catch {}
  }, [draftKey, initial]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, at: new Date().toISOString() }));
      } catch {}
    }, 600);
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeunload", warn);
    };
  }, [form, dirty, draftKey]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setDay = (i: number, key: keyof Day, value: string) =>
    setForm((f) => ({ ...f, days: f.days.map((d, n) => (n === i ? { ...d, [key]: value } : d)) }));
  const renumber = (days: Day[]) => days.map((d, n) => ({ ...d, day: n + 1 }));
  const moveDay = (i: number, by: number) =>
    setForm((f) => {
      const days = [...f.days];
      const [d] = days.splice(i, 1);
      days.splice(i + by, 0, d);
      setOpenDay(i + by);
      return { ...f, days: renumber(days) };
    });
  const removeDay = (i: number) => {
    if (!window.confirm(`Remove Day ${i + 1}? You can still leave without saving.`)) return;
    setForm((f) => ({ ...f, days: renumber(f.days.filter((_, n) => n !== i)) }));
    setOpenDay(null);
  };
  const addDay = () => {
    setForm((f) => ({ ...f, days: [...f.days, { day: f.days.length + 1, title: "", prompt: "", purpose: "", deeper: "" }] }));
    setOpenDay(form.days.length);
  };

  const exportDoc = useCallback(() => {
    const bytes = linesToDocx(journeyToTemplateLines(toTemplate(form)));
    const blob = new Blob([bytes as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${form.title.trim() || "Journey"}.docx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, [form]);

  const applyImport = (v: Partial<TemplateValues>) => {
    setForm((f) => ({
      ...f,
      ...(v.title !== undefined ? { title: v.title } : {}),
      ...(v.category !== undefined ? { category: v.category } : {}),
      ...(v.tagline !== undefined ? { tagline: v.tagline } : {}),
      ...(v.time_required !== undefined ? { time_required: v.time_required } : {}),
      ...(v.featured !== undefined ? { featured: v.featured } : {}),
      ...(v.premium !== undefined ? { premium: v.premium } : {}),
      ...(v.purpose !== undefined ? { purpose: v.purpose } : {}),
      ...(v.intro !== undefined ? { intro: v.intro } : {}),
      ...(v.completion_message !== undefined ? { completion_message: v.completion_message } : {}),
      ...(v.reflection_questions !== undefined ? { reflection_questions: v.reflection_questions.length ? v.reflection_questions : [""] } : {}),
      ...(v.days ? { days: renumber(v.days) } : {}),
      ...(isNew && !f.id && v.title ? { id: slugify(v.title) } : {}),
    }));
    setReview(null);
    setNotice("Imported. Check the form and press Save changes to keep it.");
    window.scrollTo({ top: 0 });
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadJourneyImage(form.id || slugify(form.title) || "journey", fd);
    setUploading(false);
    if (res.error) setError(`The image didn't upload: ${res.error}`);
    else if (res.url) set("image_url", res.url);
  };

  const save = () => {
    setError(null);
    setNotice(null);
    if (!form.title.trim()) return setError("A journey needs a title. Everything else can wait.");
    const id = isNew ? slugify(form.id || form.title) : form.id;
    if (!id) return setError("Give the journey a title with letters or numbers.");
    if (form.status === "scheduled" && !form.scheduled) return setError("Choose when the journey publishes.");
    const emptyDays = form.days.filter((d) => !d.title.trim()).map((d) => d.day);
    if (emptyDays.length) return setError(`Day ${emptyDays.join(", ")} needs a title.`);

    const payload: JourneyInput = {
      id,
      title: form.title.trim(),
      category: form.category.trim() || null,
      realm: form.realm.trim() || null,
      tagline: form.tagline.trim(),
      purpose: form.purpose.trim(),
      intro: form.intro.trim(),
      time_required: form.time_required.trim(),
      image_url: form.image_url.trim() || null,
      premium: form.premium,
      featured: form.featured,
      completion_message: form.completion_message.trim(),
      reflection_questions: form.reflection_questions.map((q) => q.trim()).filter(Boolean),
      status: form.status,
      scheduled_publish_at: form.status === "scheduled" && form.scheduled ? new Date(form.scheduled).toISOString() : null,
      days: form.days.map<JourneyDayInput>((d) => ({
        day: d.day,
        title: d.title.trim(),
        prompt: d.prompt.trim(),
        purpose: d.purpose.trim(),
        deeper: d.deeper.trim() || null,
      })),
    };

    start(async () => {
      const res = isNew ? await createJourney(payload) : await updateJourney(id, payload);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      const next = { ...form, id };
      setForm(next);
      setSaved(next);
      if (isNew) router.replace(`/admin/journeys/${id}`);
      else router.refresh();
    });
  };

  /* ── Review screen replaces the page while open ─────────────────────── */
  if (review) {
    return (
      <ImportReview
        parse={review.parse}
        source={review.source}
        current={toTemplate(form)}
        journeyTitle={form.title || "New journey"}
        onCancel={() => setReview(null)}
        onReadAgain={() => {
          setReview(null);
          setImportOpen(true);
        }}
        onApply={applyImport}
      />
    );
  }

  const dayIssues = (d: Day) => (!d.prompt.trim() ? "No reading" : !d.title.trim() ? "No title" : null);
  const daysWithIssues = form.days.filter((d) => dayIssues(d)).length;
  const cover = form.image_url;
  const statusChip =
    form.status === "published" ? "live" : form.status === "scheduled" ? "scheduled" : form.status === "archived" ? "archived" : "draft";

  return (
    <>
      <div className="hsa-head">
        <div className="hsa-head-t">
          <Link className="hsa-back" href="/admin/journeys">
            <ArrowLeft size={16} aria-hidden="true" />
            Journeys
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 className="text-h1" style={{ margin: 0 }}>
              {form.title.trim() || "New journey"}
            </h1>
            <span className={`hsa-st ${statusChip}`}>
              {form.status === "published" ? <CircleCheck size={14} aria-hidden="true" /> : form.status === "scheduled" ? <CalendarDays size={14} aria-hidden="true" /> : <PenLine size={14} aria-hidden="true" />}
              {STATUS_LABEL[form.status]}
            </span>
          </div>
          <span className="hs-hint">
            {[`${form.days.length} ${form.days.length === 1 ? "day" : "days"}`, form.category || null, form.featured ? "Featured" : null, form.premium ? "Plus" : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <div className="hsa-head-a">
          <span className={`hsa-saved${dirty ? " dirty" : ""}`} role="status">
            {dirty ? <CircleAlert size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
            {dirty ? "Unsaved changes" : isNew ? "Not saved yet" : "All changes saved"}
          </span>
          <button type="button" className="hs-btn hs-btn-ghost hs-btn-icon" aria-label="Import from a document" title="Import from a document" onClick={() => setImportOpen(true)}>
            <Upload size={18} aria-hidden="true" />
          </button>
          <button type="button" className="hs-btn hs-btn-ghost hs-btn-icon" aria-label="Export to a document" title="Export to a document" onClick={exportDoc}>
            <Download size={18} aria-hidden="true" />
          </button>
          {!isNew ? (
            <a className="hs-btn hs-btn-secondary" href={`/journeys/${form.id}`} target="_blank" rel="noreferrer">
              <Eye size={16} aria-hidden="true" />
              Preview journey
            </a>
          ) : null}
          <button type="button" className="hs-btn hs-btn-default" onClick={save} disabled={pending || (!dirty && !isNew)}>
            {pending ? "Saving…" : isNew ? "Create journey" : "Save changes"}
          </button>
        </div>
      </div>

      {restore ? (
        <div className="hsa-banner" style={{ marginTop: 16, alignItems: "center" }}>
          <CircleAlert size={18} aria-hidden="true" style={{ color: "var(--warning)" }} />
          <span style={{ flex: 1 }}>
            You have unsaved edits from {new Date(restore.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
          </span>
          <button type="button" className="hs-btn hs-btn-secondary hs-btn-sm" onClick={() => { setForm(restore.form); setRestore(null); }}>
            Restore
          </button>
          <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setRestore(null); }}>
            Discard
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="hsa-banner err" role="alert" style={{ marginTop: 16 }}>
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div className="hsa-banner ok" role="status" style={{ marginTop: 16 }}>
          <CircleCheck size={18} aria-hidden="true" />
          <span style={{ flex: 1 }}>{notice}</span>
          <button type="button" className="hsa-icon-btn" aria-label="Dismiss" onClick={() => setNotice(null)} style={{ width: 28, height: 28 }}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="hsa-body">
        <aside className="hsa-side" aria-label="Sections">
          <span className="text-overline" style={{ padding: "0 12px 6px", color: "var(--muted-foreground)" }}>
            On this page
          </span>
          <a className="hsa-out" href="#pub"><span>Publishing</span></a>
          <a className="hsa-out" href="#ov"><span>Cover &amp; basics</span></a>
          <a className="hsa-out" href="#why"><span>Why this journey</span></a>
          <a className="hsa-out" href="#find"><span>What you&apos;ll find</span></a>
          <a className="hsa-out" href="#days">
            <span>The {form.days.length} {form.days.length === 1 ? "day" : "days"}</span>
            {daysWithIssues ? (
              <span className="hsa-out-warn" title={`${daysWithIssues} to finish`}>
                <TriangleAlert size={14} aria-hidden="true" />
              </span>
            ) : null}
          </a>
          <div className="hsa-side-days">
            {form.days.map((d, i) => (
              <a key={i} className="hsa-out hsa-out-sub" href="#days" onClick={() => setOpenDay(i)}>
                <span className="hsa-out-n">{String(d.day).padStart(2, "0")}</span>
                <span>{d.title || "Untitled"}</span>
                {dayIssues(d) ? (
                  <span className="hsa-out-warn">
                    <TriangleAlert size={12} aria-hidden="true" />
                  </span>
                ) : null}
              </a>
            ))}
          </div>
          <a className="hsa-out" href="#end"><span>Completion</span></a>
        </aside>

        <div className="hsa-main">
          {/* Publishing */}
          <section className="hsa-sec" id="pub" aria-labelledby="pub-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Publishing</span>
                <h2 id="pub-t" className="text-h3" style={{ margin: 0 }}>Who can see this journey, and from when.</h2>
              </div>
            </div>
            <div className="hsa-seg" role="group" aria-label="Status" style={{ alignSelf: "flex-start" }}>
              {(["draft", "scheduled", "published"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={form.status === s} onClick={() => set("status", s)}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
              {form.status === "archived" ? (
                <button type="button" aria-pressed>
                  Archived
                </button>
              ) : null}
            </div>
            <div className="hsa-grid2">
              <Field
                label="Address"
                htmlFor="f-id"
                hint={isNew ? "Set from the title. You can change it until the journey is created." : "Changing it would break links people have saved, so it's fixed."}
              >
                <input
                  id="f-id"
                  className="hs-control"
                  value={`/journeys/${isNew ? slugify(form.id || form.title) : form.id}`}
                  readOnly={!isNew}
                  onChange={(e) => set("id", e.target.value.replace(/^\/journeys\//, ""))}
                />
              </Field>
              {form.status === "scheduled" ? (
                <Field label="Publishes on" htmlFor="f-when" hint="Your local time.">
                  <input id="f-when" type="datetime-local" className="hs-control" value={form.scheduled} onChange={(e) => set("scheduled", e.target.value)} />
                </Field>
              ) : (
                <div className="hsa-field">
                  <span className="hs-label">{form.status === "published" ? "Live" : form.status === "archived" ? "Archived" : "Draft"}</span>
                  <span className="hs-hint">
                    {form.status === "published"
                      ? "Everyone can find it in Journeys."
                      : form.status === "archived"
                        ? "Hidden from Journeys. People who started keep their entries."
                        : "Only admins can see it."}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Cover & basics */}
          <section className="hsa-sec" id="ov" aria-labelledby="ov-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Overview</span>
                <h2 id="ov-t" className="text-h3" style={{ margin: 0 }}>Cover &amp; basics</h2>
                <span className="hs-hint">What people see first: on the cards, the Journeys page and the top of the overview.</span>
              </div>
            </div>
            <div className="hsa-cover">
              <div className="hsa-cover-img">
                {cover ? <img src={cover} alt="" /> : <ImageIcon size={28} aria-hidden="true" />}
                <span className="hsa-cover-tag">Header · fades into the page</span>
              </div>
              <div className="hsa-cover-side">
                <div className="hsa-cover-thumb">
                  {cover ? <img src={cover} alt="" /> : null}
                  <span className="hsa-cover-tag">Card</span>
                </div>
                <span className="hs-hint" style={{ fontSize: 13, lineHeight: "18px" }}>
                  One photo for the header and the cards. At least 2400 × 1600, calm at the top.
                </span>
                <button type="button" className="hs-btn hs-btn-secondary hs-btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload size={16} aria-hidden="true" />
                  {uploading ? "Uploading…" : cover ? "Replace image" : "Upload image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              </div>
            </div>
            <Field label="Image address" htmlFor="f-img" hint="Or paste a link to an image.">
              <input id="f-img" className="hs-control" value={form.image_url} placeholder="https://…" onChange={(e) => set("image_url", e.target.value)} />
            </Field>
            <Field label="Title" where="Overview, cards, day header" htmlFor="f-title">
              <input id="f-title" className="hs-control" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="hsa-grid2">
              <Field label="Category" where="Overline, cards" htmlFor="f-cat">
                <input id="f-cat" className="hs-control" list="f-cats" value={form.category} onChange={(e) => set("category", e.target.value)} />
                <datalist id="f-cats">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Time per day" where="At a glance" htmlFor="f-time">
                <input id="f-time" className="hs-control" value={form.time_required} onChange={(e) => set("time_required", e.target.value)} />
              </Field>
            </div>
            <Field label="Tagline" where="Under the title, cards" htmlFor="f-tag">
              <input id="f-tag" className="hs-control" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <div className="hsa-switches">
              <Switch checked={form.featured} onChange={(v) => set("featured", v)} title="Featured" note="Sage chip on the catalog card, first in the list." />
              <Switch checked={form.premium} onChange={(v) => set("premium", v)} title="HumanSoul Plus" note="Day 1 stays free; the rest open with Plus." />
            </div>
          </section>

          {/* Why */}
          <section className="hsa-sec" id="why" aria-labelledby="why-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Overview</span>
                <h2 id="why-t" className="text-h3" style={{ margin: 0 }}>Why this journey</h2>
                <span className="hs-hint">The reason to start, in the journey&apos;s own words. Shown in “More about this journey”.</span>
              </div>
            </div>
            <Field label="Headline" where="About this journey · title" htmlFor="f-purpose">
              <input id="f-purpose" className="hs-control" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} />
            </Field>
            <Field label="Introduction" htmlFor="f-intro" hint="Leave a blank line between paragraphs.">
              <textarea id="f-intro" className="hs-control hs-textarea" rows={7} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
            </Field>
          </section>

          {/* What you'll find */}
          <section className="hsa-sec" id="find" aria-labelledby="find-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Overview</span>
                <h2 id="find-t" className="text-h3" style={{ margin: 0 }}>What you&apos;ll find</h2>
                <span className="hs-hint">The same four cards for every journey.</span>
              </div>
            </div>
            <div className="hsa-feats">
              {[
                [BookOpen, "A short daily reading", "A few calm paragraphs that frame the day's theme."],
                [PenLine, "One question to write about", "A single reflection, saved privately in the journal."],
                [Sparkles, "Go deeper, if you want", "An extra question for the days you want to stay longer."],
                [ShieldCheck, "Private, at your pace", "Only you can read it. One day opens at a time."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof BookOpen;
                return (
                  <div className="hsa-feat" key={t as string}>
                    <span className="hsa-feat-ico"><I size={20} aria-hidden="true" /></span>
                    <span><b>{t as string}</b><span>{d as string}</span></span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Days */}
          <section className="hsa-sec" id="days" aria-labelledby="days-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Days</span>
                <h2 id="days-t" className="text-h3" style={{ margin: 0 }}>
                  The {form.days.length} {form.days.length === 1 ? "day" : "days"}
                </h2>
                <span className="hs-hint">Each day: a title, a reading, why it matters and a question to go deeper.</span>
              </div>
            </div>
            <ul className="hsa-days">
              {form.days.map((d, i) => {
                const issue = dayIssues(d);
                const head = (
                  <button type="button" className="hsa-day" aria-expanded={openDay === i} onClick={() => setOpenDay(openDay === i ? null : i)}>
                    <span className="hsa-day-num">{String(d.day).padStart(2, "0")}</span>
                    <span className="hsa-day-text">
                      <span className="hsa-day-title">{d.title || "Untitled day"}</span>
                      {openDay === i ? null : <span className="hsa-day-sum">{d.purpose || d.prompt.split("\n")[0] || "No reading yet"}</span>}
                    </span>
                    {issue ? (
                      <span className="hsa-warn"><TriangleAlert size={14} aria-hidden="true" />{issue}</span>
                    ) : (
                      <span className="hsa-ok"><CircleCheck size={14} aria-hidden="true" className="ai" />Ready</span>
                    )}
                    <span className="hsa-soft" style={{ width: 52, textAlign: "right" }}>{openDay === i ? "Close" : "Edit"}</span>
                  </button>
                );
                return openDay === i ? (
                  <li key={i} className="hsa-day-open">
                    {head}
                    <div className="hsa-day-body">
                      <Field label="Day title" where="Day header, index" htmlFor={`d-t-${i}`}>
                        <input id={`d-t-${i}`} className="hs-control" value={d.title} onChange={(e) => setDay(i, "title", e.target.value)} />
                      </Field>
                      <Field label="Reading" where="Day · reading" htmlFor={`d-r-${i}`} hint="Leave a blank line between paragraphs. About two minutes to read.">
                        <textarea id={`d-r-${i}`} className="hs-control hs-textarea" rows={8} value={d.prompt} onChange={(e) => setDay(i, "prompt", e.target.value)} />
                      </Field>
                      <Field label="Why this day" where="Day · under the reading" htmlFor={`d-p-${i}`}>
                        <textarea id={`d-p-${i}`} className="hs-control hs-textarea" rows={3} value={d.purpose} onChange={(e) => setDay(i, "purpose", e.target.value)} />
                      </Field>
                      <Field label="Go deeper · optional" where="Folded until opened" htmlFor={`d-g-${i}`}>
                        <input id={`d-g-${i}`} className="hs-control" value={d.deeper} onChange={(e) => setDay(i, "deeper", e.target.value)} />
                      </Field>
                      <div className="hsa-row-actions">
                        <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" disabled={i === 0} onClick={() => moveDay(i, -1)}>
                          <ArrowUp size={16} aria-hidden="true" />Move up
                        </button>
                        <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" disabled={i === form.days.length - 1} onClick={() => moveDay(i, 1)}>
                          <ArrowDown size={16} aria-hidden="true" />Move down
                        </button>
                        <span style={{ flex: 1 }} />
                        <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" style={{ color: "var(--destructive)" }} onClick={() => removeDay(i)}>
                          <Trash2 size={16} aria-hidden="true" />Remove day
                        </button>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={i}>{head}</li>
                );
              })}
            </ul>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" className="hs-btn hs-btn-secondary hs-btn-sm" onClick={addDay}>
                <Plus size={16} aria-hidden="true" />Add a day
              </button>
              <span className="hsa-note">Each day opens after the one before is written.</span>
            </div>
          </section>

          {/* Completion */}
          <section className="hsa-sec" id="end" aria-labelledby="end-t">
            <div className="hsa-sec-head">
              <div className="hsa-sec-text">
                <span className="text-overline hsa-over">Completion</span>
                <h2 id="end-t" className="text-h3" style={{ margin: 0 }}>When the journey ends</h2>
                <span className="hs-hint">What people read after the last day.</span>
              </div>
            </div>
            <Field label="Closing message" where="Journey complete" htmlFor="f-close" hint="Leave a blank line between paragraphs.">
              <textarea id="f-close" className="hs-control hs-textarea" rows={6} value={form.completion_message} onChange={(e) => set("completion_message", e.target.value)} />
            </Field>
            <div className="hsa-field">
              <div className="hsa-lab">
                <span className="hs-label">Closing questions</span>
                <span className="hsa-where">A closing reflection · choose one</span>
              </div>
              <div className="hsa-list-in">
                {form.reflection_questions.map((q, i) => (
                  <div key={i}>
                    <input
                      className="hs-control"
                      aria-label={`Closing question ${i + 1}`}
                      value={q}
                      onChange={(e) => set("reflection_questions", form.reflection_questions.map((x, n) => (n === i ? e.target.value : x)))}
                    />
                    <button
                      type="button"
                      className="hsa-icon-btn"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() => set("reflection_questions", form.reflection_questions.length > 1 ? form.reflection_questions.filter((_, n) => n !== i) : [""])}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" style={{ alignSelf: "flex-start", marginLeft: -14 }} onClick={() => set("reflection_questions", [...form.reflection_questions, ""])}>
                <Plus size={16} aria-hidden="true" />Add a question
              </button>
            </div>
          </section>
        </div>
      </div>

      {importOpen ? (
        <ImportDialog
          journeyTitle={form.title || null}
          categories={categories}
          onClose={() => setImportOpen(false)}
          onExport={form.title || form.days.length ? exportDoc : null}
          onRead={(parse, source) => {
            setImportOpen(false);
            setReview({ parse, source });
          }}
        />
      ) : null}
    </>
  );
}
