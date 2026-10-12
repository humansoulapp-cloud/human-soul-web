import React from "react";
import { getJourneys } from "@/lib/actions/journeys";
import { getJourneyPerformance } from "@/lib/actions/users";
import { JOURNEY_IMAGES } from "@/lib/journey-images";
import AdminJourneysBrowser, { type AdminJourneyItem, type StatusKey } from "@/components/admin/AdminJourneysBrowser";

const DAY = 86_400_000;

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function edited(iso: string, now: Date) {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "Edited today";
  if (days < 2) return "Edited yesterday";
  return `Edited ${shortDate(iso)}`;
}

export default async function AdminJourneysPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; view?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [journeys, performance] = await Promise.all([
    getJourneys({ includeAll: true }),
    getJourneyPerformance(),
  ]);
  const perf = new Map(performance.map((p) => [p.id, p]));
  const now = new Date();

  const items: AdminJourneyItem[] = journeys.map((j) => {
    const raw = j.status || "published";
    const scheduledAt = j.scheduled_publish_at ? new Date(j.scheduled_publish_at) : null;
    const status: StatusKey =
      raw === "archived"
        ? "archived"
        : raw === "draft"
          ? "draft"
          : raw === "scheduled" && scheduledAt && scheduledAt > now
            ? "scheduled"
            : "live";

    const days = j.journey_days ?? [];
    const p = perf.get(j.id);
    const started = p?.starts ?? 0;
    const finished = p?.finished ?? 0;

    // When it went live: the scheduled time if it had one, otherwise creation.
    const liveSince = scheduledAt && scheduledAt <= now ? scheduledAt : new Date(j.created_at);
    const liveDays = Math.floor((now.getTime() - liveSince.getTime()) / DAY);

    let note: string | null = null;
    if (status === "scheduled" && scheduledAt) {
      note = `${shortDate(scheduledAt.toISOString())} · ${scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (status === "draft") {
      note = edited(j.updated_at || j.created_at, now);
    } else if (status === "archived") {
      note = `Archived ${shortDate(j.updated_at || j.created_at)}`;
    } else if (liveDays < 14) {
      note = `New · since ${shortDate(liveSince.toISOString())}`;
    }

    // A journey can't be finished before it has been live for its length.
    const tooEarly = status === "live" && started > 0 && finished === 0 && liveDays < days.length + 7;

    const warnings: string[] = [];
    if (status !== "archived") {
      if (days.length === 0) warnings.push("No days yet");
      const noReading = days.filter((d) => !d.prompt?.trim()).length;
      if (noReading > 0) warnings.push(`${noReading} ${noReading === 1 ? "day" : "days"} without a reading`);
      if (!j.image_url && !JOURNEY_IMAGES[j.id]) warnings.push("no cover");
    }
    const warning = warnings.length
      ? warnings.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" · ")
      : null;

    return {
      id: j.id,
      title: j.title,
      category: j.category ?? "No category",
      days: days.length,
      status,
      note,
      image: j.image_url || JOURNEY_IMAGES[j.id] || null,
      featured: Boolean(j.featured),
      premium: Boolean(j.premium),
      started,
      finishedPct: started > 0 && !tooEarly ? Math.round((finished / started) * 100) : null,
      tooEarly,
      drop: p && p.dropLoss > 0 ? p.dropOff : null,
      warning,
    };
  });

  const initialStatus = (["live", "scheduled", "draft", "archived"] as const).find((s) =>
    params.status === s || (s === "live" && params.status === "published")
  );

  return (
    <AdminJourneysBrowser
      items={items}
      initialStatus={initialStatus ?? "all"}
      initialView={params.view === "grid" ? "grid" : undefined}
    />
  );
}
