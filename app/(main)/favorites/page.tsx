"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, BookOpen, Compass, Heart, Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserJournal } from "@/lib/journal";
import {
  entryBody,
  entryLabels,
  entryTitle,
  journeyInfo,
  resolvePhotos,
  type Reflection,
} from "@/lib/reflections";
import PageLoader from "@/components/PageLoader";
import "../../account.css";

type Filter = "all" | "journal" | "journeys";

function cardDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? "" : "s"} ago`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? "" : "s"} ago`;
  return "over a year ago";
}

export default function FavoritesPage() {
  const [items, setItems] = useState<Reflection[]>([]);
  const [journals, setJournals] = useState<UserJournal[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newest, setNewest] = useState(true);
  const [pick, setPick] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const [{ data }, { data: journalRows }] = await Promise.all([
        supabase
          .from("reflections")
          .select("*")
          .eq("user_id", user.id)
          .eq("favorite", true)
          .order("created_at", { ascending: false }),
        supabase.from("journals").select("*").eq("user_id", user.id),
      ]);
      const rows = (data ?? []) as Reflection[];
      setItems(rows);
      setJournals((journalRows ?? []) as UserJournal[]);
      /* The one to read again: a random favorite, older ones first when there are any. */
      const older = rows.map((r, i) => ({ r, i })).filter(({ r }) => Date.now() - new Date(r.created_at).getTime() > 14 * 86400000);
      const pool = older.length ? older.map((x) => x.i) : rows.map((_, i) => i);
      setPick(pool.length ? pool[Math.floor(Math.random() * pool.length)] : 0);
      setLoading(false);
      setPhotos(await resolvePhotos(supabase, rows));
    }
    load();
  }, []);

  const remove = async (entry: Reflection) => {
    setItems((prev) => prev.filter((e) => e.id !== entry.id));
    const supabase = createClient();
    await supabase.from("reflections").update({ favorite: false }).eq("id", entry.id);
  };

  const counts = useMemo(() => {
    const journeys = items.filter((e) => journeyInfo(e)).length;
    return { all: items.length, journeys, journal: items.length - journeys };
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((e) => {
      const isJourney = Boolean(journeyInfo(e));
      if (filter === "journeys" && !isJourney) return false;
      if (filter === "journal" && isJourney) return false;
      if (!q) return true;
      return `${entryTitle(e)} ${entryBody(e.content)} ${entryLabels(e, journals).join(" ")}`.toLowerCase().includes(q);
    });
    return newest ? list : [...list].reverse();
  }, [items, journals, query, filter, newest]);

  if (loading) return <PageLoader />;

  const again = items[pick] ?? items[0];
  const anotherAvailable = items.length > 1;

  return (
    <div className="ac">
      <div className="ac-head">
        <h1 className="ac-h1">Favorites</h1>
        <span className="ac-sub">
          {items.length
            ? `The moments you wanted to keep close · ${items.length} saved`
            : "The moments you wanted to keep close"}
        </span>
      </div>

      {items.length === 0 ? (
        <section className="ac-empty" aria-labelledby="fav-empty">
          <span className="ac-empty-ico">
            <Heart size={26} aria-hidden="true" />
          </span>
          <h2 id="fav-empty" className="ac-h3" style={{ marginTop: 6 }}>
            Nothing kept here yet
          </h2>
          <p>When something you wrote feels worth reading again, tap the heart. It will wait for you here.</p>
          <div className="ac-how">
            <div>
              <BookOpen className="ai" size={18} aria-hidden="true" />
              <span>
                <b>From your Journal</b>Open an entry and tap the heart at the top.
              </span>
            </div>
            <div>
              <Compass className="ai" size={18} aria-hidden="true" />
              <span>
                <b>From a journey</b>Entries you write on a journey can be kept too.
              </span>
            </div>
          </div>
          <Link className="ac-btn ac-btn-pri" href="/journal" style={{ marginTop: 10 }}>
            Open your Journal
          </Link>
        </section>
      ) : (
        <>
          {again && (
            <section className="ac-again" aria-labelledby="fav-again">
              <div>
                <span className="ac-over">
                  <Sparkles size={14} aria-hidden="true" />
                  Read again · {ago(again.created_at)}
                </span>
                <h2 id="fav-again" className="ac-again-t">
                  {entryTitle(again)}
                </h2>
                <p className="ac-again-q">“{entryBody(again.content)}”</p>
                <div className="ac-again-meta">
                  <span className="ac-tag">
                    {journeyInfo(again) ? <Compass size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
                    {entryLabels(again, journals)[0]}
                  </span>
                  <span>
                    {new Date(again.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="ac-again-side">
                <p className="ac-again-note">
                  One of your favorites, brought back each time you visit. Sometimes the words read differently a few weeks later.
                </p>
                <div className="ac-again-acts">
                  <Link className="ac-btn ac-btn-sec" href={`/journal?r=${encodeURIComponent(again.id)}`}>
                    <BookOpen size={16} aria-hidden="true" />
                    Open in Journal
                  </Link>
                  {anotherAvailable && (
                    <button
                      type="button"
                      className="ac-btn ac-btn-ghost"
                      onClick={() => setPick((p) => (p + 1 + Math.floor(Math.random() * (items.length - 1))) % items.length)}
                    >
                      Show another
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="ac-tools">
            <label className="ac-srch">
              <span className="sr-only">Search favorites</span>
              <Search className="ai" size={18} aria-hidden="true" />
              <input type="search" placeholder="Search your favorites" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="ac-seg" role="group" aria-label="Show">
              {(
                [
                  ["all", "All"],
                  ["journal", "Journal"],
                  ["journeys", "From journeys"],
                ] as [Filter, string][]
              ).map(([k, label]) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                  {label}
                  <span className="n">{counts[k]}</span>
                </button>
              ))}
            </div>
            <button type="button" className="ac-pill" onClick={() => setNewest((v) => !v)}>
              <ArrowDownUp className="ai" size={16} aria-hidden="true" />
              {newest ? "Recently saved" : "Oldest first"}
            </button>
          </div>

          {visible.length === 0 ? (
            <section className="ac-empty" aria-live="polite">
              <p>Nothing matches that. Try a shorter word, or show everything.</p>
              <button
                type="button"
                className="ac-btn ac-btn-sec"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Show all favorites
              </button>
            </section>
          ) : (
            <ul className="ac-grid" aria-label="Favorites">
              {visible.map((e) => {
                const journey = journeyInfo(e);
                const photo = photos[e.id];
                return (
                  <li key={e.id} className={`ac-fc${photo ? " has-photo" : ""}`}>
                    <Link
                      className="ac-fc-link"
                      href={`/journal?r=${encodeURIComponent(e.id)}`}
                      aria-label={`Open ${entryTitle(e)} in Journal`}
                    />
                    {photo && (
                      <div className="ac-fc-photo">
                        <img src={photo} alt="" loading="lazy" />
                      </div>
                    )}
                    <button type="button" className="ac-fav" aria-label="Remove from favorites" aria-pressed="true" onClick={() => remove(e)}>
                      <Heart size={20} fill="currentColor" aria-hidden="true" />
                    </button>
                    <span className="ac-fc-date">{cardDate(e.created_at)}</span>
                    <span className="ac-fc-t">{entryTitle(e)}</span>
                    <span className="ac-fc-b">{entryBody(e.content)}</span>
                    <span className={`ac-fc-src${journey ? "" : " plain"}`}>
                      {journey && <Compass size={14} aria-hidden="true" />}
                      {entryLabels(e, journals)[0]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="ac-foot">Tap the heart again to take something out. It stays in your Journal.</p>
        </>
      )}
    </div>
  );
}
