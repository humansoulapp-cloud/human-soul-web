import React from "react";
import Link from "next/link";
import { Plus, UploadCloud, Sparkles } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import { getJourneyPerformance } from "@/lib/actions/users";
import AdminJourneysBrowser from "@/components/admin/AdminJourneysBrowser";

const FROM_PARAM: Record<string, "All" | "Live" | "Scheduled" | "Draft" | "Archived"> = {
  published: "Live",
  scheduled: "Scheduled",
  draft: "Draft",
  archived: "Archived",
};

export default async function AdminJourneysPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [journeys, performance] = await Promise.all([
    getJourneys({ includeAll: true }),
    getJourneyPerformance(),
  ]);

  const starts = Object.fromEntries(performance.map((p) => [p.id, p.starts]));
  const now = new Date();
  const counts = {
    live: journeys.filter((j) => {
      const status = j.status || "published";
      return (
        status === "published" ||
        (status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) <= now)
      );
    }).length,
    scheduled: journeys.filter(
      (j) =>
        j.status === "scheduled" &&
        j.scheduled_publish_at &&
        new Date(j.scheduled_publish_at) > now
    ).length,
    draft: journeys.filter((j) => j.status === "draft").length,
    archived: journeys.filter((j) => j.status === "archived").length,
  };

  return (
    <div className="w-full max-w-[1160px] mx-auto space-y-6">
      <div className="flex items-end gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-[26px] md:text-[31px] font-semibold tracking-[-0.015em] m-0 mb-1.5 text-[var(--admin-text)]">
            Journeys
          </h1>
          <p className="text-[13.5px] text-[var(--admin-text-muted)] m-0">
            {journeys.length} journeys · {counts.live} live · {counts.scheduled} scheduled ·{" "}
            {counts.draft} draft · {counts.archived} archived
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/journeys/new?import=open"
            className="flex items-center gap-2 px-4 py-2.5 rounded-[9px] border border-[var(--admin-border-hover)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-2)] text-[var(--admin-text)] text-[13px] font-semibold transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-blue-500" />
            Import from Doc
          </Link>
          <Link
            href="/admin/journeys/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:text-[var(--admin-on-accent)] text-[13px] font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New journey
          </Link>
        </div>
      </div>

      {/* Prominent Quick-Action Document Import Hero Banner */}
      <div
        className="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, var(--admin-surface) 0%, var(--admin-surface-2) 100%)",
          borderColor: "var(--admin-border)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
          >
            <UploadCloud className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--admin-text)" }}>
              Import a Full Guided Journey from Word or Google Docs
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
              Upload your .docx file or paste a Google Doc link to automatically generate all days, titles, daily prompts, deeper questions, and completion wrap-up.
            </p>
          </div>
        </div>

        <Link
          href="/admin/journeys/new?import=open"
          className="px-4.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 flex-shrink-0 shadow-sm transition-transform active:scale-95 whitespace-nowrap"
          style={{ background: "var(--admin-accent)", color: "#FFFFFF" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Import Journey Doc
        </Link>
      </div>

      <AdminJourneysBrowser
        journeys={journeys}
        starts={starts}
        initialFilter={FROM_PARAM[params.status ?? ""] ?? "All"}
      />
    </div>
  );
}
