import React from "react";
import { getUsers } from "@/lib/actions/users";
import AdminUsersBrowser from "@/components/admin/AdminUsersBrowser";

const DAY = 86_400_000;

export default async function AdminUsersPage() {
  const users = await getUsers();
  const now = Date.now();
  const since = (iso: string | null) => (iso ? now - new Date(iso).getTime() : Infinity);

  const total = users.length;
  const plus = users.filter((u) => u.plan === "Plus").length;
  const inactive = users.filter((u) => since(u.lastActive) >= 30 * DAY).length;
  const fresh = users.filter((u) => since(u.created_at) < 7 * DAY);
  const freshWriting = fresh.filter((u) => u.entries > 0).length;
  const activeWeek = users.filter((u) => u.entriesWeek > 0).length;
  const entriesWeek = users.reduce((n, u) => n + u.entriesWeek, 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const kpis = [
    { label: "New this week", value: fresh.length, note: fresh.length ? `${freshWriting} wrote their first entry` : "No new accounts yet" },
    { label: "Active this week", value: activeWeek, note: `${pct(activeWeek)}% of everyone` },
    { label: "On Plus", value: plus, note: `${pct(plus)}% of accounts` },
    {
      label: "Entries this week",
      value: entriesWeek,
      note: activeWeek ? `${(entriesWeek / activeWeek).toFixed(1)} per active person` : "Nobody wrote this week",
    },
  ];

  return (
    <AdminUsersBrowser
      users={users}
      summary={`${total} ${total === 1 ? "account" : "accounts"} · ${plus} on Plus · ${inactive} inactive for a month`}
      kpis={kpis}
    />
  );
}
