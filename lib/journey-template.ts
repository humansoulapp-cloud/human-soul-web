/**
 * The HumanSoul journey template: a plain document with fixed labels that
 * Admin can import without guessing, and export back in the same shape.
 *
 *   HUMANSOUL JOURNEY · v1
 *   == Cover & basics ==
 *   Title: …
 *   Introduction:
 *   <<<
 *   paragraphs…
 *   >>>
 *   Closing questions:
 *   - …
 *
 * Nothing is applied from here: `parseJourneyTemplate` only reports what the
 * document holds and what's wrong with it, and the editor decides.
 */

export const TEMPLATE_MARK = "HUMANSOUL JOURNEY · v1";

export type TemplateDay = {
  day: number;
  title: string;
  prompt: string; // the day's reading
  purpose: string; // why this day
  deeper: string;
};

export type TemplateValues = {
  title: string;
  category: string;
  tagline: string;
  time_required: string;
  featured: boolean;
  premium: boolean;
  purpose: string; // "Why this journey" headline
  intro: string;
  completion_message: string;
  reflection_questions: string[];
  days: TemplateDay[];
};

export type TemplateField = Exclude<keyof TemplateValues, "days">;

export type TemplateIssue = {
  level: "error" | "warning";
  line: number | null;
  title: string;
  detail: string;
  /** Set when the issue can be settled by picking one of these values. */
  field?: TemplateField;
  choices?: string[];
};

export type TemplateParse = {
  ok: boolean; // a template at all
  values: Partial<TemplateValues>;
  issues: TemplateIssue[];
  /** Labels the template has but the app doesn't store yet, with content. */
  notStored: string[];
  /** Day numbers and line numbers, for messages. */
  dayLines: Record<number, number>;
};

type Section = "basics" | "why" | "find" | "change" | "completion" | "publishing" | { day: number };

const SECTIONS: Record<string, Section> = {
  "cover & basics": "basics",
  "cover and basics": "basics",
  basics: "basics",
  "why this journey": "why",
  "what you'll find": "find",
  "what may change": "change",
  completion: "completion",
  publishing: "publishing",
};

/* label → where it goes. `null` = part of the template, not stored yet. */
const LABELS: Record<string, Record<string, string | null>> = {
  basics: {
    title: "title",
    category: "category",
    tagline: "tagline",
    "time per day": "time_required",
    featured: "featured",
    plus: "premium",
    "days open": null,
    days: null,
  },
  why: { headline: "purpose", introduction: "intro", "a good fit if you": null },
  find: { "use the standard text": null, headline: null },
  change: { headline: null, introduction: null, "what may change": null },
  completion: {
    "closing message": "completion_message",
    "closing questions": "reflection_questions",
    "day complete message": null,
    "journey complete title": null,
    "suggested journeys": null,
  },
  publishing: { address: null, status: null, published: null, "publish date": null },
  day: {
    "day title": "title",
    reading: "prompt",
    "why this day": "purpose",
    "go deeper": "deeper",
    time: null,
    summary: null,
    "writing prompt": null,
  },
};

const NICE: Record<string, string> = {
  title: "Title",
  category: "Category",
  tagline: "Tagline",
  time_required: "Time per day",
  featured: "Featured",
  premium: "Plus",
  purpose: "Why this journey · Headline",
  intro: "Why this journey · Introduction",
  completion_message: "Closing message",
  reflection_questions: "Closing questions",
};
export const fieldName = (f: string) => NICE[f] ?? f;

/* Values the blank template ships with, so they don't count as content. */
const TEMPLATE_DEFAULTS: Record<string, string> = {
  "days open": "After the previous day is written",
  "use the standard text": "Yes",
  time: "About 7 min · read, then write",
};

const LIST_RE = /^\s*(?:[-*•●–]\s+)(.*)$/;

function norm(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, " ")
    .replace(/[​-‍﻿]/g, "");
}

