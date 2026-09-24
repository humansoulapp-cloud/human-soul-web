/**
 * Document Parser for Journeys (Human Soul Web Admin)
 * 
 * Supports:
 * - Microsoft Word documents (.docx) via zero-dependency client/server ZIP & XML extraction
 * - Google Docs (via .docx export, public sharing URL, or clipboard copy-paste)
 * - Markdown (.md), Plain Text (.txt), and Rich Text / HTML
 * - Heuristic intelligent structural analysis to extract metadata, day-by-day content, deeper reflections, and completion info
 */

import { type JourneyInput, type JourneyDayInput } from "@/lib/actions/journeys";

export type ParsedJourneyResult = {
  journey: JourneyInput;
  warnings: string[];
  stats: {
    totalDays: number;
    hasPurpose: boolean;
    hasIntro: boolean;
    hasCompletionMessage: boolean;
    reflectionQuestionCount: number;
    rawCharacterCount: number;
  };
  rawText: string;
};

// ─── ZIP & DOCX Parser (Pure TypeScript, Zero External Dependencies) ─────────────

/**
 * Extracts `word/document.xml` from a .docx file ArrayBuffer.
 * Works natively in modern browsers and Node 18+ using DecompressionStream.
 */
export async function parseDocxBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  
  // Find and extract word/document.xml from ZIP
  const xmlContent = await extractFileFromZip(bytes, "word/document.xml");
  if (!xmlContent) {
    throw new Error(
      "Could not find 'word/document.xml' in the uploaded file. Please ensure this is a valid .docx document."
    );
  }

  return convertDocxXmlToText(xmlContent);
}

/**
 * Reads ZIP local file headers and extracts a specific entry by relative path.
 */
async function extractFileFromZip(bytes: Uint8Array, targetPath: string): Promise<string | null> {
  let offset = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset + 30 <= bytes.length) {
    // Check Local File Header signature 0x04034b50 ("PK\x03\x04")
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) {
      // Seek next PK signature or end
      offset++;
      continue;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraFieldLen = view.getUint16(offset + 28, true);

    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLen;
    if (nameEnd > bytes.length) break;

    const fileName = new TextDecoder("utf-8").decode(bytes.subarray(nameStart, nameEnd));
    const dataStart = nameEnd + extraFieldLen;
    
    // Check if this is the file we want
    if (fileName === targetPath || fileName.endsWith("/" + targetPath)) {
      const dataEnd = dataStart + compressedSize;
      const compressedData = bytes.subarray(dataStart, dataEnd);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return new TextDecoder("utf-8").decode(compressedData);
      } else if (compressionMethod === 8) {
        // Deflated (standard ZIP compression)
        try {
          if (typeof DecompressionStream !== "undefined") {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(compressedData);
            writer.close();
            const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
            return new TextDecoder("utf-8").decode(decompressedBuffer);
          }
        } catch (err) {
          console.warn("DecompressionStream error:", err);
        }
      }
    }

    // Advance to next entry
    offset = dataStart + compressedSize;
  }

  return null;
}

/**
 * Converts Word document.xml into clean, structured plain text / Markdown.
 * Preserves paragraphs, headings, bullet points, and line breaks.
 */
