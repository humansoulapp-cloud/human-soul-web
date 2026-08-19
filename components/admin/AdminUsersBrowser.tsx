"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { updateUserPlan, type UserRow } from "@/lib/actions/users";
import ChangeRoleButton from "./ChangeRoleButton";

const FILTERS = ["All", "Plus", "Free", "Dormant"] as const;
type Filter = (typeof FILTERS)[number];

const DORMANT_DAYS = 30;

function daysSince(date: string | null) {
  if (!date) return Infinity;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function lastActiveLabel(date: string | null) {
  const days = daysSince(date);
  if (days === Infinity) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const CHIP = (on: boolean) =>
  `inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full text-[12.5px] whitespace-nowrap transition-colors ${
    on
      ? "border border-transparent bg-[var(--admin-accent-soft)] text-[var(--admin-text)] font-semibold"
      : "border border-[var(--admin-border-hover)] text-[var(--admin-text-muted)]"
  }`;

export default function AdminUsersBrowser({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sortByEntries, setSortByEntries] = useState(false);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      All: users.length,
      Plus: users.filter((u) => u.plan === "Plus").length,
      Free: users.filter((u) => u.plan === "Free").length,
      Dormant: users.filter((u) => daysSince(u.lastActive) >= DORMANT_DAYS).length,
    }),
    [users]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((u) => {
      if (filter === "Plus" && u.plan !== "Plus") return false;
      if (filter === "Free" && u.plan !== "Free") return false;
      if (filter === "Dormant" && daysSince(u.lastActive) < DORMANT_DAYS) return false;
      if (!q) return true;
      return `${u.name} ${u.email}`.toLowerCase().includes(q);
    });

    return sortByEntries
      ? [...list].sort((a, b) => b.entries - a.entries)
      : [...list].sort((a, b) => daysSince(a.lastActive) - daysSince(b.lastActive));
  }, [users, query, filter, sortByEntries]);

  const exportCsv = () => {
    const header = "name,email,plan,role,entries,streak,last_active\n";
    const rows = shown
      .map((u) =>
        [u.name, u.email, u.plan, u.role, u.entries, u.streak, u.lastActive ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `humansoul-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlan = (user: UserRow) =>
    startTransition(async () => {
      await updateUserPlan(user.id, user.plan === "Plus" ? "free" : "plus");
    });

  return (
    <>
      <div className="flex justify-end -mt-12 mb-6">
        <button
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-[9px] border border-[var(--admin-border-hover)] text-[var(--admin-text-secondary)] text-[13px]"
        >
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 h-[46px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <Search className="w-4 h-4 flex-shrink-0 text-[var(--admin-text-muted)]" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
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
          <button key={f} onClick={() => setFilter(f)} className={CHIP(filter === f)}>
            {f}
            <span className="text-[11px] font-semibold opacity-60">{counts[f]}</span>
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => setSortByEntries((v) => !v)}
          className="px-3 py-[7px] rounded-full border border-[var(--admin-border-hover)] text-[var(--admin-text-muted)] text-xs whitespace-nowrap"
        >
          {sortByEntries ? "Most entries" : "Recently active"}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="mt-4 px-6 py-11 rounded-[14px] border border-dashed border-[var(--admin-border-hover)] bg-[var(--admin-surface)] text-center">
          <div className="text-[17px] font-semibold text-[var(--admin-text)]">
            No users match that
          </div>
          <p className="text-[13.5px] text-[var(--admin-text-muted)] mt-2">
            Try a shorter search or another filter.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-[13px] border border-[var(--admin-border)] bg-[var(--admin-surface)] overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="flex items-center gap-3.5 px-4 py-3 border-b border-[var(--admin-border)] text-[9.5px] font-bold tracking-[0.11em] text-[var(--admin-text-muted)]">
              <span className="flex-1 min-w-0">USER</span>
              <span className="w-20 text-right flex-shrink-0">PLAN</span>
              <span className="w-20 text-right flex-shrink-0">ENTRIES</span>
              <span className="w-20 text-right flex-shrink-0">STREAK</span>
              <span className="w-[110px] text-right flex-shrink-0">LAST ACTIVE</span>
              <span className="w-[210px] flex-shrink-0" />
            </div>

            {shown.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-[var(--admin-border)] last:border-b-0"
              >
                <span className="flex-1 min-w-0 flex items-center gap-3">
                  <span className="w-[34px] h-[34px] flex-shrink-0 rounded-full grid place-items-center bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] text-xs font-bold">
                    {user.name
                      .split(/[\s._-]+/)
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--admin-text)] truncate">
                      {user.name}
                      {user.role === "admin" && (
                        <span className="ml-2 text-[9.5px] font-bold tracking-[0.1em] text-[var(--admin-accent)]">
                          ADMIN
                        </span>
                      )}
                    </span>
                    <span className="block text-[12.5px] text-[var(--admin-text-muted)] truncate">
                      {user.email}
                    </span>
                  </span>
                </span>

                <span className="w-20 flex-shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-[3px] rounded-full text-[10px] font-bold tracking-[0.08em] uppercase ${
                      user.plan === "Plus"
                        ? "bg-[var(--admin-gold-soft)] text-[var(--admin-gold)]"
                        : "bg-[var(--admin-surface-2)] text-[var(--admin-text-muted)]"
                    }`}
                  >
                    {user.plan}
                  </span>
                </span>
                <span className="w-20 flex-shrink-0 text-right text-[13.5px] text-[var(--admin-text-secondary)]">
                  {user.entries || "—"}
                </span>
                <span className="w-20 flex-shrink-0 text-right text-[13.5px] text-[var(--admin-text-secondary)]">
                  {user.streak ? `${user.streak} d` : "—"}
                </span>
                <span className="w-[110px] flex-shrink-0 text-right text-[12.5px] text-[var(--admin-text-muted)]">
                  {lastActiveLabel(user.lastActive)}
                </span>

                <span className="w-[210px] flex-shrink-0 flex gap-2 justify-end">
                  <button
                    onClick={() => togglePlan(user)}
                    disabled={isPending}
                    className="px-3 py-[7px] rounded-lg border border-[var(--admin-border-hover)] text-[var(--admin-text-secondary)] text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    {user.plan === "Plus" ? "Downgrade" : "Give Plus"}
                  </button>
                  <ChangeRoleButton
                    userId={user.id}
                    currentRole={user.role === "admin" ? "admin" : "user"}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3.5 mt-4 flex-wrap">
        <span className="text-[12.5px] text-[var(--admin-text-muted)]">
          Showing {shown.length} of {users.length}
        </span>
      </div>
    </>
  );
}