function cleanBlock(lines: string[]) {
  return lines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function yesNo(v: string): boolean | null {
  const s = v.trim().toLowerCase();
  if (["yes", "y", "true", "on", "sí", "si"].includes(s)) return true;
  if (["no", "n", "false", "off"].includes(s)) return false;
  return null;
}

export function parseJourneyTemplate(text: string, opts: { categories: string[] }): TemplateParse {
  const lines = norm(text).split(/\r?\n/).map((l) => l.replace(/\s+$/, "").replace(/^#{1,6}\s+/, ""));
  const issues: TemplateIssue[] = [];
  const notStored = new Set<string>();
  const values: Partial<TemplateValues> = {};
  const days = new Map<number, Partial<TemplateDay> & { line: number }>();
  const dayLines: Record<number, number> = {};

  const markAt = lines.findIndex((l) => /^\s*humansoul\s+journey\b.*\bv\s*1\b/i.test(l));
  if (markAt < 0) {
    return {
      ok: false,
      values,
      issues: [
        {
          level: "error",
          line: null,
          title: "This isn't a HumanSoul journey template",
          detail: `The line ${TEMPLATE_MARK} wasn't found. Download the template, paste your text into it and try again.`,
        },
      ],
      notStored: [],
      dayLines,
    };
  }

  let section: Section | null = null;
  let i = markAt + 1;
  const err = (line: number, title: string, detail: string) =>
    issues.push({ level: "error", line: line + 1, title, detail });

  const setField = (key: string, raw: string | string[], line: number, label: string) => {
    if (key === "featured" || key === "premium") {
      const v = yesNo(String(raw));
      if (v === null) {
        err(line, `${fieldName(key)} must be Yes or No`, `It says “${String(raw)}”.`);
        return;
      }
      values[key] = v;
      return;
    }
    if (key === "category") {
      const want = String(raw).trim();
      const match = opts.categories.find((c) => c.toLowerCase() === want.toLowerCase());
      if (match) values.category = match;
      else
        issues.push({
          level: "error",
          line: line + 1,
          title: `Category “${want}” doesn't exist`,
          detail: "Pick one of the categories, or fix the spelling in the document.",
          field: "category",
          choices: opts.categories,
        });
      return;
    }
    if (key === "reflection_questions") {
      values.reflection_questions = Array.isArray(raw) ? raw : [raw];
      return;
    }
    (values as Record<string, unknown>)[key] = Array.isArray(raw) ? raw.join("\n") : raw;
    void label;
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      i += 1;
      continue;
    }
    if (/^end$/i.test(t)) break;

    const sec = /^=+\s*(.+?)\s*=+$/.exec(t);
    if (sec) {
      const name = sec[1].toLowerCase();
      const dm = /^day\s+(\d+)$/.exec(name);
      if (dm) {
        const n = Number(dm[1]);
        if (days.has(n)) err(i, `Day ${n} appears twice`, "Each day needs its own number.");
        else {
          days.set(n, { day: n, line: i + 1 });
          dayLines[n] = i + 1;
        }
        section = { day: n };
      } else if (SECTIONS[name]) {
        section = SECTIONS[name];
      } else {
        err(i, `Unknown section “${sec[1]}”`, "Keep the section names exactly as in the template.");
        section = null;
      }
      i += 1;
      continue;
    }

    // Helper lines from the template itself.
    if (/^only if the line above/i.test(t)) {
      i += 1;
      continue;
    }

    const lab = /^([A-Za-z][A-Za-z0-9 '&/-]*?)(?:\s*\((?:optional)\))?\s*:\s*(.*)$/.exec(t);
    if (!lab || !section) {
      err(i, "A line the import doesn't understand", `“${t.slice(0, 80)}” isn't under a label. Long texts go between <<< and >>>.`);
      i += 1;
      continue;
    }

    const label = lab[1].trim().toLowerCase();
    let value = lab[2].trim();
    const table = typeof section === "object" ? LABELS.day : LABELS[section];
    const isCard = typeof section === "string" && section === "find" && /^card \d+ (title|text)$/.test(label);
    const key = isCard ? null : table[label];
    if (key === undefined) {
      err(i, `Unknown label “${lab[1]}”`, "Keep every label exactly as written in the template, colon included.");
      i += 1;
      continue;
    }
    const startLine = i;
    i += 1;

    // A block or a list follows an empty value.
    let content: string | string[] = value;
    if (!value) {
      let j = i;
      while (j < lines.length && !lines[j].trim()) j += 1;
      if (j < lines.length && lines[j].trim() === "<<<") {
        const block: string[] = [];
        let k = j + 1;
        while (k < lines.length && lines[k].trim() !== ">>>") {
          block.push(lines[k]);
          k += 1;
        }
        if (k >= lines.length) {
          err(j, `“${lab[1]}” is missing its closing >>>`, "Every <<< needs a >>> on its own line after the text.");
          i = lines.length;
        } else i = k + 1;
        content = cleanBlock(block);
      } else if (j < lines.length && LIST_RE.test(lines[j])) {
        const items: string[] = [];
        let k = j;
        while (k < lines.length && (LIST_RE.test(lines[k]) || /^\s*[-*•●–]\s*$/.test(lines[k]) || !lines[k].trim())) {
          const m = LIST_RE.exec(lines[k]);
          if (m && m[1].trim()) items.push(m[1].trim());
          k += 1;
        }
        i = k;
        content = items;
      } else if (j < lines.length && /^\s*[-*•●–]\s*$/.test(lines[j])) {
        // Empty bullets from the blank template.
        let k = j;
        while (k < lines.length && (/^\s*[-*•●–]\s*$/.test(lines[k]) || !lines[k].trim())) k += 1;
        i = k;
        content = [];
      }
    }
    value = Array.isArray(content) ? content.join("\n") : content;

    if (key === null) {
      if (value.trim() && TEMPLATE_DEFAULTS[label] !== value.trim()) notStored.add(lab[1].trim());
      continue;
    }
    if (!value.trim()) continue; // empty = leave as it is

    if (typeof section === "object") {
      const d = days.get(section.day);
      if (d) (d as Record<string, unknown>)[key] = value;
    } else {
      setField(key, content, startLine, lab[1]);
    }
  }

  // Untouched day blocks from the blank template don't count.
  for (const [n, d] of days) {
    if (![d.title, d.prompt, d.purpose, d.deeper].some((x) => x?.trim())) days.delete(n);
  }

  // Days: numbered 1..N, each with a title and a reading.
  if (days.size > 0) {
    const nums = [...days.keys()].sort((a, b) => a - b);
    nums.forEach((n, idx) => {
      if (n !== idx + 1) {
        issues.push({
          level: "error",
          line: days.get(n)!.line,
          title: `Day ${n} is out of order`,
          detail: `Days must run 1, 2, 3… without gaps. Expected Day ${idx + 1}.`,
        });
      }
    });
    const out: TemplateDay[] = [];
    for (const n of nums) {
      const d = days.get(n)!;
      if (!d.title?.trim())
        issues.push({ level: "error", line: d.line, title: `Day ${n} · Day title is empty`, detail: "Every day needs a title." });
      if (!d.prompt?.trim())
        issues.push({
          level: "error",
          line: d.line,
          title: `Day ${n} · Reading is empty`,
          detail: "Every day needs its reading, between <<< and >>> after Reading:",
        });
      out.push({ day: n, title: d.title ?? "", prompt: d.prompt ?? "", purpose: d.purpose ?? "", deeper: d.deeper ?? "" });
    }
    values.days = out;
  }

  if (!values.title && !issues.some((x) => x.title.startsWith("Title")))
    issues.push({ level: "warning", line: null, title: "No title in the document", detail: "The current title stays as it is." });

  return { ok: true, values, issues, notStored: [...notStored], dayLines };
}

/* ── Export ─────────────────────────────────────────────────────────────── */

export function journeyToTemplateLines(v: TemplateValues): string[] {
  const out: string[] = [];
  const label = (k: string, val = "") => out.push(`${k}: ${val}`.trimEnd());
  const block = (k: string, val: string) => {
    out.push(`${k}:`, "<<<", ...(val ? val.split("\n") : [""]), ">>>");
  };
  const list = (k: string, items: string[]) => {
    out.push(`${k}:`, ...(items.length ? items.map((x) => `- ${x}`) : ["- "]));
  };
  const sec = (name: string) => out.push("", `== ${name} ==`);

  out.push(TEMPLATE_MARK);
  sec("Cover & basics");
  label("Title", v.title);
  label("Category", v.category);
  label("Tagline", v.tagline);
  label("Time per day", v.time_required);
  label("Featured", v.featured ? "Yes" : "No");
  label("Plus", v.premium ? "Yes" : "No");
  sec("Why this journey");
  label("Headline", v.purpose);
  block("Introduction", v.intro);
  for (const d of v.days) {
    sec(`Day ${d.day}`);
    label("Day title", d.title);
    block("Reading", d.prompt);
    block("Why this day", d.purpose);
    label("Go deeper (optional)", d.deeper);
  }
  sec("Completion");
  block("Closing message", v.completion_message);
  list("Closing questions", v.reflection_questions);
  out.push("", "END");
  return out;
}

/* A minimal .docx (one paragraph per line, labels in bold), so an export opens
   in Word and Google Docs and comes back through the same import. */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(files: { name: string; data: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.data);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(8, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cenSize = central.reduce((s, c) => s + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function linesToDocx(lines: string[]): Uint8Array {
  const run = (text: string, bold = false, color?: string) =>
    `<w:r><w:rPr>${bold ? "<w:b/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  const body = lines
    .map((l) => {
      if (/^==.*==$/.test(l)) return `<w:p><w:pPr><w:spacing w:before="240"/></w:pPr>${run(l, true, "4F6E55")}</w:p>`;
      if (l === TEMPLATE_MARK || l === "END") return `<w:p>${run(l, true, "4F6E55")}</w:p>`;
      if (l === "<<<" || l === ">>>") return `<w:p>${run(l, false, "4F6E55")}</w:p>`;
      const m = /^([A-Za-z][A-Za-z0-9 '&()/-]*:)(.*)$/.exec(l);
      if (m) return `<w:p>${run(m[1], true)}${run(m[2])}</w:p>`;
      return `<w:p>${run(l)}</w:p>`;
    })
    .join("");
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1200" w:right="1300" w:bottom="1200" w:left="1300" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zipStore([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    },
    { name: "word/document.xml", data: doc },
  ]);
}