export function convertDocxXmlToText(xmlStr: string): string {
  // If in browser, use DOMParser for highest accuracy
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, "application/xml");
      const paragraphs = doc.getElementsByTagName("w:p");
      const lines: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        let pText = "";
        
        // Check for heading styles
        const pStyle = p.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") || "";
        const isHeading1 = /heading\s*1|title/i.test(pStyle);
        const isHeading2 = /heading\s*2|subtitle/i.test(pStyle);
        const isHeading3 = /heading\s*3/i.test(pStyle);

        const runs = p.getElementsByTagName("w:r");
        for (let j = 0; j < runs.length; j++) {
          const r = runs[j];
          const texts = r.getElementsByTagName("w:t");
          for (let k = 0; k < texts.length; k++) {
            pText += texts[k].textContent || "";
          }
          if (r.getElementsByTagName("w:br").length > 0) {
            pText += "\n";
          }
          if (r.getElementsByTagName("w:tab").length > 0) {
            pText += "\t";
          }
        }

        const trimmed = pText.trim();
        if (!trimmed) {
          lines.push("");
          continue;
        }

        if (isHeading1) {
          lines.push(`# ${trimmed}`);
        } else if (isHeading2) {
          lines.push(`## ${trimmed}`);
        } else if (isHeading3) {
          lines.push(`### ${trimmed}`);
        } else {
          lines.push(pText);
        }
      }

      return lines.join("\n");
    } catch (err) {
      console.warn("DOMParser failed, falling back to regex XML parser:", err);
    }
  }

  // Robust Regex-based fallback for Node / SSR
  const cleanXml = xmlStr
    .replace(/<w:tab[^>]*\/>/gi, "\t")
    .replace(/<w:br[^>]*\/>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n\n")
    .replace(/<w:pStyle[^>]*w:val="([^"]*)"[^>]*>/gi, (_, style) => {
      if (/heading\s*1|title/i.test(style)) return "# ";
      if (/heading\s*2|subtitle/i.test(style)) return "## ";
      if (/heading\s*3/i.test(style)) return "### ";
      return "";
    })
    .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi, "$1")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(cleanXml);
}

// ─── HTML & Rich Text Converter (For Google Docs Copy-Paste) ─────────────────────

/**
 * Converts rich HTML pasted from Google Docs or Word into structured Markdown/text.
 */
export function parseHtmlToText(html: string): string {
  if (!html) return "";

  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Process headings
      ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag, idx) => {
        const headings = doc.querySelectorAll(tag);
        headings.forEach((h) => {
          const prefix = "#".repeat(idx + 1);
          h.textContent = `${prefix} ${h.textContent?.trim()}\n`;
        });
      });

      // Process list items
      const listItems = doc.querySelectorAll("li");
      listItems.forEach((li) => {
        li.textContent = `- ${li.textContent?.trim()}\n`;
      });

      // Process paragraphs and breaks
      const paragraphs = doc.querySelectorAll("p");
      paragraphs.forEach((p) => {
        p.textContent = `${p.textContent?.trim()}\n\n`;
      });

      return doc.body.textContent || "";
    } catch {
      // fallback
    }
  }

  // Regex fallback
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── Google Docs URL Parser ──────────────────────────────────────────────────────

/**
 * Extracts Google Doc ID from a URL.
 * Matches:
 * https://docs.google.com/document/d/1XyZ.../edit
 * https://docs.google.com/document/u/0/d/1XyZ...
 */
export function extractGoogleDocId(url: string): string | null {
  const match = url.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Fetches public text from Google Docs export URL if publicly viewable.
 */
export async function fetchGoogleDocPublicText(docId: string): Promise<{ text?: string; error?: string }> {
  try {
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const res = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HumanSoulImporter/1.0)",
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        return {
          error:
            "This Google Doc is private or requires login. In Google Docs, click 'Share' → set 'General access' to 'Anyone with the link can view', or copy and paste the document text below.",
        };
      }
      return { error: `Failed to fetch Google Doc (HTTP ${res.status}).` };
    }

    const text = await res.text();
    if (!text || text.length < 20) {
      return { error: "The document appears to be empty or unreadable." };
    }

    return { text };
  } catch (err: any) {
    return {
      error:
        err?.message ||
        "Could not connect to Google Docs. Ensure the document is public or paste the text directly.",
    };
  }
}

// ─── Intelligent Structural Journey Parser ────────────────────────────────────────

/**
 * Normalizes text lines, removing smart quotes and zero-width spaces.
 */
function cleanText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, "twenty-one": 21, "twenty-two": 22, "twenty-three": 23,
  "twenty-four": 24, "twenty-five": 25, "twenty-six": 26, "twenty-seven": 27, "twenty-eight": 28,
  "twenty-nine": 29, thirty: 30, "thirty-one": 31,
};

/**
 * Checks if a line is a Day Header.
 * Examples:
 * - "Day 1: Beginning Where You Are"
 * - "Day 1 - Beginning Where You Are"
 * - "## Day 1: Beginning Where You Are"
 * - "Day 01"
 * - "Day One: The Start"
 * - "DAY 1"
 */
