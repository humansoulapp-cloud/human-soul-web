"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowDown,
  ArchiveRestore,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  ExternalLink,
  Gem,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MoreHorizontal,
  PenLine,
  Plus,
  Rocket,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { archiveJourney, deleteJourney, publishJourneyNow, unarchiveJourney } from "@/lib/actions/journeys";

export type StatusKey = "live" | "scheduled" | "draft" | "archived";

export type AdminJourneyItem = {
  id: string;
  title: string;
  category: string;
  days: number;
  status: StatusKey;
  note: string | null;
  image: string | null;
  featured: boolean;
  premium: boolean;
  started: number;
  finishedPct: number | null;
  tooEarly: boolean;
  drop: string | null;
  warning: string | null;
};

const STATUS: Record<StatusKey, { label: string; icon: typeof CircleCheck }> = {
  live: { label: "Live", icon: CircleCheck },
  scheduled: { label: "Scheduled", icon: CalendarDays },
  draft: { label: "Draft", icon: PenLine },
  archived: { label: "Archived", icon: Archive },
};
const ORDER: StatusKey[] = ["live", "scheduled", "draft", "archived"];
const VIEW_KEY = "humansoul:admin-journeys-view";

function StatusChip({ status, glass = false }: { status: StatusKey; glass?: boolean }) {
  const { label, icon: Icon } = STATUS[status];
  return (
    <span className={`${glass ? "hsa-glass" : "hsa-st"} ${status}`}>
      <Icon size={14} aria-hidden="true" className="ai" />
      {label}
    </span>
  );
}

function RowMenu({ item }: { item: AdminJourneyItem }) {
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

  const run = (action: () => Promise<{ error?: string } | { success: boolean }>) =>
    start(async () => {
      const res = await action();
      if (res && "error" in res && res.error) window.alert(res.error);
      setOpen(false);
      router.refresh();
    });

  return (
    <div className="hsa-menu-wrap" ref={ref}>
      <button
        type="button"
        className="hsa-icon-btn"
        aria-label={`More actions for ${item.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div className="hsa-menu" role="menu">
          <Link role="menuitem" href={`/admin/journeys/${item.id}`}>
            <PenLine size={16} className="ai" aria-hidden="true" />
            Edit
          </Link>
          {item.status === "live" ? (
            <a role="menuitem" href={`/journeys/${item.id}`} target="_blank" rel="noreferrer">
              <ExternalLink size={16} className="ai" aria-hidden="true" />
              Open in the app
            </a>
          ) : null}
          {item.status === "draft" || item.status === "scheduled" ? (
            <button type="button" role="menuitem" onClick={() => run(() => publishJourneyNow(item.id))}>
              <Rocket size={16} className="ai" aria-hidden="true" />
              Publish now
            </button>
          ) : null}
          {item.status === "archived" ? (
            <button type="button" role="menuitem" onClick={() => run(() => unarchiveJourney(item.id, "draft"))}>
              <ArchiveRestore size={16} className="ai" aria-hidden="true" />
              Restore as draft
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={() => run(() => archiveJourney(item.id))}>
              <Archive size={16} className="ai" aria-hidden="true" />
              Archive
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              if (window.confirm(`Delete “${item.title}” and all its days? This can't be undone.`)) {
                run(() => deleteJourney(item.id));
              }
            }}
          >
            <Trash2 size={16} className="ai" aria-hidden="true" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Flags({ item }: { item: AdminJourneyItem }) {
  return (
    <>
      {item.featured ? (
        <span className="hsa-tg">
          <Star size={13} aria-hidden="true" />
          Featured
        </span>
      ) : null}
      {item.premium ? (
        <span className="hsa-tg">
          <Gem size={13} aria-hidden="true" />
          Plus
        </span>
      ) : null}
    </>
  );
}

function meta(item: AdminJourneyItem) {
  return `${item.category} · ${item.days ? `${item.days} ${item.days === 1 ? "day" : "days"}` : "no days"}`;
}

