"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ChevronDown, Copy, Download, Flame, Gem, Mail, Moon, MoreHorizontal, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateUserPlan, type UserRow } from "@/lib/actions/users";

const DAY = 86_400_000;
const INACTIVE_DAYS = 30;

type Filter = "all" | "plus" | "free" | "inactive" | "admins";
type Sort = "active" | "entries" | "joined";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["plus", "Plus"],
  ["free", "Free"],
  ["inactive", "Inactive"],
  ["admins", "Admins"],
];

const SORTS: [Sort, string][] = [
  ["active", "Recently active"],
  ["entries", "Most entries"],
  ["joined", "Newest first"],
];

export type UserKpi = { label: string; value: number; note: string };

function since(iso: string | null) {
  return iso ? Date.now() - new Date(iso).getTime() : Infinity;
}

function isInactive(u: UserRow) {
  return since(u.lastActive) >= INACTIVE_DAYS * DAY;
}

function lastActiveLabel(iso: string | null) {
  if (!iso) return "Never";
  const days = Math.floor(since(iso) / DAY);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months} months ago` : "Over a year ago";
}

function joined(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

function initials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function RowMenu({ user, onNotice }: { user: UserRow; onNotice: (text: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const plus = user.plan === "Plus";
  const hasEmail = user.email.includes("@");

  const togglePlan = () =>
    start(async () => {
      const res = await updateUserPlan(user.id, plus ? "free" : "plus");
      setOpen(false);
      if (res && "error" in res && res.error) return onNotice(res.error);
      onNotice(plus ? `${user.name} is back on the free plan.` : `${user.name} now has Plus.`);
      router.refresh();
    });

  const copyEmail = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(user.email);
      onNotice("Email copied.");
    } catch {
      onNotice(user.email);
    }
  };

  const sendReset = () =>
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setOpen(false);
      onNotice(error ? error.message : `Password reset sent to ${user.email}.`);
    });

  return (
    <div className="hsa-menu-wrap" ref={ref}>
      <button
        type="button"
        className="hsa-icon-btn"
        aria-label={`More actions for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div className="hsa-menu" role="menu">
          <button type="button" role="menuitem" onClick={togglePlan}>
            <Gem size={16} className="ai" aria-hidden="true" />
            {plus ? "Remove Plus" : "Give Plus"}
          </button>
          {hasEmail ? (
            <>
              <span className="hsa-menu-sep" aria-hidden="true" />
              <button type="button" role="menuitem" onClick={copyEmail}>
                <Copy size={16} className="ai" aria-hidden="true" />
                Copy email
              </button>
              <button type="button" role="menuitem" onClick={sendReset}>
                <Mail size={16} className="ai" aria-hidden="true" />
                Send password reset
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminUsersBrowser({
  users,
  summary,
  kpis,
}: {
  users: UserRow[];
  summary: string;
  kpis: UserKpi[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("active");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const counts = useMemo(
    () => ({
      all: users.length,
      plus: users.filter((u) => u.plan === "Plus").length,
      free: users.filter((u) => u.plan !== "Plus").length,
      inactive: users.filter(isInactive).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((u) => {
      if (filter === "plus" && u.plan !== "Plus") return false;
      if (filter === "free" && u.plan === "Plus") return false;
      if (filter === "inactive" && !isInactive(u)) return false;
      if (filter === "admins" && u.role !== "admin") return false;
      return !q || `${u.name} ${u.email}`.toLowerCase().includes(q);
    });
    if (sort === "entries") return [...list].sort((a, b) => b.entries - a.entries);
    if (sort === "joined") return [...list].sort((a, b) => since(a.created_at) - since(b.created_at));
    return [...list].sort((a, b) => since(a.lastActive) - since(b.lastActive));
  }, [users, query, filter, sort]);

  const exportCsv = () => {
    const header = "name,email,plan,role,joined,entries,entries_last_7_days,streak,last_active\n";
    const rows = shown
      .map((u) =>
        [u.name, u.email, u.plan, u.role, u.created_at, u.entries, u.entriesWeek, u.streak, u.lastActive ?? ""]
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

  const sortLabel = SORTS.find(([k]) => k === sort)![1];

  return (
    <>
      <div className="hsa-head">
        <div className="hsa-head-t">
          <h1 className="text-h1" style={{ margin: 0 }}>
            Users
          </h1>
          <span className="hs-hint">{summary}</span>
        </div>
        <div className="hsa-head-a">
          <button type="button" className="hs-btn hs-btn-secondary" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="hsa-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="hsa-card hsa-kpi">
            <span className="hsa-kpi-l">{k.label}</span>
            <b>{k.value.toLocaleString("en-US")}</b>
            <small>{k.note}</small>
          </div>
        ))}
      </div>

      <div className="hsa-tools">
        <label className="hsa-srch">
          <span className="sr-only">Search users</span>
          <Search size={18} className="ai" aria-hidden="true" />
          <input type="search" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="hsa-seg" role="group" aria-label="Show">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
              <span className="n">{counts[k]}</span>
            </button>
          ))}
        </div>
        <label className="hsa-pill">
          <span className="sr-only">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort users">
            {SORTS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="ai" aria-hidden="true" />
        </label>
      </div>

      {notice ? (
        <div className="hsa-banner ok hsa-u-notice" role="status">
          {notice}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="hsa-card hsa-empty" style={{ marginTop: 16 }}>
          {users.length ? "Nobody matches that. Try a shorter search or another filter." : "No accounts yet."}
        </div>
      ) : (
        <section className="hsa-card hsa-list" aria-label="Users">
          <div className="hsa-u-cols">
            <span>User</span>
            <span>Plan</span>
            <span>Joined</span>
            <span className="r">Entries</span>
            <span className="r">Streak</span>
            <span className="on">
              {sortLabel === "Recently active" ? (
                <>
                  Last active
                  <ArrowDown size={14} aria-hidden="true" />
                </>
              ) : (
                "Last active"
              )}
            </span>
            <span />
          </div>
          <ul className="hsa-rows">
            {shown.map((u) => {
              const off = isInactive(u);
              return (
                <li key={u.id} className={`hsa-u-row${off ? " off" : ""}`}>
                  <div className="hsa-u-main">
                    <span className="hsa-av" aria-hidden="true">
                      {initials(u.name)}
                    </span>
                    <span className="hsa-r-txt">
                      <span className="hsa-u-n">
                        <span className="t">{u.name}</span>
                        {u.role === "admin" ? (
                          <span className="hsa-tg">
                            <ShieldCheck size={13} aria-hidden="true" />
                            Admin
                          </span>
                        ) : null}
                      </span>
                      <span className="hsa-u-e">{u.email}</span>
                    </span>
                  </div>
                  <span className={`hsa-plan${u.plan === "Plus" ? " plus" : ""}`}>
                    {u.plan === "Plus" ? <Gem size={14} aria-hidden="true" /> : null}
                    {u.plan}
                  </span>
                  <span className="hsa-u-soft">{joined(u.created_at)}</span>
                  <span className={`num${u.entries ? "" : " hsa-dash"}`}>{u.entries.toLocaleString("en-US")}</span>
                  <span className={`num hsa-u-streak${u.streak ? "" : " hsa-dash"}`}>
                    {u.streak ? <Flame size={14} aria-hidden="true" /> : null}
                    {u.streak ? `${u.streak} d` : "0"}
                  </span>
                  <span className={`hsa-u-last${off ? " off" : ""}`}>
                    {off ? <Moon size={13} aria-hidden="true" /> : null}
                    {lastActiveLabel(u.lastActive)}
                  </span>
                  <RowMenu user={u} onNotice={setNotice} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <div className="hsa-foot">
        <span>Inactive means nothing written in the last {INACTIVE_DAYS} days</span>
        <span>
          Showing {shown.length} of {users.length}
        </span>
      </div>
    </>
  );
}
