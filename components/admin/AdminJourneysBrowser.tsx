"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { JourneyRow } from "@/lib/actions/journeys";
import { journeyImage } from "@/lib/journey-images";
import DeleteJourneyButton from "./DeleteJourneyButton";
import PublishNowButton from "./PublishNowButton";
import ArchiveJourneyButton from "./ArchiveJourneyButton";

const FILTERS = ["All", "Live", "Scheduled", "Draft", "Archived"] as const;
type Filter = (typeof FILTERS)[number];

/** URL ?status= values stay the source of truth, as the filters did before. */
const PARAM: Record<Filter, string | null> = {
  All: null,
  Live: "published",
  Scheduled: "scheduled",
  Draft: "draft",
  Archived: "archived",
};

function labelFor(journey: JourneyRow): Filter {
  const status = journey.status || "published";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  if (status === "scheduled") {
    const due = journey.scheduled_publish_at && new Date(journey.scheduled_publish_at) <= new Date();
    return due ? "Live" : "Scheduled";
  }
  return "Live";
}

function statusTone(status: Filter) {
  if (status === "Live") return "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]";
  if (status === "Scheduled") return "bg-[var(--admin-gold-soft)] text-[var(--admin-gold)]";
  return "bg-[var(--admin-surface-2)] text-[var(--admin-text-muted)]";
}

const CHIP = (on: boolean) =>
  `inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full text-[12.5px] whitespace-nowrap transition-colors ${
    on
      ? "border border-transparent bg-[var(--admin-accent-soft)] text-[var(--admin-text)] font-semibold"
      : "border border-[var(--admin-border-hover)] text-[var(--admin-text-muted)]"
  }`;

const SMALL_BTN =
  "px-3 py-[7px] rounded-lg border border-[var(--admin-border-hover)] text-[12.5px] whitespace-nowrap flex-shrink-0";

