import React from "react";
import Link from "next/link";
import { Map, Users, Star, Crown, ArrowRight, Plus } from "lucide-react";
import { getStats } from "@/lib/actions/users";
import { getJourneys } from "@/lib/actions/journeys";

export default async function AdminDashboard() {
  const [stats, journeys] = await Promise.all([getStats(), getJourneys()]);

  const recentJourneys = journeys.slice(-5).reverse();

  const cards = [
    {
      label: "Total Journeys",
      value: stats.totalJourneys,
      icon: Map,
      color: "text-[#8BA58F]",
      bg: "bg-[#8BA58F]/10",
      href: "/admin/journeys",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      href: "/admin/users",
    },
    {
      label: "Featured",
      value: stats.featuredJourneys,
      icon: Star,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/admin/journeys",
    },
    {
      label: "Premium",
      value: stats.premiumJourneys,
      icon: Crown,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      href: "/admin/journeys",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Overview of your Human Soul content</p>
        </div>
        <Link
          href="/admin/journeys/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8BA58F] hover:bg-[#78937C] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Journey
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all group"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-semibold text-white">{value}</p>
            <p className="text-white/40 text-sm mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Journeys */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white">Recent Journeys</h2>
          <Link
            href="/admin/journeys"
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {recentJourneys.map((journey) => (
            <div
              key={journey.id}
              className="flex items-center justify-between px-6 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {journey.image_url ? (
                  <img
                    src={journey.image_url}
                    alt={journey.title}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{journey.title}</p>
                  <p className="text-xs text-white/30 truncate">{journey.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs text-white/30">
                  {journey.journey_days?.length ?? 0} days
                </span>
                <Link
                  href={`/admin/journeys/${journey.id}`}
                  className="text-xs text-[#8BA58F] hover:text-[#78937C] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {recentJourneys.length === 0 && (
            <div className="px-6 py-8 text-center text-white/30 text-sm">
              No journeys yet. <Link href="/admin/journeys/new" className="text-[#8BA58F] hover:underline">Create one</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
