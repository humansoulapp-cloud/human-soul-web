"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteOwnAccount } from "@/lib/actions/account";
import { PLANS } from "@/lib/plans";
import {
  currentStreak,
  longestStreak,
  writtenDays,
  type Journey,
  type ReflectionRow,
} from "@/lib/journal";

const CARD = "p-6 rounded-2xl border border-[var(--ds-line)] bg-[var(--ds-surface)] mt-[18px]";
const GHOST_BTN =
  "px-4 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13px] whitespace-nowrap transition-colors";
const PRIMARY_BTN =
  "px-5 py-2.5 rounded-[9px] bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-on-accent)] hover:text-[var(--ds-on-accent)] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60";
const LABEL = "text-[10px] font-bold tracking-[0.11em] text-[var(--ds-text-muted)]";
const INPUT =
  "w-full px-3 py-3 rounded-[9px] border border-[var(--ds-line-strong)] bg-[var(--ds-bg)] text-[var(--ds-text)] text-sm";
const ROW = "flex items-center gap-4 py-4 border-b border-[var(--ds-line)]";

const PREFS = [
  ["reminder", "Daily reminder", "One quiet notification a day, no streak pressure."],
  ["newJourneys", "New journeys", "Tell me when a journey is added to the library."],
  ["weekly", "Weekly recap by email", "A short summary of what you wrote, every Sunday."],
] as const;

const HOURS = ["07:00", "13:00", "19:00", "21:00"];

