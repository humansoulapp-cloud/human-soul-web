import React from "react";
import Link from "next/link";
import { Plus, Compass, Clock, Star, Edit, Layers } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import DeleteJourneyButton from "@/components/admin/DeleteJourneyButton";

export default async function AdminJourneysPage() {
  const journeys = await getJourneys();

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--admin-text)" }}>
            Journeys
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>
            {journeys.length} total guided experiences
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

      {/* Journeys Grid — full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {journeys.map((journey) => {
          const daysCount = journey.journey_days?.length ?? 0;

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

                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  {journey.featured && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500/80 text-white backdrop-blur-sm">
                      Featured
                    </span>
                  )}
                  {journey.premium && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-purple-500/80 text-white backdrop-blur-sm">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest block mb-1" style={{ color: "var(--admin-accent)" }}>
                    {journey.category || "Uncategorized"}
                  </span>
                  <h3 className="text-base font-semibold leading-tight mb-1" style={{ color: "var(--admin-text)" }}>
                    {journey.title}
                  </h3>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--admin-text-muted)" }}>
                    {journey.tagline || journey.purpose || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ color: "var(--admin-text-muted)", borderColor: "var(--admin-border)" }}>
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

              {/* Card Actions Footer */}
              <div
                className="px-5 py-3 border-t flex items-center justify-between gap-2"
                style={{
                  background: "var(--admin-surface-2)",
                  borderColor: "var(--admin-border)",
                }}
              >
                <Link
                  href={`/admin/journeys/${journey.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors"
                  style={{
                    background: "var(--admin-surface)",
                    borderColor: "var(--admin-border)",
                    color: "var(--admin-text)",
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>

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
              No journeys found
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--admin-text-muted)" }}>
              Get started by creating your first guided experience.
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
