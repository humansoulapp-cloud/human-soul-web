import React from "react";
import Link from "next/link";
import { getJourneyPerformance, getStats, getWritingStats } from "@/lib/actions/users";
import { getJourneys } from "@/lib/actions/journeys";

const CARD = "rounded-[14px] border border-[var(--admin-border)] bg-[var(--admin-surface)]";
const COL = "w-[92px] text-right flex-shrink-0";
const MUTED = "text-[12.5px] text-[var(--admin-text-muted)]";

function statusTone(status: string) {
  if (status === "published") return "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]";
  if (status === "scheduled") return "bg-[var(--admin-gold-soft)] text-[var(--admin-gold)]";
  return "bg-[var(--admin-surface-2)] text-[var(--admin-text-muted)]";
}

export default async function AdminDashboardPage() {
  const [stats, writing, performance, journeys] = await Promise.all([
    getStats(),
    getWritingStats(),
    getJourneyPerformance(),
    getJourneys({ includeAll: true }),
  ]);

  const kpis = [
    {
      label: "Active writers",
      value: writing.activeWriters.toLocaleString("en-GB"),
      note: "Wrote at least once in the last 30 days",
    },
    {
      label: "Entries written",
      value: writing.totalEntries.toLocaleString("en-GB"),
      note: `${writing.entriesLast30.toLocaleString("en-GB")} in the last 30 days`,
    },
    {
      label: "Plus subscribers",
      value: writing.plusSubscribers.toLocaleString("en-GB"),
      note: `${stats.totalUsers.toLocaleString("en-GB")} accounts in total`,
    },
    {
      label: "Journeys live",
      value: String(stats.publishedJourneys),
      note: `${stats.draftJourneys} drafts, ${stats.scheduledJourneys} scheduled`,
    },
  ];

  // Things worth a look, derived rather than tracked
  const incomplete = journeys.filter((j) => (j.journey_days ?? []).length === 0);
  const scheduled = journeys.filter(
    (j) => j.status === "scheduled" && j.scheduled_publish_at
  );
  const drafts = journeys.filter((j) => j.status === "draft");

  const todos = [
    incomplete.length > 0 && {
      title: `${incomplete.length} ${incomplete.length === 1 ? "journey has" : "journeys have"} no days yet`,
      meta: incomplete.map((j) => j.title).join(", "),
      action: "Finish it",
      href: `/admin/journeys/${incomplete[0].id}`,
    },
    scheduled.length > 0 && {
      title: `${scheduled.length} scheduled to publish`,
      meta: scheduled
        .map(
          (j) =>
            `${j.title} on ${new Date(j.scheduled_publish_at!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}`
        )
        .join(", "),
      action: "Check",
      href: "/admin/journeys?status=scheduled",
    },
    drafts.length > 0 && {
      title: `${drafts.length} ${drafts.length === 1 ? "draft" : "drafts"} not published`,
      meta: drafts.map((j) => j.title).join(", "),
      action: "Review",
      href: "/admin/journeys?status=draft",
    },
  ].filter(Boolean) as { title: string; meta: string; action: string; href: string }[];

  const ranked = [...performance].sort((a, b) => b.starts - a.starts).slice(0, 6);

  return (
    <div className="w-full max-w-[1160px] mx-auto">
      <div className="flex items-end gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-[26px] md:text-[31px] font-semibold tracking-[-0.015em] m-0 mb-1.5 text-[var(--admin-text)]">
            Dashboard
          </h1>
          <p className="text-[13.5px] text-[var(--admin-text-muted)] m-0">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        {kpis.map((k) => (
          <div key={k.label} className={`${CARD} px-5 py-[18px]`}>
            <div className="text-[10px] font-bold tracking-[0.11em] text-[var(--admin-text-muted)] uppercase">
              {k.label}
            </div>
            <div className="text-[26px] md:text-[29px] font-semibold tracking-[-0.02em] mt-2.5 text-[var(--admin-text)]">
              {k.value}
            </div>
            <div className={`${MUTED} mt-1`}>{k.note}</div>
          </div>
        ))}
      </div>

      <div className={`${CARD} px-[22px] py-5 mt-4`}>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-[18px] font-semibold m-0 text-[var(--admin-text)]">
            Journey performance
          </h2>
          <span className="flex-1" />
          <Link
            href="/admin/journeys"
            className="text-[12.5px] font-semibold text-[var(--admin-accent)]"
          >
            Manage journeys →
          </Link>
        </div>

        <div className="mt-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="flex items-center gap-3.5 px-4 py-3 border-b border-[var(--admin-border)] text-[9.5px] font-bold tracking-[0.11em] text-[var(--admin-text-muted)]">
              <span className="flex-1 min-w-0">JOURNEY</span>
              <span className={COL}>STATUS</span>
              <span className={COL}>STARTS</span>
              <span className={COL}>FINISHED</span>
              <span className={COL}>DROP-OFF</span>
            </div>

            {ranked.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center gap-3.5 px-4 py-3.5 ${
                  i < ranked.length - 1 ? "border-b border-[var(--admin-border)]" : ""
                }`}
              >
                <span className="flex-1 min-w-0">
                  <Link
                    href={`/admin/journeys/${r.id}`}
                    className="block text-sm font-semibold text-[var(--admin-text)]"
                  >
                    {r.title}
                  </Link>
                  <span className={`${MUTED} block mt-0.5`}>{r.category}</span>
                </span>
                <span className={COL}>
                  <span
                    className={`inline-block px-2.5 py-[3px] rounded-full text-[10px] font-bold tracking-[0.08em] uppercase ${statusTone(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                </span>
                <span className={`${COL} text-[13.5px] text-[var(--admin-text-secondary)]`}>
                  {r.starts || "—"}
                </span>
                <span className={`${COL} text-[13.5px] text-[var(--admin-text-secondary)]`}>
                  {r.finished || "—"}
                </span>
                <span className={`${COL} text-[13.5px] text-[var(--admin-text-secondary)]`}>
                  {r.dropOff}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {todos.length > 0 && (
        <div className={`${CARD} px-[22px] py-5 mt-4`}>
          <h2 className="text-[18px] font-semibold m-0 mb-1 text-[var(--admin-text)]">
            Needs attention
          </h2>
          <p className={`${MUTED} m-0`}>Derived from the state of the library right now.</p>
          <div className="mt-2">
            {todos.map((t, i) => (
              <div
                key={t.title}
                className={`flex items-center gap-3.5 py-3.5 flex-wrap ${
                  i < todos.length - 1 ? "border-b border-[var(--admin-border)]" : ""
                }`}
              >
                <span className="flex-1 min-w-[240px]">
                  <span className="block text-[13.5px] font-semibold text-[var(--admin-text)]">
                    {t.title}
                  </span>
                  <span className={`${MUTED} block mt-0.5 leading-[1.5]`}>{t.meta}</span>
                </span>
                <Link
                  href={t.href}
                  className="px-3.5 py-2 rounded-lg border border-[var(--admin-border-hover)] text-[var(--admin-text-secondary)] text-[12.5px] whitespace-nowrap"
                >
                  {t.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