type Profile = {
  plan?: string | null;
  alias?: string | null;
  timezone?: string | null;
  reminder_hour?: string | null;
  preferences?: Record<string, boolean> | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [aliasDraft, setAliasDraft] = useState("");
  const [tzDraft, setTzDraft] = useState("");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [deleteAsked, setDeleteAsked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      setUserId(user.id);
      setCreatedAt(user.created_at);
      setEmail(user.email ?? "");
      setName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");

      const [{ data: profileRow }, { data: reflectionRows }, { data: journeyRows }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          supabase
            .from("reflections")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("journeys").select("id, title, journey_days(day)"),
        ]);

      setProfile((profileRow ?? {}) as Profile);
      setReflections((reflectionRows ?? []) as ReflectionRow[]);
      setJourneys((journeyRows ?? []) as unknown as Journey[]);
      setLoading(false);
    }
    load();
  }, []);

  const plus = Boolean(profile.plan && profile.plan !== "free");
  const days = useMemo(() => writtenDays(reflections), [reflections]);

  const journeysFinished = useMemo(() => {
    let count = 0;
    for (const j of journeys) {
      const total = (j.journey_days ?? []).length;
      if (total === 0) continue;
      const done = new Set(
        reflections
          .filter((r) => (r.tags ?? []).includes(j.title))
          .flatMap((r) => (r.tags ?? []).filter((t) => /^Day \d+$/.test(t)))
      ).size;
      if (done >= total) count += 1;
    }
    return count;
  }, [journeys, reflections]);

  const stats = [
    { label: "Entries", value: String(reflections.length) },
    { label: "Current streak", value: `${currentStreak(days)} d` },
    { label: "Longest streak", value: `${longestStreak(days)} d` },
    { label: "Journeys finished", value: String(journeysFinished) },
  ];

  const initials = (name || email)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const startEdit = () => {
    setNameDraft(name);
    setAliasDraft(profile.alias ?? "");
    setTzDraft(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setFlash("");
    setError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!userId) return;
    const supabase = createClient();

    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: nameDraft.trim() || name },
    });
    if (authError) return setError(authError.message);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ alias: aliasDraft.trim() || null, timezone: tzDraft.trim() || null })
      .eq("user_id", userId);
    if (profileError) return setError(profileError.message);

    setName(nameDraft.trim() || name);
    setProfile((p) => ({ ...p, alias: aliasDraft.trim() || null, timezone: tzDraft.trim() || null }));
    setEditing(false);
    setFlash("Details updated.");
  };

  const savePreference = async (patch: Partial<Profile>) => {
    if (!userId) return;
    setProfile((p) => ({ ...p, ...patch }));
    const supabase = createClient();
    await supabase.from("profiles").update(patch).eq("user_id", userId);
  };

  const togglePref = (key: string) => {
    const next = { ...(profile.preferences ?? {}), [key]: !(profile.preferences ?? {})[key] };
    savePreference({ preferences: next });
  };

  const exportEverything = () => {
    const blob = new Blob([JSON.stringify(reflections, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `humansoul-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    const result = await deleteOwnAccount();
    setDeleting(false);
    if (result?.error) return setError(result.error);
    router.push("/sign-in");
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-[var(--ds-text-muted)]">Loading…</div>;
  }

  return (
    <div>
      <h1 className="text-[28px] md:text-[37px] font-semibold tracking-[-0.015em] m-0 mb-1.5">
        Profile
      </h1>
      <p className="text-sm text-[var(--ds-text-muted)] m-0">
        Your account, your plan and how the app behaves.
      </p>

      {/* ── Account ── */}
      <div className={CARD}>
        <div className="flex items-center gap-[18px] flex-wrap">
          <span className="w-[66px] h-[66px] flex-shrink-0 rounded-full grid place-items-center bg-[var(--ds-accent-soft)] text-[var(--ds-accent)] text-[22px] font-semibold">
            {initials}
          </span>

          <div className="flex-1 min-w-[220px]">
            {editing ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>DISPLAY NAME</span>
                  <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className={INPUT} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>EMAIL</span>
                  <input value={email} disabled className={`${INPUT} opacity-60`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>TIMEZONE</span>
                  <input value={tzDraft} onChange={(e) => setTzDraft(e.target.value)} className={INPUT} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>HOW YOU WANT TO BE ADDRESSED</span>
                  <input
                    value={aliasDraft}
                    onChange={(e) => setAliasDraft(e.target.value)}
                    placeholder="Used in greetings"
                    className={INPUT}
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="text-[23px] font-semibold tracking-[-0.012em]">{name}</div>
                <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-1">{email}</div>
                <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-2.5">
                  {createdAt
                    ? `Member since ${new Date(createdAt).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })} · `
                    : ""}
                  {plus ? "HumanSoul Plus" : "Free plan"}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 self-start flex-wrap">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className={GHOST_BTN}>
                  Cancel
                </button>
                <button onClick={saveEdit} className={PRIMARY_BTN}>
                  Save changes
                </button>
              </>
            ) : (
              <button onClick={startEdit} className={GHOST_BTN}>
                Edit details
              </button>
            )}
          </div>
        </div>

        {flash && (
          <div className="mt-4 px-3.5 py-3 rounded-[10px] bg-[var(--ds-accent-soft)] text-[var(--ds-text-mid)] text-[12.5px]">
            {flash}
          </div>
        )}
        {error && <p className="mt-3 text-[12.5px] text-[var(--ds-danger)]">{error}</p>}

        <div className="flex flex-wrap gap-y-4 mt-5 pt-[18px] border-t border-[var(--ds-line)]">
          {stats.map((s) => (
            <span key={s.label} className="flex-1 min-w-[120px]">
              <span className="block text-[21px] font-semibold tracking-[-0.01em]">{s.value}</span>
              <span className="block text-[10px] font-semibold tracking-[0.09em] text-[var(--ds-text-muted)] mt-[3px] uppercase">
                {s.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Subscription ── */}
      <div className={CARD}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div
              className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] ${
                plus
                  ? "bg-[var(--ds-gold-soft)] text-[var(--ds-gold)]"
                  : "bg-[var(--ds-accent-soft)] text-[var(--ds-accent)]"
              }`}
            >
              {plus ? "HUMANSOUL PLUS" : "FREE PLAN"}
            </div>
            <h2 className="text-[21px] font-semibold mt-2.5 mb-1.5">
              {plus ? "You are on HumanSoul Plus" : "You are on the free plan"}
            </h2>
            <p className="text-[12.5px] leading-[1.6] text-[var(--ds-text-muted)] max-w-[56ch] m-0">
              {plus
                ? "Every journey is open, new ones arrive each month, and your full journal history is kept."
                : "Day one of every journey is free. Plus opens the remaining days, the whole library and unlimited history."}
            </p>
          </div>
          {!plus && (
            <Link
              href="/subscription"
              className="px-[22px] py-[11px] rounded-[9px] bg-[var(--ds-gold)] text-[var(--ds-on-gold)] hover:text-[var(--ds-on-gold)] text-[13px] font-semibold whitespace-nowrap"
            >
              Start Plus
            </Link>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-[18px]">
          {PLANS.map((p) => (
            <Link
              key={p.key}
              href="/subscription"
              className="block text-left px-[18px] py-4 rounded-[13px] border border-[var(--ds-line-strong)] text-[var(--ds-text)] hover:text-[var(--ds-text)] hover:border-[var(--ds-gold)] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span className={LABEL}>{p.label}</span>
                <span className="flex-1" />
                {p.key === "year" && (
                  <span className="text-[9.5px] font-bold tracking-[0.1em] text-[var(--ds-gold)]">
                    SAVE 35%
                  </span>
                )}
              </span>
              <span className="block text-2xl font-semibold mt-2.5">{p.price}</span>
              <span className="block text-[12.5px] text-[var(--ds-text-muted)] mt-1">{p.note}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className={CARD}>
        <h2 className="text-[19px] font-semibold m-0 mb-1">Preferences</h2>
        <p className="text-[12.5px] text-[var(--ds-text-muted)] m-0">
          How the app looks, and when it asks for your attention.
        </p>

        <div className="mt-1.5">
          {PREFS.map(([key, title, desc]) => {
            const on = Boolean((profile.preferences ?? {})[key]);
            return (
              <div key={key} className={ROW}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-0.5 leading-relaxed">
                    {desc}
                  </div>
                </div>
                <button
                  onClick={() => togglePref(key)}
                  aria-pressed={on}
                  className={`w-11 h-[26px] flex-shrink-0 rounded-full border p-0.5 flex items-center transition-colors ${
                    on
                      ? "justify-end border-[var(--ds-accent)] bg-[var(--ds-accent)]"
                      : "justify-start border-[var(--ds-line-strong)]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full block ${
                      on ? "bg-[var(--ds-on-accent)]" : "bg-[var(--ds-line-strong)]"
                    }`}
                  />
                </button>
              </div>
            );
          })}

          <div className="flex items-center gap-4 flex-wrap py-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Reminder time</div>
              <div className="text-[12.5px] text-[var(--ds-text-muted)] mt-0.5">
                A single nudge, at the hour you choose.
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {HOURS.map((h) => {
                const on = profile.reminder_hour === h;
                return (
                  <button
                    key={h}
                    onClick={() => savePreference({ reminder_hour: on ? null : h })}
                    className={`px-3 py-[7px] rounded-full text-[12.5px] transition-colors ${
                      on
                        ? "border border-transparent bg-[var(--ds-accent-soft)] text-[var(--ds-text)] font-semibold"
                        : "border border-[var(--ds-line-strong)] text-[var(--ds-text-muted)] hover:text-[var(--ds-text)]"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Data ── */}
      <div className={CARD}>
        <h2 className="text-[19px] font-semibold m-0 mb-1">Your writing and your data</h2>
        <p className="text-[12.5px] text-[var(--ds-text-muted)] m-0">
          Entries are private by default. Nothing is used to train anything.
        </p>
        <div className="flex gap-2.5 mt-[18px] flex-wrap">
          <button onClick={exportEverything} className={GHOST_BTN}>
            Export everything (.json)
          </button>
          <Link href="/journal" className={GHOST_BTN}>
            Download journal as PDF
          </Link>
        </div>

        <div className="flex items-center gap-3.5 flex-wrap mt-5 px-[17px] py-4 rounded-xl border border-[var(--ds-line)] bg-[var(--ds-surface-2)]">
          <div className="flex-1 min-w-[220px]">
            <div className="text-[13.5px] font-semibold">Delete account</div>
            <div className="text-[12.5px] text-[var(--ds-text-muted)]">
              Removes your entries and your account. This cannot be undone.
            </div>
          </div>
          <button
            onClick={() => (deleteAsked ? handleDelete() : setDeleteAsked(true))}
            disabled={deleting || (deleteAsked && confirmText !== "DELETE")}
            className="px-[18px] py-2.5 rounded-[9px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[13px] font-semibold whitespace-nowrap disabled:opacity-50"
          >
            {deleting ? "Deleting…" : deleteAsked ? "Confirm deletion" : "Delete account"}
          </button>
        </div>

        {deleteAsked && (
          <div className="flex items-center gap-3 flex-wrap mt-3 px-4 py-3.5 rounded-xl border border-dashed border-[var(--ds-danger)] text-[var(--ds-text-mid)]">
            <div className="flex-1 min-w-[220px] text-[13px] leading-[1.6]">
              Type <strong>DELETE</strong> to confirm. Export your journal first if you want to keep
              it.
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-[140px] px-3 py-2.5 rounded-[9px] border border-[var(--ds-line-strong)] bg-[var(--ds-bg)] text-[var(--ds-text)] text-[13px]"
            />
            <button
              onClick={() => {
                setDeleteAsked(false);
                setConfirmText("");
              }}
              className={GHOST_BTN}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2.5 w-full mt-[18px] p-4 rounded-xl border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-text-mid)] hover:text-[var(--ds-text)] text-[13.5px] font-semibold transition-colors"
      >
        <LogOut className="w-[15px] h-[15px]" strokeWidth={1.8} />
        Sign out
      </button>
    </div>
  );
}