export default function AdminJourneysBrowser({
  journeys,
  starts,
  initialFilter,
}: {
  journeys: JourneyRow[];
  starts: Record<string, number>;
  initialFilter: Filter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(true);

  const select = (next: Filter) => {
    setFilter(next);
    const param = PARAM[next];
    router.replace(param ? `${pathname}?status=${param}` : pathname, { scroll: false });
  };

  const labelled = useMemo(
    () => journeys.map((j) => ({ journey: j, status: labelFor(j) })),
    [journeys]
  );

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      All: labelled.length,
      Live: 0,
      Scheduled: 0,
      Draft: 0,
      Archived: 0,
    };
    for (const { status } of labelled) base[status] += 1;
    return base;
  }, [labelled]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labelled.filter(({ journey, status }) => {
      if (filter !== "All" && status !== filter) return false;
      if (!q) return true;
      return `${journey.title} ${journey.category} ${journey.tagline} ${journey.id}`
        .toLowerCase()
        .includes(q);
    });
  }, [labelled, filter, query]);

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-[46px] mt-[22px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <Search className="w-4 h-4 flex-shrink-0 text-[var(--admin-text-muted)]" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category or id"
          className="flex-1 min-w-0 bg-transparent border-none text-sm text-[var(--admin-text)]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-[12.5px] font-semibold text-[var(--admin-accent)]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3.5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => select(f)} className={CHIP(filter === f)}>
            {f}
            <span className="text-[11px] font-semibold opacity-60">{counts[f]}</span>
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => setGrid((v) => !v)}
          className="px-3 py-[7px] rounded-full border border-[var(--admin-border-hover)] text-[var(--admin-text-muted)] text-xs whitespace-nowrap"
        >
          {grid ? "View as list" : "View as grid"}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="mt-5 px-6 py-[46px] rounded-[14px] border border-dashed border-[var(--admin-border-hover)] bg-[var(--admin-surface)] text-center flex flex-col items-center">
          <div className="text-[17px] font-semibold text-[var(--admin-text)]">
            Nothing in this view
          </div>
          <p className="text-[13.5px] text-[var(--admin-text-muted)] mt-2 max-w-[40ch]">
            Change the filter, clear the search, or create a new journey.
          </p>
          <button
            onClick={() => {
              setQuery("");
              select("All");
            }}
            className="mt-4 px-4 py-2.5 rounded-[9px] border border-[var(--admin-border-hover)] text-[var(--admin-text-secondary)] text-[13px]"
          >
            Reset filters
          </button>
        </div>
      ) : grid ? (
        <div className="grid gap-4 mt-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map(({ journey, status }) => (
            <div
              key={journey.id}
              className={`flex flex-col rounded-[14px] border border-[var(--admin-border)] bg-[var(--admin-surface)] overflow-hidden ${
                status === "Archived" ? "opacity-70" : ""
              }`}
            >
              <span className="block relative aspect-video">
                <span
                  className={`absolute inset-0 bg-cover bg-center ${
                    status !== "Live" ? "saturate-50 brightness-90" : ""
                  }`}
                  style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
                />
                <span className="absolute left-2.5 top-2.5 flex gap-1.5">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-[0.1em] uppercase ${statusTone(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                  {journey.premium && (
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--admin-gold)] text-[var(--ds-on-gold)] text-[9.5px] font-bold tracking-[0.1em]">
                      PLUS
                    </span>
                  )}
                  {journey.featured && (
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--admin-accent)] text-[var(--admin-on-accent)] text-[9.5px] font-bold tracking-[0.1em]">
                      FEATURED
                    </span>
                  )}
                </span>
              </span>

              <div className="flex flex-col gap-[5px] px-[17px] pt-4 pb-3.5 flex-1">
                <span className="text-[10px] font-semibold tracking-[0.11em] text-[var(--admin-accent)] uppercase">
                  {journey.category}
                </span>
                <span className="text-[18px] font-semibold leading-[1.25] text-[var(--admin-text)]">
                  {journey.title}
                </span>
                <span className="text-[12.5px] leading-[1.5] text-[var(--admin-text-muted)]">
                  {journey.tagline}
                </span>
                <span className="text-[12.5px] text-[var(--admin-text-muted)] mt-1.5 pt-2.5 border-t border-[var(--admin-border)]">
                  {(journey.journey_days ?? []).length} days ·{" "}
                  {starts[journey.id] ? `${starts[journey.id]} starts` : "no starts yet"}
                  {status === "Scheduled" && journey.scheduled_publish_at
                    ? ` · ${new Date(journey.scheduled_publish_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}`
                    : ""}
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-2 px-3.5 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-bg)]">
                <Link
                  href={`/admin/journeys/${journey.id}`}
                  className={`${SMALL_BTN} font-semibold text-[var(--admin-text)]`}
                >
                  Edit
                </Link>
                <Link
                  href={`/journeys/${journey.id}`}
                  className={`${SMALL_BTN} text-[var(--admin-text-secondary)]`}
                >
                  Preview
                </Link>
                {status === "Scheduled" && <PublishNowButton id={journey.id} title={journey.title} />}
                <span className="flex-1" />
                {status !== "Archived" && <ArchiveJourneyButton id={journey.id} title={journey.title} />}
                <DeleteJourneyButton id={journey.id} title={journey.title} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[13px] border border-[var(--admin-border)] bg-[var(--admin-surface)] overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="flex items-center gap-3.5 px-4 py-3 border-b border-[var(--admin-border)] text-[9.5px] font-bold tracking-[0.11em] text-[var(--admin-text-muted)]">
              <span className="flex-1 min-w-0">JOURNEY</span>
              <span className="w-[100px] text-right flex-shrink-0">STATUS</span>
              <span className="w-20 text-right flex-shrink-0">DAYS</span>
              <span className="w-20 text-right flex-shrink-0">STARTS</span>
              <span className="w-[150px] flex-shrink-0" />
            </div>

            {shown.map(({ journey, status }) => (
              <div
                key={journey.id}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-[var(--admin-border)] last:border-b-0"
              >
                <span className="flex-1 min-w-0 flex items-center gap-3">
                  <span
                    className="w-14 h-[38px] flex-shrink-0 rounded-md bg-cover bg-center"
                    style={{ backgroundImage: `url("${journeyImage(journey)}")` }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--admin-text)] truncate">
                      {journey.title}
                    </span>
                    <span className="block text-[12.5px] text-[var(--admin-text-muted)] mt-0.5 truncate">
                      {journey.category}
                    </span>
                  </span>
                </span>
                <span className="w-[100px] flex-shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-[0.1em] uppercase ${statusTone(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </span>
                <span className="w-20 flex-shrink-0 text-right text-[13.5px] text-[var(--admin-text-secondary)]">
                  {(journey.journey_days ?? []).length}
                </span>
                <span className="w-20 flex-shrink-0 text-right text-[13.5px] text-[var(--admin-text-secondary)]">
                  {starts[journey.id] || "—"}
                </span>
                <span className="w-[150px] flex-shrink-0 flex gap-2 justify-end">
                  <Link
                    href={`/admin/journeys/${journey.id}`}
                    className={`${SMALL_BTN} font-semibold text-[var(--admin-text)]`}
                  >
                    Edit
                  </Link>
                  <DeleteJourneyButton id={journey.id} title={journey.title} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
