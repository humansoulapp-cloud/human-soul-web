import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
    <div className="w-full max-w-[1160px] mx-auto">
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
        <Link
          href="/admin/journeys/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:text-[var(--admin-on-accent)] text-[13px] font-semibold"
        >
          <Plus className="w-4 h-4" />
          New journey
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