function parseDayHeader(line: string): { dayNum: number; dayTitle: string } | null {
  const trimmed = line.trim().replace(/^#+\s*/, "");
  
  // Match Day N or Day Word
  const dayMatch = trimmed.match(
    /^day\s+(\d+|[a-zA-Z-]+)(?:\s*[:\-–\.]\s*(.*)|(?:\s*\(.*?\))?\s*[:\-–\.]?\s*(.*))$/i
  );

  if (!dayMatch) return null;

  const rawNum = dayMatch[1].toLowerCase();
  let dayNum = parseInt(rawNum, 10);
  if (isNaN(dayNum) && NUMBER_WORDS[rawNum]) {
    dayNum = NUMBER_WORDS[rawNum];
  }

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 365) return null;

  const titlePart = (dayMatch[2] || dayMatch[3] || "").trim();
  return {
    dayNum,
    dayTitle: titlePart,
  };
}

/**
 * Master Intelligent Parser:
 * Turns unstructured text / markdown / docx output into a fully structured Journey object.
 */
export function parseRawTextToJourney(rawInput: string): ParsedJourneyResult {
  const rawText = cleanText(rawInput);
  const lines = rawText.split("\n").map((l) => l.trimEnd());
  const warnings: string[] = [];

  // Intermediate state
  let title = "";
  let tagline = "";
  let category = "Human Soul Foundations";
  let realm = "Human Soul Foundations";
  let purpose = "";
  let intro = "";
  let timeRequired = "About 7 minutes a day";
  let imageUrl = "";
  let premium = false;
  let featured = false;
  let completionMessage = "";
  let reflectionQuestions: string[] = [];

  type RawDaySection = {
    dayNum: number;
    title: string;
    purpose: string;
    promptLines: string[];
    deeper: string;
  };

  const daySections: RawDaySection[] = [];
  let currentDay: RawDaySection | null = null;
  let currentTopSection: "meta" | "purpose" | "intro" | "completion" | "reflection_questions" = "meta";
  const purposeLines: string[] = [];
  const introLines: string[] = [];
  const completionLines: string[] = [];

  let isInsideDays = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const cleanHeaderLine = trimmed.replace(/^#+\s*/, "").trim();

    // 1. Check for Completion Section Headers
    if (
      /^(?:journey\s+)?completion(?:\s+message)?\s*[:\-–]?/i.test(cleanHeaderLine) ||
      /^(?:journey\s+)?conclusion\s*[:\-–]?/i.test(cleanHeaderLine) ||
      /^(?:closing\s+message|final\s+thoughts|wrap[- ]up)\s*[:\-–]?/i.test(cleanHeaderLine)
    ) {
      currentTopSection = "completion";
      isInsideDays = false;
      const inlineMsg = cleanHeaderLine.replace(/^(?:journey\s+)?(?:completion(?:\s+message)?|conclusion|closing\s+message|final\s+thoughts|wrap[- ]up)\s*[:\-–]?\s*/i, "");
      if (inlineMsg) completionLines.push(inlineMsg);
      continue;
    }

    // 2. Check for Reflection / Completion Questions Headers
    if (
      /^(?:journey\s+)?(?:completion|reflection|closing|final)\s+questions\s*[:\-–]?/i.test(cleanHeaderLine) ||
      /^questions\s+for\s+reflection\s*[:\-–]?/i.test(cleanHeaderLine)
    ) {
      currentTopSection = "reflection_questions";
      isInsideDays = false;
      continue;
    }

    // 3. Check for Day Header
    const dayHeader = parseDayHeader(line);
    if (dayHeader) {
      isInsideDays = true;
      if (currentDay) {
        daySections.push(currentDay);
      }
      currentDay = {
        dayNum: dayHeader.dayNum || daySections.length + 1,
        title: dayHeader.dayTitle || "",
        purpose: "",
        promptLines: [],
        deeper: "",
      };
      continue;
    }

    // If we are parsing inside a Day block
    if (isInsideDays && currentDay) {
      // Check if this line is an explicit Day Title
      if (/^(?:day\s+)?title\s*[:\-–]\s*(.+)/i.test(trimmed)) {
        const m = trimmed.match(/^(?:day\s+)?title\s*[:\-–]\s*(.+)/i);
        if (m) currentDay.title = m[1].trim();
        continue;
      }

      // Check if Day Title is on the line right after Day Header if title was blank
      if (!currentDay.title && trimmed && !currentDay.promptLines.length && !/^(?:purpose|prompt|deeper|theme|intention|focus|question)\s*[:\-–]/i.test(trimmed)) {
        // If it's a short line, treat as title
        if (trimmed.length < 80 && !trimmed.includes(".") && !trimmed.endsWith(",")) {
          currentDay.title = trimmed.replace(/^#+\s*/, "");
          continue;
        }
      }

      // Check for Day Purpose / Theme
      if (/^(?:day\s+)?(?:purpose|theme|intention|focus|subtitle|short\s+purpose)\s*[:\-–]\s*(.+)/i.test(trimmed)) {
        const m = trimmed.match(/^(?:day\s+)?(?:purpose|theme|intention|focus|subtitle|short\s+purpose)\s*[:\-–]\s*(.+)/i);
        if (m) currentDay.purpose = m[1].trim();
        continue;
      }

      // Check for Deeper Reflection Question
      if (/^(?:deeper(?:\s+reflection)?(?:\s+question)?|daily\s+question|reflection\s+question|deeper\s+inquiry|question)\s*[:\-–]\s*(.+)/i.test(trimmed)) {
        const m = trimmed.match(/^(?:deeper(?:\s+reflection)?(?:\s+question)?|daily\s+question|reflection\s+question|deeper\s+inquiry|question)\s*[:\-–]\s*(.+)/i);
        if (m) currentDay.deeper = m[1].trim();
        continue;
      }

      // Check for Prompt prefix
      if (/^(?:daily\s+)?(?:prompt|reflection|body)\s*[:\-–]\s*(.*)/i.test(trimmed)) {
        const m = trimmed.match(/^(?:daily\s+)?(?:prompt|reflection|body)\s*[:\-–]\s*(.*)/i);
        if (m && m[1].trim()) {
          currentDay.promptLines.push(m[1].trim());
        }
        continue;
      }

      // Regular line inside day
      currentDay.promptLines.push(line);
      continue;
    }

    // Top-level sections (Before days or after days)
    if (currentTopSection === "completion") {
      if (trimmed) completionLines.push(line);
      continue;
    }

    if (currentTopSection === "reflection_questions") {
      if (trimmed) {
        // Match numbered question (1. ..., 2. ...) or bullet (- ..., * ...)
        const qMatch = trimmed.match(/^(?:\d+[\.\)]\s*|[\-\*•]\s*)(.+)/);
        if (qMatch) {
          reflectionQuestions.push(qMatch[1].trim());
        } else if (trimmed.endsWith("?")) {
          reflectionQuestions.push(trimmed);
        }
      }
      continue;
    }

    // Check Metadata fields
    if (/^title\s*[:\-–]\s*(.+)/i.test(trimmed) && !title) {
      const m = trimmed.match(/^title\s*[:\-–]\s*(.+)/i);
      if (m) title = m[1].trim();
      continue;
    }

    if (/^tagline\s*[:\-–]\s*(.+)/i.test(trimmed) || /^subtitle\s*[:\-–]\s*(.+)/i.test(trimmed) || /^summary\s*[:\-–]\s*(.+)/i.test(trimmed)) {
      const m = trimmed.match(/^(?:tagline|subtitle|summary)\s*[:\-–]\s*(.+)/i);
      if (m) tagline = m[1].trim();
      continue;
    }

    if (/^category\s*[:\-–]\s*(.+)/i.test(trimmed)) {
      const m = trimmed.match(/^category\s*[:\-–]\s*(.+)/i);
      if (m) category = m[1].trim();
      continue;
    }

    if (/^realm\s*[:\-–]\s*(.+)/i.test(trimmed)) {
      const m = trimmed.match(/^realm\s*[:\-–]\s*(.+)/i);
      if (m) realm = m[1].trim();
      continue;
    }

    if (/^(?:time\s+required|duration|time)\s*[:\-–]\s*(.+)/i.test(trimmed)) {
      const m = trimmed.match(/^(?:time\s+required|duration|time)\s*[:\-–]\s*(.+)/i);
      if (m) timeRequired = m[1].trim();
      continue;
    }

    if (/^(?:image\s+url|image|cover)\s*[:\-–]\s*(.+)/i.test(trimmed)) {
      const m = trimmed.match(/^(?:image\s+url|image|cover)\s*[:\-–]\s*(.+)/i);
      if (m) imageUrl = m[1].trim();
      continue;
    }

    if (/^premium\s*[:\-–]\s*(yes|true|1)/i.test(trimmed)) {
      premium = true;
      continue;
    }

    if (/^featured\s*[:\-–]\s*(yes|true|1)/i.test(trimmed)) {
      featured = true;
      continue;
    }

    // Top-level Purpose header
    if (/^(?:journey\s+)?purpose\s*[:\-–]?\s*(.*)/i.test(cleanHeaderLine) || /^(?:journey\s+)?intention\s*[:\-–]?\s*(.*)/i.test(cleanHeaderLine) || /^about\s+this\s+journey\s*[:\-–]?\s*(.*)/i.test(cleanHeaderLine)) {
      currentTopSection = "purpose";
      const m = cleanHeaderLine.match(/^(?:(?:journey\s+)?(?:purpose|intention)|about\s+this\s+journey)\s*[:\-–]?\s*(.*)/i);
      if (m && m[1].trim()) purposeLines.push(m[1].trim());
      continue;
    }

    // Top-level Intro header
    if (/^(?:full\s+)?(?:journey\s+)?intro(?:duction)?\s*[:\-–]?\s*(.*)/i.test(cleanHeaderLine) || /^welcome\s*[:\-–]?\s*(.*)/i.test(cleanHeaderLine)) {
      currentTopSection = "intro";
      const m = cleanHeaderLine.match(/^(?:(?:full\s+)?(?:journey\s+)?intro(?:duction)?|welcome)\s*[:\-–]?\s*(.*)/i);
      if (m && m[1].trim()) introLines.push(m[1].trim());
      continue;
    }

    // If still in top sections
    if (currentTopSection === "purpose") {
      purposeLines.push(line);
      continue;
    }

    if (currentTopSection === "intro") {
      introLines.push(line);
      continue;
    }

    // First Heading 1 or Title candidate if no title found yet
    if (!title && trimmed) {
      if (line.startsWith("# ") || line.startsWith("## ")) {
        title = trimmed.replace(/^#+\s*/, "");
        continue;
      }
      if (i === 0 || (i === 1 && !lines[0].trim())) {
        title = trimmed;
        continue;
      }
    }
  }

  // Push the final day if remaining
  if (currentDay) {
    daySections.push(currentDay);
  }

  // Format extracted purpose & intro
  purpose = purposeLines.join("\n").trim();
  intro = introLines.join("\n").trim();
  completionMessage = completionLines.join("\n").trim();

  // If tagline is missing, try to derive from first sentence of purpose or title
  if (!tagline && purpose) {
    const firstSentence = purpose.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length < 120) {
      tagline = firstSentence;
    }
  }

  // Convert Day Sections into standard JourneyDayInput
  const days: JourneyDayInput[] = daySections.map((ds, index) => {
    const dayNumber = ds.dayNum || index + 1;
    let dayTitle = ds.title.trim();
    if (!dayTitle) {
      dayTitle = `Day ${dayNumber}`;
    }

    const rawPrompt = ds.promptLines.join("\n").trim();
    
    return {
      day: dayNumber,
      title: dayTitle,
      purpose: ds.purpose.trim(),
      prompt: rawPrompt,
      deeper: ds.deeper.trim() || null,
    };
  });

  // Sort days by day number
  days.sort((a, b) => a.day - b.day);

  // If no days found, create Day 1 fallback with available text
  if (days.length === 0) {
    warnings.push("No specific 'Day 1', 'Day 2', etc. day headers were detected. A starter Day 1 has been created from your content.");
    days.push({
      day: 1,
      title: "Beginning Where You Are",
      purpose: "",
      prompt: purpose || rawText.slice(0, 500),
      deeper: null,
    });
  }

  // Diagnostics & Quality Checks
  if (!title) {
    title = "Untitled Journey";
    warnings.push("Could not find a Journey Title. Please name your journey.");
  }

  if (!purpose && !intro) {
    warnings.push("No Purpose or Introduction section was detected. You can fill these in the form.");
  }

  const emptyPromptDays = days.filter((d) => !d.prompt.trim());
  if (emptyPromptDays.length > 0) {
    warnings.push(
      `${emptyPromptDays.length} day(s) (${emptyPromptDays.map((d) => `Day ${d.day}`).join(", ")}) have empty reflection prompts.`
    );
  }

  if (reflectionQuestions.length === 0) {
    reflectionQuestions = ["", "", ""];
  } else {
    while (reflectionQuestions.length < 3) {
      reflectionQuestions.push("");
    }
  }

  // Derive Slug ID
  const id = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const journeyInput: JourneyInput = {
    id,
    title,
    category,
    realm: realm || category,
    tagline,
    purpose,
    intro,
    time_required: timeRequired,
    image_url: imageUrl,
    premium,
    featured,
    completion_message: completionMessage,
    reflection_questions: reflectionQuestions,
    status: "published",
    scheduled_publish_at: null,
    days,
  };

  return {
    journey: journeyInput,
    warnings,
    stats: {
      totalDays: days.length,
      hasPurpose: Boolean(purpose),
      hasIntro: Boolean(intro),
      hasCompletionMessage: Boolean(completionMessage),
      reflectionQuestionCount: reflectionQuestions.filter((q) => q.trim().length > 0).length,
      rawCharacterCount: rawText.length,
    },
    rawText,
  };
}

