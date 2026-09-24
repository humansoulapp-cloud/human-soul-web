"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  X,
  UploadCloud,
  FileText,
  Link as LinkIcon,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Check,
  ArrowRight,
  FileCode,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import {
  parseDocxBuffer,
  parseHtmlToText,
  parseRawTextToJourney,
  extractGoogleDocId,
  fetchGoogleDocPublicText,
  generateJourneyTemplate,
  type ParsedJourneyResult,
} from "@/lib/doc-parser";
import type { JourneyInput } from "@/lib/actions/journeys";

interface JourneyDocImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyJourney: (journey: JourneyInput) => void;
}

type TabMode = "upload" | "googledoc" | "paste" | "template";

export default function JourneyDocImportModal({
  isOpen,
  onClose,
  onApplyJourney,
}: JourneyDocImportModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedJourneyResult | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [showFullText, setShowFullText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on close or re-open
  const handleClose = () => {
    setErrorMessage(null);
    setIsLoading(false);
    onClose();
  };

  const resetImport = () => {
    setParsedResult(null);
    setErrorMessage(null);
    setIsLoading(false);
    setGoogleDocUrl("");
    setPastedText("");
  };

  // Process raw text through client parser
  const processTextContent = (text: string) => {
    try {
      if (!text || text.trim().length < 10) {
        throw new Error("The document content appears to be too short or empty.");
      }
      const result = parseRawTextToJourney(text);
      setParsedResult(result);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to parse document structure.");
    } finally {
      setIsLoading(false);
    }
  };

  // File Upload Handler
  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".docx")) {
        const buffer = await file.arrayBuffer();
        const extractedText = await parseDocxBuffer(buffer);
        processTextContent(extractedText);
      } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
        const rawHtml = await file.text();
        const extractedText = parseHtmlToText(rawHtml);
        processTextContent(extractedText);
      } else if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".markdown") ||
        fileName.endsWith(".rtf")
      ) {
        const text = await file.text();
        processTextContent(text);
      } else {
        // Try parsing via server route for any other formats
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/parse-doc", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to process file on server.");
        }

        setParsedResult(data);
      }
    } catch (err: any) {
      console.error("File processing error:", err);
      setErrorMessage(
        err?.message || "Could not read this file. Please ensure it is a valid .docx, .txt, or .md document."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & Drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Google Doc Link Fetcher
  const handleGoogleDocFetch = async () => {
    if (!googleDocUrl.trim()) {
      setErrorMessage("Please enter a Google Doc URL.");
      return;
    }

    const docId = extractGoogleDocId(googleDocUrl);
    if (!docId) {
      setErrorMessage(
        "Invalid Google Doc link format. Expected format: https://docs.google.com/document/d/YOUR_DOC_ID/edit"
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // First try direct client fetch
      const clientRes = await fetchGoogleDocPublicText(docId);
      if (clientRes.text) {
        processTextContent(clientRes.text);
        return;
      }

      // If client fetch had CORS or permission issues, try via server API
      const res = await fetch("/api/admin/parse-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleDocUrl }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error ||
            "Unable to fetch Google Doc. Ensure the document is set to 'Anyone with the link can view' in Google Docs Share settings, or export as .docx and upload."
        );
      }

      setParsedResult(data);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load Google Doc.");
    } finally {
      setIsLoading(false);
    }
  };

  // Paste Content Handler
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMessage("Please paste your journey text before parsing.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    processTextContent(pastedText);
  };

  // Template Copy Handler
  const handleCopyTemplate = () => {
    const tpl = generateJourneyTemplate("markdown");
    navigator.clipboard.writeText(tpl);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Template Download Handler
  const handleDownloadTemplate = () => {
    const tpl = generateJourneyTemplate("markdown");
    const blob = new Blob([tpl], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "human-soul-journey-template.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply to form
  const handleApply = () => {
    if (!parsedResult) return;
    onApplyJourney(parsedResult.journey);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
          color: "var(--admin-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4.5 border-b"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight leading-snug">
                Import Journey from Document
              </h2>
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                Upload a Word document (.docx), Google Doc, Markdown, or text file to auto-structure
                your journey.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--admin-text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-4 rounded-xl border text-sm flex items-start gap-3"
              style={{
                background: "var(--admin-danger-bg, rgba(239, 68, 68, 0.1))",
                borderColor: "var(--admin-danger, #ef4444)",
                color: "var(--admin-danger, #ef4444)",
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Import Notice</span>
                <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 1: IMPORT / UPLOAD INPUT (Shown when no parsed result yet) */}
          {!parsedResult && (
            <>
              {/* Tab Navigation */}
              <div
                className="flex items-center gap-1.5 p-1 rounded-xl border text-xs font-medium"
                style={{ background: "var(--admin-input-bg)", borderColor: "var(--admin-border)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("upload");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "upload"
                      ? "shadow-sm font-semibold text-[var(--admin-text)] bg-[var(--admin-surface)]"
                      : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Upload Word / File (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("googledoc");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "googledoc"
                      ? "shadow-sm font-semibold text-[var(--admin-text)] bg-[var(--admin-surface)]"
                      : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Google Docs Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("paste");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "paste"
                      ? "shadow-sm font-semibold text-[var(--admin-text)] bg-[var(--admin-surface)]"
                      : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Paste Text / HTML</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("template");
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === "template"
                      ? "shadow-sm font-semibold text-[var(--admin-text)] bg-[var(--admin-surface)]"
                      : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                  <span>Structure Guide & Template</span>
                </button>
              </div>

              {/* TAB 1: File Upload (Word docx, txt, md) */}
              {activeTab === "upload" && (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`relative p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
                      : "border-[var(--admin-border-hover)] hover:border-[var(--admin-accent)] bg-[var(--admin-surface-2)]"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ minHeight: "260px" }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.txt,.md,.markdown,.html,.htm,.rtf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />

                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-[var(--admin-accent)]" />
                      <div className="text-sm font-medium">Extracting and structuring journey...</div>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        Parsing days, titles, daily prompts, and deeper questions...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                        style={{
                          background: "var(--admin-surface)",
                          border: "1px solid var(--admin-border)",
                        }}
                      >
                        <UploadCloud className="w-8 h-8 text-[var(--admin-accent)]" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">
                        Choose a Word document (.docx) or drag and drop here
                      </h3>
                      <p className="text-xs max-w-md mb-4" style={{ color: "var(--admin-text-muted)" }}>
                        Supports Word documents (.docx), Google Docs exported as Word, Markdown (.md),
                        and plain text (.txt).
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl text-xs font-semibold shadow-sm border"
                          style={{
                            background: "var(--admin-accent)",
                            color: "#FFFFFF",
                            borderColor: "transparent",
                          }}
                        >
                          Browse Computer
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-5 text-[11px] text-[var(--admin-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> Microsoft Word (.docx)
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> Google Doc (.docx export)
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> Markdown / Text
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Google Docs URL Link */}
              {activeTab === "googledoc" && (
                <div
                  className="p-6 rounded-2xl border space-y-4"
                  style={{
                    background: "var(--admin-surface-2)",
                    borderColor: "var(--admin-border)",
                  }}
                >
                  <div>
                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-500" />
                      Import Directly from Google Docs
                    </h3>
                    <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      Paste the share link of your Google Doc.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={googleDocUrl}
                      onChange={(e) => setGoogleDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border font-mono"
                      style={{
                        background: "var(--admin-input-bg)",
                        borderColor: "var(--admin-input-border)",
                        color: "var(--admin-text)",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGoogleDocFetch();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGoogleDocFetch}
                      disabled={isLoading || !googleDocUrl.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                      style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Fetch & Structure
                        </>
                      )}
                    </button>
                  </div>

                  {/* Google Doc Instructions Callout */}
                  <div
                    className="p-4 rounded-xl border text-xs space-y-2"
                    style={{
                      background: "var(--admin-surface)",
                      borderColor: "var(--admin-border)",
                    }}
                  >
                    <div className="font-semibold flex items-center gap-1.5 text-[var(--admin-text)]">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                      How to share your Google Doc:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[var(--admin-text-muted)] pl-1">
                      <li>Open your journey in Google Docs.</li>
                      <li>
                        Click the blue <strong className="text-[var(--admin-text)]">Share</strong>{" "}
                        button in the top right.
                      </li>
                      <li>
                        Under <em>General access</em>, set to{" "}
                        <strong className="text-[var(--admin-text)]">Anyone with the link</strong>{" "}
                        (Viewer).
                      </li>
                      <li>Copy and paste the URL here.</li>
                    </ol>
                    <p className="text-[11px] text-[var(--admin-text-muted)] pt-1 border-t border-[var(--admin-border)]">
                      Alternatively, in Google Docs go to{" "}
                      <em>File → Download → Microsoft Word (.docx)</em> and upload it using the
                      Upload tab above.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Paste Content / Clipboard */}
              {activeTab === "paste" && (
                <div
                  className="p-6 rounded-2xl border space-y-4"
                  style={{
                    background: "var(--admin-surface-2)",
                    borderColor: "var(--admin-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <Clipboard className="w-4 h-4 text-amber-500" />
                        Paste Journey Text or Markdown
                      </h3>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        Copy all text from Google Docs or Word (Cmd+A / Cmd+C) and paste it here.
                      </p>
                    </div>
                    {pastedText && (
                      <button
                        type="button"
                        onClick={() => setPastedText("")}
                        className="text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={12}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste the full journey text here (e.g. Journey Title, Purpose, Day 1: ..., Prompt: ..., Deeper Question: ..., Completion Message...)"
                    className="w-full p-4 rounded-xl text-xs font-mono leading-relaxed border resize-y"
                    style={{
                      background: "var(--admin-input-bg)",
                      borderColor: "var(--admin-input-border)",
                      color: "var(--admin-text)",
                    }}
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      disabled={isLoading || !pastedText.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 shadow-sm"
                      style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Structuring...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Parse and Structure Journey
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Template & Structure Guide */}
              {activeTab === "template" && (
                <div
                  className="p-6 rounded-2xl border space-y-4"
                  style={{
                    background: "var(--admin-surface-2)",
                    borderColor: "var(--admin-border)",
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        Standard Document Structure & Template
                      </h3>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        Authors can use this clean layout in Word or Google Docs for 100% automated
                        parsing.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyTemplate}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors"
                        style={{
                          background: "var(--admin-surface)",
                          borderColor: "var(--admin-border)",
                          color: "var(--admin-text)",
                        }}
                      >
                        {copiedTemplate ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Template
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
                      >
                        <Download className="w-3.5 h-3.5" /> Download (.md)
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl border text-xs font-mono leading-relaxed overflow-x-auto max-h-[340px]"
                    style={{
                      background: "var(--admin-input-bg)",
                      borderColor: "var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                  >
                    <pre className="whitespace-pre-wrap">{generateJourneyTemplate("markdown")}</pre>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: PARSED PREVIEW & STRUCTURAL AUDIT (Shown after document is parsed) */}
          {parsedResult && (
            <div className="space-y-5">
              {/* Extraction Status Bar */}
              <div
                className="flex items-center justify-between p-4 rounded-2xl border flex-wrap gap-3"
                style={{
                  background:
                    parsedResult.warnings.length === 0
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(245, 158, 11, 0.08)",
                  borderColor:
                    parsedResult.warnings.length === 0
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  {parsedResult.warnings.length === 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>Document Successfully Structured</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        {parsedResult.stats.totalDays} Day
                        {parsedResult.stats.totalDays === 1 ? "" : "s"} Extracted
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                      Review the extracted journey below before applying it to the editor form.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetImport}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                    style={{
                      background: "var(--admin-surface)",
                      borderColor: "var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                  >
                    Upload Another
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
                  >
                    Apply to Journey Form <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Warnings List (if any) */}
              {parsedResult.warnings.length > 0 && (
                <div
                  className="p-3.5 rounded-xl border text-xs space-y-1"
                  style={{
                    background: "rgba(245, 158, 11, 0.05)",
                    borderColor: "rgba(245, 158, 11, 0.25)",
                    color: "var(--admin-gold, #d97706)",
                  }}
                >
                  <span className="font-semibold block mb-1">Parsing Notes & Suggestions:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parsedResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Journey Overview Card */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{
                  background: "var(--admin-surface-2)",
                  borderColor: "var(--admin-border)",
                }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--admin-border)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-accent)]">
                    Journey Details
                  </span>
                  <span className="text-xs font-mono text-[var(--admin-text-muted)]">
                    ID: {parsedResult.journey.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] block mb-1">
                      Title
                    </span>
                    <span className="text-sm font-semibold text-[var(--admin-text)] block">
                      {parsedResult.journey.title}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] block mb-1">
                      Category & Realm
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--admin-surface)] border border-[var(--admin-border)] font-medium">
                      {parsedResult.journey.category}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] block mb-1">
                      Tagline
                    </span>
                    <p className="text-[var(--admin-text-secondary)] italic">
                      {parsedResult.journey.tagline || "(None detected)"}
                    </p>
                  </div>

                  {parsedResult.journey.purpose && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] block mb-1">
                        Purpose / Intention
                      </span>
                      <p className="text-[var(--admin-text-secondary)] leading-relaxed whitespace-pre-line line-clamp-3">
                        {parsedResult.journey.purpose}
                      </p>
                    </div>
                  )}

                  {parsedResult.journey.intro && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] block mb-1">
                        Full Introduction
                      </span>
                      <p className="text-[var(--admin-text-secondary)] leading-relaxed whitespace-pre-line line-clamp-3">
                        {parsedResult.journey.intro}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Days List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--admin-accent)]" />
                    Extracted Journey Days ({parsedResult.journey.days.length})
                  </h4>
                  <span className="text-[11px] text-[var(--admin-text-muted)]">
                    Click any day to expand
                  </span>
                </div>

                <div className="space-y-2">
                  {parsedResult.journey.days.map((d) => {
                    const isExpanded = expandedDay === d.day;
                    return (
                      <div
                        key={d.day}
                        className="rounded-xl border overflow-hidden transition-all"
                        style={{
                          background: "var(--admin-surface)",
                          borderColor: isExpanded
                            ? "var(--admin-accent)"
                            : "var(--admin-border)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isExpanded ? null : d.day)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left gap-3"
                          style={{
                            background: isExpanded ? "var(--admin-accent-soft)" : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-6 h-6 rounded-md grid place-items-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: isExpanded
                                  ? "var(--admin-accent)"
                                  : "var(--admin-input-bg)",
                                color: isExpanded ? "#FFFFFF" : "var(--admin-text)",
                                border: "1px solid var(--admin-border)",
                              }}
                            >
                              {d.day}
                            </span>
                            <span className="font-semibold text-xs truncate text-[var(--admin-text)]">
                              {d.title || `Day ${d.day}`}
                            </span>
                            {d.purpose && (
                              <span className="text-[11px] text-[var(--admin-text-muted)] truncate hidden sm:inline">
                                · {d.purpose}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!d.prompt?.trim() && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600">
                                Missing Prompt
                              </span>
                            )}
                            {d.deeper && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 hidden md:inline">
                                Deeper Question ✓
                              </span>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-[var(--admin-text-muted)] transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            className="p-4 border-t space-y-3 text-xs"
                            style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface-2)" }}
                          >
                            {d.purpose && (
                              <div>
                                <span className="font-semibold text-[11px] text-[var(--admin-text-muted)] block mb-0.5">
                                  Purpose / Subtitle:
                                </span>
                                <p className="text-[var(--admin-text)]">{d.purpose}</p>
                              </div>
                            )}

                            <div>
                              <span className="font-semibold text-[11px] text-[var(--admin-text-muted)] block mb-0.5">
                                Daily Reflection Prompt:
                              </span>
                              <div className="p-3 rounded-lg border text-xs leading-relaxed whitespace-pre-line"
                                   style={{ background: "var(--admin-input-bg)", borderColor: "var(--admin-border)" }}>
                                {d.prompt || (
                                  <span className="italic text-[var(--admin-text-muted)]">
                                    No prompt text found for this day.
                                  </span>
                                )}
                              </div>
                            </div>

                            {d.deeper && (
                              <div>
                                <span className="font-semibold text-[11px] text-purple-600 dark:text-purple-400 block mb-0.5">
                                  Deeper Reflection Question:
                                </span>
                                <p className="italic text-[var(--admin-text)]">{d.deeper}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completion Section Preview */}
              {(parsedResult.journey.completion_message ||
                (parsedResult.journey.reflection_questions &&
                  parsedResult.journey.reflection_questions.some((q) => q.trim()))) && (
                <div
                  className="p-5 rounded-2xl border space-y-3 text-xs"
                  style={{
                    background: "var(--admin-surface-2)",
                    borderColor: "var(--admin-border)",
                  }}
                >
                  <h4 className="font-semibold uppercase tracking-wider text-[var(--admin-accent)] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Journey Completion Details
                  </h4>

                  {parsedResult.journey.completion_message && (
                    <div>
                      <span className="font-semibold text-[11px] text-[var(--admin-text-muted)] block mb-0.5">
                        Completion Message:
                      </span>
                      <p className="leading-relaxed whitespace-pre-line text-[var(--admin-text-secondary)]">
                        {parsedResult.journey.completion_message}
                      </p>
                    </div>
                  )}

                  {parsedResult.journey.reflection_questions &&
                    parsedResult.journey.reflection_questions.filter((q) => q.trim()).length >
                      0 && (
                      <div>
                        <span className="font-semibold text-[11px] text-[var(--admin-text-muted)] block mb-1">
                          Final Reflection Questions:
                        </span>
                        <ul className="list-decimal list-inside space-y-1 text-[var(--admin-text-secondary)]">
                          {parsedResult.journey.reflection_questions
                            .filter((q) => q.trim())
                            .map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)" }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border"
            style={{
              borderColor: "var(--admin-border-hover)",
              color: "var(--admin-text-secondary)",
            }}
          >
            Cancel
          </button>

          {parsedResult ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetImport}
                className="px-4 py-2 rounded-xl text-xs font-medium border"
                style={{
                  background: "var(--admin-surface)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              >
                Upload Different File
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
                style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
              >
                <Check className="w-4 h-4" />
                Apply to Journey Form
              </button>
            </div>
          ) : (
            <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              Select or paste a document to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
