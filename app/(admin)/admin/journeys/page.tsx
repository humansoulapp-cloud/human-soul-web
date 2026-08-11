import React from "react";
import Link from "next/link";
import { Plus, Pencil, Star, Crown, Image as ImageIcon } from "lucide-react";
import { getJourneys } from "@/lib/actions/journeys";
import DeleteJourneyButton from "@/components/admin/DeleteJourneyButton";

export default async function AdminJourneysPage() {
  const journeys = await getJourneys();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Journeys</h1>
          <p className="text-white/40 text-sm mt-1">{journeys.length} journeys total</p>
        </div>
        <Link
          href="/admin/journeys/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8BA58F] hover:bg-[#78937C] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Journey
        </Link>
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1.5fr_80px_80px_80px_80px_120px] text-[10px] uppercase tracking-widest text-white/25 px-6 py-3 border-b border-white/[0.06]">
          <span>Journey</span>
          <span>Category</span>
          <span className="text-center">Days</span>
          <span className="text-center">Featured</span>
          <span className="text-center">Premium</span>
          <span className="text-center">Image</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {journeys.map((journey) => (
            <div
              key={journey.id}
              className="grid grid-cols-[2.5fr_1.5fr_80px_80px_80px_80px_120px] items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              {/* Title */}
              <div className="flex items-center gap-3 min-w-0">
                {journey.image_url ? (
                  <img
                    src={journey.image_url}
                    alt={journey.title}
                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-white/20" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">{journey.title}</p>
                  <p className="text-[11px] text-white/30 font-mono truncate">{journey.id}</p>
                </div>
              </div>

              {/* Category */}
              <p className="text-sm text-white/40 truncate pr-4">{journey.category ?? "—"}</p>

              {/* Days */}
              <p className="text-sm text-white/60 text-center">
                {journey.journey_days?.length ?? 0}
              </p>

              {/* Featured */}
              <div className="flex justify-center">
                {journey.featured ? (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                ) : (
                  <span className="text-white/20 text-xs">—</span>
                )}
              </div>

              {/* Premium */}
              <div className="flex justify-center">
                {journey.premium ? (
                  <Crown className="w-4 h-4 text-purple-400" />
                ) : (
                  <span className="text-white/20 text-xs">—</span>
                )}
              </div>

              {/* Image indicator */}
              <div className="flex justify-center">
                {journey.image_url ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#8BA58F]" />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-white/10" />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/admin/journeys/${journey.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </Link>
                <DeleteJourneyButton id={journey.id} title={journey.title} />
              </div>
            </div>
          ))}

          {journeys.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-white/30 text-sm mb-3">No journeys yet.</p>
              <Link
                href="/admin/journeys/new"
                className="text-[#8BA58F] text-sm hover:underline"
              >
                Create your first journey →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