export default function AdminJourneysBrowser({
  items,
  initialStatus,
  initialView,
}: {
  items: AdminJourneyItem[];
  initialStatus: StatusKey | "all";
  initialView?: "list" | "grid";
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusKey | "all">(initialStatus);
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"list" | "grid">(initialView ?? "list");

  useEffect(() => {
    if (initialView) return;
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {}
  }, [initialView]);

  const changeView = (v: "list" | "grid") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { live: 0, scheduled: 0, draft: 0, archived: 0 };
    for (const i of items) c[i.status] += 1;
    return c;
  }, [items]);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => status === "all" || i.status === status)
      .filter((i) => category === "all" || i.category === category)
      .filter((i) => !q || `${i.title} ${i.category} ${i.id}`.toLowerCase().includes(q))
      .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.started - a.started);
  }, [items, query, status, category]);

  const summary = [
    `${items.length} ${items.length === 1 ? "journey" : "journeys"}`,
    `${counts.live} live`,
    counts.scheduled ? `${counts.scheduled} scheduled` : null,
    counts.draft ? `${counts.draft} ${counts.draft === 1 ? "draft" : "drafts"}` : null,
    counts.archived ? `${counts.archived} archived` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="hsa-head">
        <div className="hsa-head-t">
          <h1 className="text-h1" style={{ margin: 0 }}>
            Journeys
          </h1>
          <span className="hs-hint">{summary}</span>
        </div>
        <div className="hsa-head-a">
          <Link href="/admin/journeys/new?import=open" className="hs-btn hs-btn-secondary">
            <Upload size={16} aria-hidden="true" />
            Import from a document
          </Link>
          <Link href="/admin/journeys/new" className="hs-btn hs-btn-default">
            <Plus size={16} aria-hidden="true" />
            New journey
          </Link>
        </div>
      </div>

      <div className="hsa-tools">
        <label className="hsa-srch">
          <span className="sr-only">Search journeys</span>
          <Search size={18} className="ai" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by title or category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="hsa-seg" role="group" aria-label="Status">
          <button type="button" aria-pressed={status === "all"} onClick={() => setStatus("all")}>
            All<span className="n">{items.length}</span>
          </button>
          {ORDER.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "draft" ? "Drafts" : STATUS[s].label}
              <span className="n">{counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="hsa-pill">
          <span className="sr-only">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="ai" aria-hidden="true" />
        </label>
        <div className="hsa-views" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "list"} aria-label="List" onClick={() => changeView("list")}>
            <List size={18} aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={view === "grid"} aria-label="Grid" onClick={() => changeView("grid")}>
            <LayoutGrid size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="hsa-card hsa-empty" style={{ marginTop: 16 }}>
          No journeys match. Try another status or clear the search.
        </div>
      ) : view === "list" ? (
        <section className="hsa-card hsa-list" aria-label="Journeys">
          <div className="hsa-cols" aria-hidden="true">
            <span>Journey</span>
            <span>Status</span>
            <span className="num">
              Started
              <ArrowDown size={14} />
            </span>
            <span>Finished</span>
            <span>Biggest drop</span>
            <span />
          </div>
          <ul className="hsa-rows">
            {shown.map((item) => (
              <li key={item.id} className={`hsa-row${item.status === "archived" ? " arch" : ""}`}>
                <Link className="hsa-r-main" href={`/admin/journeys/${item.id}`}>
                  <span className="hsa-cov">
                    {item.image ? <img src={item.image} alt="" /> : <ImageIcon size={18} aria-hidden="true" />}
                  </span>
                  <span className="hsa-r-txt">
                    <span className="hsa-r-t">{item.title}</span>
                    <span className="hsa-r-m">
                      {meta(item)}
                      <Flags item={item} />
                    </span>
                    {item.warning ? (
                      <span className="hsa-warn">
                        <TriangleAlert size={14} aria-hidden="true" />
                        {item.warning}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <div className="hsa-stc">
                  <StatusChip status={item.status} />
                  {item.note ? <span className="hsa-st-n">{item.note}</span> : null}
                </div>
                <span className="num">
                  {item.status === "scheduled" || item.status === "draft" ? <span className="hsa-dash">—</span> : item.started}
                </span>
                {item.finishedPct !== null ? (
                  <div className="hsa-fin">
                    <span className="hsa-fin-v">{item.finishedPct}%</span>
                    <span className="hsa-fin-t">
                      <span style={{ width: `${item.finishedPct}%` }} />
                    </span>
                  </div>
                ) : item.tooEarly ? (
                  <span className="hsa-soft">Too early</span>
                ) : (
                  <span className="hsa-dash">—</span>
                )}
                {item.drop ? <span className="hsa-drop">{item.drop}</span> : <span className="hsa-dash">—</span>}
                <RowMenu item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <ul className="hsa-grid" aria-label="Journeys">
          {shown.map((item) => (
            <li key={item.id} className={`hsa-gc${item.status === "archived" ? " arch" : ""}`}>
              <Link href={`/admin/journeys/${item.id}`}>
                <div className="hsa-gc-img">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span className="hsa-noimg">
                      <ImageIcon size={28} aria-hidden="true" />
                      No cover yet
                    </span>
                  )}
                  <div className="hsa-gc-top">
                    <StatusChip status={item.status} glass />
                    <span className="hsa-gc-flags">
                      {item.featured ? (
                        <span className="hsa-glass">
                          <Star size={14} aria-hidden="true" />
                          Featured
                        </span>
                      ) : null}
                      {item.premium ? (
                        <span className="hsa-glass">
                          <Gem size={14} aria-hidden="true" />
                          Plus
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
                <div className="hsa-gc-b">
                  <span className="hsa-r-t">{item.title}</span>
                  <span className="hsa-r-m">{meta(item)}</span>
                  {item.warning ? (
                    <span className="hsa-warn">
                      <TriangleAlert size={14} aria-hidden="true" />
                      {item.warning}
                    </span>
                  ) : null}
                  <div className="hsa-gs">
                    {item.status === "live" || item.status === "archived" ? (
                      <div>
                        <span className="hsa-gs-v">{item.started}</span>
                        <span className="hsa-gs-l">started</span>
                      </div>
                    ) : null}
                    {item.finishedPct !== null ? (
                      <div>
                        <span className="hsa-gs-v">{item.finishedPct}%</span>
                        <span className="hsa-gs-l">finished</span>
                      </div>
                    ) : null}
                    {item.drop && item.status === "live" ? (
                      <div>
                        <span className="hsa-gs-v">{item.drop}</span>
                        <span className="hsa-gs-l">biggest drop</span>
                      </div>
                    ) : null}
                    {item.note || item.tooEarly ? (
                      <div className="hsa-soft">
                        {item.status === "scheduled" ? `Publishes ${item.note}` : item.note}
                        {item.tooEarly ? `${item.note ? " · " : ""}too early for finishes` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
              <RowMenu item={item} />
            </li>
          ))}
        </ul>
      )}
      <div className="hsa-foot">
        <span>Grouped by status, then most started · started and finished count people</span>
        <span>
          Showing {shown.length} of {items.length}
        </span>
      </div>
    </>
  );
}
