import React from "react";
import { Compass, Users, TrendingUp, Star, Calendar, FileText } from "lucide-react";
import { getStats } from "@/lib/actions/users";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Journeys",
      value: stats.totalJourneys,
      icon: Compass,
      href: "/admin/journeys",
    },
    {
      label: "Scheduled",
      value: stats.scheduledJourneys,
      icon: Calendar,
      href: "/admin/journeys?status=scheduled",
      highlight: stats.scheduledJourneys > 0,
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Featured",
      value: stats.featuredJourneys,
      icon: Star,
      href: "/admin/journeys",
    },
    {
      label: "Premium",
      value: stats.premiumJourneys,
      icon: TrendingUp,
      href: "/admin/journeys",
    },
  ];


  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--admin-text)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>
          Overview of your Human Soul content.
        </p>
      </div>

      {/* Stats grid — fill full width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border p-6 flex flex-col gap-4 transition-all hover:border-[var(--admin-accent)]"
              style={{
                background: "var(--admin-surface)",
                borderColor: card.highlight ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--admin-surface-2)" }}
              >
                <Icon className="w-4 h-4" style={{ color: "var(--admin-accent)" }} />
              </div>
              <div>
                <p
                  className="text-3xl font-semibold"
                  style={{ color: "var(--admin-text)" }}
                >
                  {card.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                  {card.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>


      {/* Quick actions */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--admin-text-secondary)" }}>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/journeys/new"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:bg-[var(--admin-accent-hover)]"
            style={{ background: "var(--admin-accent)" }}
          >
            + New Journey
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
            style={{
              color: "var(--admin-text-secondary)",
              borderColor: "var(--admin-border)",
            }}
          >
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
