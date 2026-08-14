import React from "react";
import Link from "next/link";
import { Plus, Compass, Clock, Star, Edit, Layers, Calendar, Globe, FileText, Send, Archive, Eye } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import DeleteJourneyButton from "@/components/admin/DeleteJourneyButton";
import PublishNowButton from "@/components/admin/PublishNowButton";
import ArchiveJourneyButton from "@/components/admin/ArchiveJourneyButton";

export default async function AdminJourneysPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentTab = resolvedParams?.status || "all";

  const allJourneys = await getJourneys({ includeAll: true });
  const now = new Date();

  // Filter journeys according to selected tab
  const journeys = allJourneys.filter((j) => {
    const status = j.status || "published";
    if (currentTab === "all") return true;
    if (currentTab === "published") {
      return status === "published" || (status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) <= now);
    }
    if (currentTab === "scheduled") {
      return status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) > now;
    }
    if (currentTab === "draft") {
      return status === "draft";
    }
    if (currentTab === "archived") {
      return status === "archived";
    }
    return true;
  });

  const countPublished = allJourneys.filter(
    (j) => (j.status || "published") === "published" || (j.status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) <= now)
  ).length;

  const countScheduled = allJourneys.filter(
    (j) => j.status === "scheduled" && j.scheduled_publish_at && new Date(j.scheduled_publish_at) > now
  ).length;

  const countDrafts = allJourneys.filter((j) => j.status === "draft").length;
  const countArchived = allJourneys.filter((j) => j.status === "archived").length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--admin-text)" }}>
            Journeys
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>
            {allJourneys.length} total guided experiences · {countPublished} live · {countScheduled} scheduled · {countDrafts} drafts · {countArchived} archived
          </p>
        </div>

        <Link
          href="/admin/journeys/new"
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
          style={{
            background: "var(--admin-accent)",
            color: "#FFFFFF",
          }}
        >
          <Plus className="w-4 h-4" />
          <span>New Journey</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--admin-border)" }}>
        <Link
          href="/admin/journeys"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            currentTab === "all"
              ? "bg-[var(--admin-surface-2)] text-[var(--admin-text)] font-semibold border border-[var(--admin-border)]"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--admin-input-bg)]">
            {allJourneys.length}
          </span>
        </Link>

        <Link
          href="/admin/journeys?status=published"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            currentTab === "published"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live & Published</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20">
            {countPublished}
          </span>
        </Link>

        <Link
          href="/admin/journeys?status=scheduled"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            currentTab === "scheduled"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Scheduled</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20">
            {countScheduled}
          </span>
        </Link>

        <Link
          href="/admin/journeys?status=draft"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            currentTab === "draft"
              ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 font-semibold border border-zinc-500/30"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Drafts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-500/20">
            {countDrafts}
          </span>
        </Link>

        <Link
          href="/admin/journeys?status=archived"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            currentTab === "archived"
              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/30"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archived</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20">
            {countArchived}
          </span>
        </Link>
      </div>

      {/* Journeys Grid — full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {journeys.map((journey) => {
          const daysCount = journey.journey_days?.length ?? 0;
          const status = journey.status || "published";
          const isScheduledFuture =
            status === "scheduled" &&
            journey.scheduled_publish_at &&
            new Date(journey.scheduled_publish_at) > now;
          const isDraft = status === "draft";
          const isArchived = status === "archived";
          const isLive = !isScheduledFuture && !isDraft && !isArchived;

          return (
            <div
              key={journey.id}
              className="rounded-2xl border flex flex-col justify-between overflow-hidden transition-all hover:border-[var(--admin-accent)]"
              style={{
                background: "var(--admin-surface)",
                borderColor: "var(--admin-border)",
              }}
            >
              {/* Card Top: Cover Image or Placeholder */}
              <div className="relative h-36 w-full overflow-hidden" style={{ background: "var(--admin-surface-2)" }}>
                {journey.image_url ? (
                  <img
                    src={journey.image_url}
                    alt={journey.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Compass className="w-8 h-8 opacity-20" style={{ color: "var(--admin-text)" }} />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[80%]">
                  {/* Status badge */}
                  {isLive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-600 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> Live
                    </span>
                  )}
                  {isScheduledFuture && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Scheduled
                    </span>
                  )}
                  {isDraft && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-600 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Draft
                    </span>
                  )}
                  {isArchived && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-purple-600 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <Archive className="w-2.5 h-2.5" /> Archived
                    </span>
                  )}

                  {journey.featured && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500/90 text-white backdrop-blur-sm">
                      Featured
                    </span>
                  )}
                  {journey.premium && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-purple-500/90 text-white backdrop-blur-sm">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-widest block" style={{ color: "var(--admin-accent)" }}>
                      {journey.category || "Uncategorized"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-tight mb-1" style={{ color: "var(--admin-text)" }}>
                    {journey.title}
                  </h3>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--admin-text-muted)" }}>
                    {journey.tagline || journey.purpose || "No description provided."}
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Scheduled release info banner */}
                  {isScheduledFuture && journey.scheduled_publish_at && (
                    <div
                      className="px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5"
                      style={{
                        background: "var(--admin-surface-2)",
                        borderColor: "var(--admin-border)",
                        color: "var(--admin-text-secondary)",
                      }}
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Auto-upload:{" "}
                        <strong>
                          {new Date(journey.scheduled_publish_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ color: "var(--admin-text-muted)", borderColor: "var(--admin-border)" }}>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{daysCount} {daysCount === 1 ? "day" : "days"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{journey.time_required || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div
                className="px-4 py-3 border-t flex items-center justify-between gap-2 flex-wrap"
                style={{
                  background: "var(--admin-surface-2)",
                  borderColor: "var(--admin-border)",
                }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/admin/journeys/${journey.id}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors"
                    style={{
                      background: "var(--admin-surface)",
                      borderColor: "var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                    title="Edit journey details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>

                  <Link
                    href={`/journeys/${journey.id}`}
                    target="_blank"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors hover:border-[#8BA58F]"
                    style={{
                      background: "var(--admin-surface)",
                      borderColor: "var(--admin-border)",
                      color: "var(--admin-text-secondary)",
                    }}
                    title="Preview as user in new tab"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8BA58F]" />
                    <span>Preview</span>
                  </Link>

                  {(!isLive && !isArchived) && (
                    <PublishNowButton id={journey.id} title={journey.title} />
                  )}

                  <ArchiveJourneyButton id={journey.id} title={journey.title} isArchived={isArchived} />
                </div>

                <DeleteJourneyButton id={journey.id} title={journey.title} />
              </div>
            </div>
          );
        })}

        {journeys.length === 0 && (
          <div
            className="col-span-full rounded-2xl border p-12 text-center"
            style={{
              background: "var(--admin-surface)",
              borderColor: "var(--admin-border)",
            }}
          >
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--admin-text)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--admin-text)" }}>
              No journeys found in this view
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--admin-text-muted)" }}>
              {currentTab === "scheduled"
                ? "You have no upcoming scheduled journeys at the moment."
                : currentTab === "draft"
                ? "No drafts found."
                : currentTab === "archived"
                ? "No archived journeys."
                : "Get started by creating your first guided experience."}
            </p>
            <Link
              href="/admin/journeys/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--admin-accent)" }}
            >
              <Plus className="w-4 h-4" />
              <span>Create Journey</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