// ─── Journey Document Template Generator ──────────────────────────────────────────

/**
 * Generates a clean template document for writers/authors to follow in Google Docs or Word.
 */
export function generateJourneyTemplate(format: "markdown" | "text" = "markdown"): string {
  return `# Journey Title: Becoming More Human
Category: Human Soul Foundations
Tagline: An invitation to notice what everyday life quietly reveals about being human.
Time Required: About 7 minutes a day

## Purpose
What does it mean to become more human? It may seem like an unusual question. This journey creates space to notice the ordinary experiences that shape a human life: routines, conversations, disappointments, and small joys.

## Full Introduction
If you chose this journey, you may be looking for something difficult to name. Not a solution, but perhaps a moment to pay closer attention. For the next several days, you are invited to notice those moments with curiosity.

---

## Day 1: Beginning Where You Are
Purpose: Awareness often begins with simple observation.
Prompt:
It is easy to imagine that reflection should begin at an important moment. Most of the time, however, life is made up of smaller moments that rarely ask for our attention.

Think about today as it has unfolded so far. What has occupied your mind? What have you noticed around you? Which moments lingered a little longer than expected?

Deeper Question: What did you almost overlook today?

---

## Day 2: What Feels Familiar
Purpose: Recognizing familiar patterns helps us understand daily life.
Prompt:
Every person develops patterns. Some are practical. Others become so familiar that we stop noticing them.

Consider a typical day. Are there moments that unfold in nearly the same way each time? Which habits feel chosen and which simply happen without much thought?

Deeper Question: Which part of your daily routine says something about you that you have never put into words?

---

## Day 3: Among Other People
Purpose: Our relationships become part of how we understand ourselves.
Prompt:
No one experiences life entirely alone. Even quiet lives are shaped by other people.

Think about one interaction that stayed with you recently. Rather than focusing on what the other person did, notice your own experience.

Deeper Question: When do you feel most understood by another person?

---

## Journey Completion
Completion Message:
You have reached the end of this journey, but not the end of the questions it explored. The past days were not about arriving at a conclusion, but an invitation to notice your own experience with care.

Reflection Questions:
1. What surprised you most about paying closer attention to your everyday life?
2. Which reflection continued to stay with you after you finished writing?
3. What do you notice about yourself now that you were less aware of before?
`;
}
