"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Download,
  FileText,
  Link2,
  Lock,
  Minus,
  RefreshCw,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { parseDocxBuffer } from "@/lib/doc-parser";
import { readGoogleDoc } from "@/lib/actions/import-doc";
import {
  fieldName,
  parseJourneyTemplate,
  type TemplateDay,
  type TemplateField,
  type TemplateIssue,
  type TemplateParse,
  type TemplateValues,
} from "@/lib/journey-template";

/* ── Dialog: choose the document ───────────────────────────────────────── */

export function ImportDialog({
  journeyTitle,
  categories,
  onClose,
  onRead,
  onExport,
}: {
  journeyTitle: string | null;
  categories: string[];
  onClose: () => void;
  onRead: (parse: TemplateParse, source: string) => void;
  onExport: (() => void) | null;
}) {
  const [over, setOver] = useState(false);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const finish = (text: string, source: string) => {
    const parse = parseJourneyTemplate(text, { categories });
    if (!parse.ok) {
      setError(parse.issues[0]?.detail ?? "This document can't be read.");
      return;
    }
    onRead(parse, source);
  };

  const readFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const text = /\.docx$/i.test(file.name)
        ? await parseDocxBuffer(await file.arrayBuffer())
        : await file.text();
      finish(text, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file can't be read.");
    } finally {
      setBusy(false);
    }
  };

  const readLink = async () => {
    if (!link.trim()) return;
    setError(null);
    setBusy(true);
    const res = await readGoogleDoc(link.trim());
    setBusy(false);
    if (res.error || !res.text) setError(res.error ?? "The document is empty.");
    else finish(res.text, "Google Doc");
  };

  return (
    <div className="hsa-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="hsa-dlg" role="dialog" aria-modal="true" aria-labelledby="imp-t">
        <div className="hsa-dlg-h">
          <div className="hsa-dlg-t">
            <h2 id="imp-t" className="text-h3" style={{ margin: 0 }}>
              Import from a document
            </h2>
            <span className="hs-hint">
              Fill {journeyTitle ? journeyTitle : "this journey"} from a HumanSoul template. You check everything before
              it changes.
            </span>
          </div>
          <button type="button" className="hsa-icon-btn" aria-label="Close" onClick={onClose} style={{ margin: "-6px -6px 0 0" }}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          className={`hsa-drop-zone${over ? " over" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) readFile(f);
          }}
        >
          <span className="hsa-drop-ico">
            <Upload size={22} aria-hidden="true" />
          </span>
          <span className="hsa-drop-t">{busy ? "Reading…" : "Drop a Word file here"}</span>
          <span className="hs-hint">
            or <span style={{ color: "var(--primary)", fontWeight: 500 }}>choose a .docx</span> · a Google Doc
            downloaded as Word works too
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,.txt,.md"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="hsa-or">or</div>

        <div className="hsa-field">
          <label className="hs-label" htmlFor="imp-link">
            Google Docs link
          </label>
          <div className="hsa-inrow">
            <div className="hs-input-wrap" style={{ flex: 1 }}>
              <Link2 size={18} className="hs-lead" aria-hidden="true" />
              <input
                id="imp-link"
                className="hsa-in"
                placeholder="https://docs.google.com/document/d/…"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && readLink()}
              />
            </div>
            <button type="button" className="hs-btn hs-btn-secondary" disabled={busy || !link.trim()} onClick={readLink}>
              Read
            </button>
          </div>
          <span className="hs-hint" style={{ fontSize: 13, lineHeight: "18px" }}>
            Share it as “Anyone with the link can view”.
          </span>
        </div>

        {error ? (
          <div className="hsa-banner err" role="alert">
            <CircleAlert size={18} aria-hidden="true" className="ai" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="hsa-tpl">
          <span className="hsa-tpl-ico">
            <FileText size={20} aria-hidden="true" />
          </span>
          <div>
            <div style={{ font: "500 14px/20px var(--hs-font-sans)" }}>No document yet?</div>
            <div className="hsa-soft">Start from the template{onExport ? ", or export this journey and edit it" : ""}.</div>
            <div style={{ display: "flex", gap: 4, margin: "8px 0 0 -14px", flexWrap: "wrap" }}>
              <a className="hs-btn hs-btn-ghost hs-btn-sm" href="/templates/HumanSoul-journey-template.docx" download>
                <Download size={16} aria-hidden="true" />
                Template
              </a>
              {onExport ? (
                <button type="button" className="hs-btn hs-btn-ghost hs-btn-sm" onClick={onExport}>
                  <Download size={16} aria-hidden="true" />
                  This journey
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hsa-safe">
          <Lock size={16} aria-hidden="true" className="ai" />
          <span>Nothing is saved yet. The cover image, address and publishing stay as they are.</span>
        </div>
      </section>
    </div>
  );
}

/* ── Review: what the document would change ────────────────────────────── */

type Change = { label: string; was: string; now: string };
type Group = { key: string; title: string; changes: Change[]; same: string[]; issues: TemplateIssue[]; days?: DayState[] };
type DayState = { day: number; title: string; state: "same" | "changed" | "new" | "removed" | "error" };

const show = (v: unknown) =>
  Array.isArray(v) ? v.filter(Boolean).join("\n") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v ?? "");

function groupFor(
  fields: TemplateField[],
  current: TemplateValues,
  incoming: Partial<TemplateValues>,
  issues: TemplateIssue[]
) {
  const changes: Change[] = [];
  const same: string[] = [];
  for (const f of fields) {
    if (!(f in incoming)) continue;
    const was = show(current[f]);
    const now = show(incoming[f]);
    if (was.trim() === now.trim()) same.push(fieldName(f));
    else changes.push({ label: fieldName(f), was, now });
  }
  return { changes, same, issues: issues.filter((i) => i.field && fields.includes(i.field)) };
}

export function ImportReview({
  parse,
  source,
  current,
  journeyTitle,
  onCancel,
  onReadAgain,
  onApply,
}: {
  parse: TemplateParse;
  source: string;
  current: TemplateValues;
  journeyTitle: string;
  onCancel: () => void;
  onReadAgain: () => void;
  onApply: (values: Partial<TemplateValues>) => void;
}) {
  const [picked, setPicked] = useState<Partial<Record<TemplateField, string>>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Issues settled by a choice made here no longer block.
  const live = parse.issues.filter((i) => !(i.field && picked[i.field]));
  const errors = live.filter((i) => i.level === "error");
  const warnings = live.filter((i) => i.level === "warning");
  const picks = Object.fromEntries(Object.entries(picked).filter(([, v]) => v)) as Partial<TemplateValues>;
  const incoming: Partial<TemplateValues> = { ...parse.values, ...picks };

  const basics = groupFor(["title", "category", "tagline", "time_required", "featured", "premium"], current, incoming, live);
  const why = groupFor(["purpose", "intro"], current, incoming, live);
  const completion = groupFor(["completion_message", "reflection_questions"], current, incoming, live);

  // Days: compared one by one.
  let days: Group | null = null;
  if (incoming.days) {
    const inc = incoming.days;
    const errDays = new Set(
      live.filter((i) => i.level === "error" && /^Day (\d+)/.test(i.title)).map((i) => Number(/^Day (\d+)/.exec(i.title)![1]))
    );
    const states: DayState[] = [];
    const changes: Change[] = [];
    const len = Math.max(inc.length, current.days.length);
    for (let n = 1; n <= len; n++) {
      const a = current.days.find((d) => d.day === n);
      const b = inc.find((d) => d.day === n);
      if (b && errDays.has(n)) states.push({ day: n, title: b.title || a?.title || "", state: "error" });
      else if (b && !a) {
        states.push({ day: n, title: b.title, state: "new" });
        changes.push({ label: `Day ${n}`, was: "", now: `New day · ${b.title}` });
      } else if (a && !b) {
        states.push({ day: n, title: a.title, state: "removed" });
        changes.push({ label: `Day ${n}`, was: a.title, now: "Removed" });
      } else if (a && b) {
        const fields: [keyof TemplateDay, string][] = [
          ["title", "Day title"],
          ["prompt", "Reading"],
          ["purpose", "Today's intention"],
          ["deeper", "Go deeper"],
        ];
        let changed = false;
        for (const [k, name] of fields) {
          if (String(a[k] ?? "").trim() !== String(b[k] ?? "").trim()) {
            changed = true;
            changes.push({ label: `Day ${n} · ${name}`, was: String(a[k] ?? ""), now: String(b[k] ?? "") });
          }
        }
        states.push({ day: n, title: b.title, state: changed ? "changed" : "same" });
      }
    }
    days = { key: "days", title: `The ${inc.length} days`, changes, same: [], issues: live.filter((i) => /^Day \d+/.test(i.title)), days: states };
  }

  const groups: Group[] = [
    { key: "basics", title: "Cover & basics", ...basics },
    { key: "why", title: "Why this journey", ...why },
    ...(days ? [days] : []),
    { key: "completion", title: "Completion", ...completion },
  ];
  const changeCount = groups.reduce((s, g) => s + g.changes.length, 0);
  const fieldCount =
    Object.keys(incoming).filter((k) => k !== "days").length +
    (incoming.days ? incoming.days.length * 4 : 0);

  return (
    <>
      <div className="hsa-head">
        <div className="hsa-head-t">
          <button type="button" className="hsa-back" onClick={onCancel} style={{ border: 0, background: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={16} aria-hidden="true" />
            {journeyTitle}
          </button>
          <h1 className="text-h1" style={{ margin: 0 }}>
            Check the import
          </h1>
          <span className="hsa-soft" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <FileText size={16} aria-hidden="true" />
            <b style={{ fontWeight: 500, color: "var(--foreground)" }}>{source}</b> · template v1 · read just now
          </span>
        </div>
        <button type="button" className="hs-btn hs-btn-secondary" onClick={onReadAgain}>
          <RefreshCw size={16} aria-hidden="true" />
          Read again
        </button>
      </div>

      <div className="hsa-sum">
        <div className="hsa-card hsa-sum-c">
          <span className="hsa-sum-i ok">
            <CircleCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <div className="hsa-sum-v">{fieldCount} fields read</div>
            <div className="hsa-sum-l">
              {changeCount} {changeCount === 1 ? "of them changes" : "of them change"} something
            </div>
          </div>
        </div>
        <div className="hsa-card hsa-sum-c">
          <span className={`hsa-sum-i ${errors.length ? "er" : "ok"}`}>
            <CircleAlert size={20} aria-hidden="true" />
          </span>
          <div>
            <div className="hsa-sum-v">{errors.length ? `${errors.length} to fix` : "Nothing to fix"}</div>
            <div className="hsa-sum-l">{errors.length ? "Nothing is applied until they're fixed" : "Ready to apply"}</div>
          </div>
        </div>
        <div className="hsa-card hsa-sum-c">
          <span className={`hsa-sum-i ${warnings.length ? "wa" : "ok"}`}>
            <TriangleAlert size={20} aria-hidden="true" />
          </span>
          <div>
            <div className="hsa-sum-v">{warnings.length ? `${warnings.length} to check` : "No warnings"}</div>
            <div className="hsa-sum-l">{warnings.length ? "Can be applied as it is" : " "}</div>
          </div>
        </div>
      </div>

      {live.length || Object.keys(picked).length ? (
        <section className="hsa-rsec" aria-labelledby="r-fix">
          <div className="hsa-rsec-h">
            <h2 id="r-fix" className="text-h3">
              To fix
            </h2>
            <span className="hsa-soft" style={{ fontSize: 14 }}>
              Fix them in the document and read it again, or choose here
            </span>
          </div>
          {parse.issues.map((i, n) => {
            const solved = Boolean(i.field && picked[i.field]);
            return (
              <div className="hsa-iss" key={n}>
                <span className={`hsa-sum-i ${solved ? "ok" : i.level === "error" ? "er" : "wa"}`}>
                  {solved ? (
                    <CircleCheck size={20} aria-hidden="true" />
                  ) : i.level === "error" ? (
                    <CircleAlert size={20} aria-hidden="true" />
                  ) : (
                    <TriangleAlert size={20} aria-hidden="true" />
                  )}
                </span>
                <div>
                  <div className="hsa-iss-t">{i.title}</div>
                  <div className="hsa-iss-m">{solved ? `Using “${picked[i.field!]}”.` : i.detail}</div>
                  {i.choices && i.field ? (
                    <div className="hsa-fix">
                      {i.choices.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={picked[i.field!] === c}
                          onClick={() => setPicked((p) => ({ ...p, [i.field!]: p[i.field!] === c ? undefined : c }))}
                        >
                          {picked[i.field!] === c ? <CircleCheck size={14} aria-hidden="true" /> : null}
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="hsa-line">{i.line ? `Line ${i.line}` : ""}</span>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="hsa-rsec" aria-labelledby="r-what">
        <div className="hsa-rsec-h">
          <h2 id="r-what" className="text-h3">
            What will change
          </h2>
          <span className="hsa-soft" style={{ fontSize: 14 }}>
            Same order as the edit page
          </span>
        </div>
        <div className="hsa-card hsa-rcard">
          {groups.map((g) => {
            const hasErr = g.issues.some((i) => i.level === "error");
            const hasWarn = g.issues.some((i) => i.level === "warning");
            const empty = g.changes.length === 0;
            const isOpen = open[g.key] ?? (!empty || hasErr);
            const note = [
              g.changes.length ? `${g.changes.length} ${g.changes.length === 1 ? "change" : "changes"}` : "No changes",
              hasErr ? `${g.issues.filter((i) => i.level === "error").length} to fix` : null,
              hasWarn ? `${g.issues.filter((i) => i.level === "warning").length} to check` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={g.key} style={{ display: "contents" }}>
                <button
                  type="button"
                  className="hsa-rrow"
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))}
                >
                  <span className={`hsa-ic${hasErr ? " e" : hasWarn ? " w" : empty ? " s" : ""}`}>
                    {hasErr ? (
                      <CircleAlert size={20} aria-hidden="true" />
                    ) : hasWarn ? (
                      <TriangleAlert size={20} aria-hidden="true" />
                    ) : empty ? (
                      <Minus size={20} aria-hidden="true" />
                    ) : (
                      <CircleCheck size={20} aria-hidden="true" />
                    )}
                  </span>
                  <span className="hsa-rrow-t">{g.title}</span>
                  <span className="hsa-rrow-n">{note}</span>
                  <span className="hsa-ic s">{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                </button>
                {isOpen ? (
                  <div className="hsa-det">
                    {g.days ? (
                      <div className="hsa-kept">
                        {g.days.map((d) => (
                          <span
                            key={d.day}
                            style={
                              d.state === "error"
                                ? { background: "var(--destructive-soft)", color: "var(--destructive)" }
                                : d.state === "same"
                                  ? undefined
                                  : { color: "var(--foreground)" }
                            }
                          >
                            {d.state === "error" ? (
                              <CircleAlert size={14} aria-hidden="true" />
                            ) : d.state === "same" ? (
                              <CircleCheck size={14} aria-hidden="true" />
                            ) : null}
                            Day {d.day}
                            {d.state === "new" ? " · new" : d.state === "removed" ? " · removed" : d.state === "changed" ? " · edited" : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {g.changes.map((c, n) => (
                      <div className="hsa-diff" key={n}>
                        <span className="hsa-diff-k">{c.label}</span>
                        <div className="hsa-diff-v">
                          {c.was ? <span className="hsa-was">{c.was}</span> : null}
                          <span className="hsa-now">{c.now || "(empty)"}</span>
                        </div>
                      </div>
                    ))}
                    {g.same.length ? <span className="hsa-soft">{g.same.join(", ")} stay the same.</span> : null}
                    {empty && !g.same.length && !g.days ? <span className="hsa-soft">Not in the document. Stays as it is.</span> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="hsa-rsec" aria-labelledby="r-kept">
        <div className="hsa-rsec-h">
          <h2 id="r-kept" className="text-h3">
            Not in the document
          </h2>
          <span className="hsa-soft" style={{ fontSize: 14 }}>
            These stay exactly as they are
          </span>
        </div>
        <div className="hsa-kept">
          {["Cover image", "Address", "Status & publish date"].map((k) => (
            <span key={k}>
              <Lock size={14} aria-hidden="true" />
              {k}
            </span>
          ))}
        </div>
        {parse.notStored.length ? (
          <p className="hsa-soft" style={{ margin: 0 }}>
            Read but not saved yet (the app has no place for them): {parse.notStored.join(", ")}.
          </p>
        ) : null}
      </section>

      <div className="hsa-bar">
        {errors.length ? (
          <span className="hsa-bar-m">
            <CircleAlert size={16} aria-hidden="true" />
            Fix the {errors.length === 1 ? "issue" : `${errors.length} issues`} above to apply
          </span>
        ) : (
          <span className="hsa-bar-m ok">
            <CircleCheck size={16} aria-hidden="true" />
            Applying fills the form. Nothing is saved until you press Save.
          </span>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="hs-btn hs-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="hs-btn hs-btn-default"
            disabled={errors.length > 0 || changeCount === 0}
            onClick={() => onApply(incoming)}
          >
            Apply changes
          </button>
        </div>
      </div>
    </>
  );
}
