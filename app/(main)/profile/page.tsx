"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  ChevronRight,
  Compass,
  Download,
  Globe,
  KeyRound,
  LifeBuoy,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteOwnAccount } from "@/lib/actions/account";
import { PLANS } from "@/lib/plans";
import { writtenDays, type Journey, type ReflectionRow } from "@/lib/journal";
import PageLoader from "@/components/PageLoader";
import "../../account.css";

const HOURS = ["07:00", "13:00", "19:00", "21:00"];

type Profile = {
  plan?: string | null;
  alias?: string | null;
  timezone?: string | null;
  reminder_hour?: string | null;
  preferences?: Record<string, boolean> | null;
};

function timeZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) return fn("timeZone");
  } catch {}
  return [Intl.DateTimeFormat().resolvedOptions().timeZone];
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameDraft, setNameDraft] = useState("");
  const [aliasDraft, setAliasDraft] = useState("");
  const [tzDraft, setTzDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const [pwNew, setPwNew] = useState("");
  const [pwAgain, setPwAgain] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const [deleteAsked, setDeleteAsked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      setUserId(user.id);
      setCreatedAt(user.created_at);
      setEmail(user.email ?? "");
      const display = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
      setName(display);

      const [{ data: profileRow }, { data: reflectionRows }, { data: journeyRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("journeys").select("id, title, journey_days(day)"),
      ]);

      const p = (profileRow ?? {}) as Profile;
      setProfile(p);
      setReflections((reflectionRows ?? []) as ReflectionRow[]);
      setJourneys((journeyRows ?? []) as unknown as Journey[]);
      setNameDraft(display);
      setAliasDraft(p.alias ?? "");
      setTzDraft(p.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      setLoading(false);
    }
    load();
  }, []);

  const plus = Boolean(profile.plan && profile.plan !== "free");
  const yearly = !profile.plan || /year|annual/i.test(profile.plan);
  const daysWritten = useMemo(() => writtenDays(reflections).size, [reflections]);

  const journeysFinished = useMemo(() => {
    let count = 0;
    for (const j of journeys) {
      const total = (j.journey_days ?? []).length;
      if (!total) continue;
      const done = new Set(
        reflections
          .filter((r) => (r.tags ?? []).includes(j.title))
          .flatMap((r) => (r.tags ?? []).filter((t) => /^Day \d+$/.test(t)))
      ).size;
      if (done >= total) count += 1;
    }
    return count;
  }, [journeys, reflections]);

  const zones = useMemo(() => {
    const list = timeZones();
    return tzDraft && !list.includes(tzDraft) ? [tzDraft, ...list] : list;
  }, [tzDraft]);

  const dirty =
    nameDraft.trim() !== name ||
    (aliasDraft.trim() || null) !== (profile.alias ?? null) ||
    (tzDraft.trim() || null) !== (profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);

  const saveAccount = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const nextName = nameDraft.trim() || name;
    const { error: authError } = await supabase.auth.updateUser({ data: { display_name: nextName } });
    if (authError) {
      setSaving(false);
      return setError(authError.message);
    }
    const patch = { alias: aliasDraft.trim() || null, timezone: tzDraft.trim() || null };
    const { error: profileError } = await supabase.from("profiles").update(patch).eq("user_id", userId);
    setSaving(false);
    if (profileError) return setError(profileError.message);
    setName(nextName);
    setProfile((p) => ({ ...p, ...patch }));
    setSavedAt(Date.now());
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwDone(false);
    if (pwNew.length < 8) return setPwError("Use at least 8 characters.");
    if (pwNew !== pwAgain) return setPwError("The two passwords don't match.");
    setPwSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password: pwNew });
    setPwSaving(false);
    if (updateError) {
      /* Supabase can ask for a recent sign-in before a password change. */
      return setPwError(
        /reauth|recent|nonce/i.test(updateError.message)
          ? "For your security, sign out and back in, then change your password."
          : updateError.message
      );
    }
    setPwNew("");
    setPwAgain("");
    setPwDone(true);
  };

  const savePreference = async (patch: Partial<Profile>) => {
    if (!userId) return;
    setProfile((p) => ({ ...p, ...patch }));
    const supabase = createClient();
    await supabase.from("profiles").update(patch).eq("user_id", userId);
  };

  const pref = (key: string) => Boolean((profile.preferences ?? {})[key]);
  const togglePref = (key: string) =>
    savePreference({ preferences: { ...(profile.preferences ?? {}), [key]: !pref(key) } });
  const reminderOn = Boolean(profile.reminder_hour);

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

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  if (loading) return <PageLoader />;

  const initial = (profile.alias || name || email || "·").trim().charAt(0).toUpperCase();
  const planLabel = plus ? `HumanSoul Plus · ${yearly ? "Yearly" : "Monthly"}` : "Free plan";
  const yearPlan = PLANS.find((p) => p.key === "year")!;
  const monthPlan = PLANS.find((p) => p.key === "month")!;

  return (
    <div className="ac">
      <div className="ac-head">
        <h1 className="ac-h1">Profile</h1>
        <span className="ac-sub">Your account, your plan and how HumanSoul behaves.</span>
      </div>

      <div className="ac-lay">
        <aside className="ac-me" aria-label="You">
          <span className="ac-av" aria-hidden="true">
            {initial}
          </span>
          <div>
            <div className="ac-me-n">{name}</div>
            <div className="ac-me-e">{email}</div>
          </div>
          <span className="ac-tag" style={{ alignSelf: "flex-start" }}>
            <Sparkles size={14} aria-hidden="true" />
            {planLabel}
          </span>
          <div className="ac-stats">
            <div className="ac-stat">
              <b>{reflections.length}</b>
              <span>Entries</span>
            </div>
            <div className="ac-stat">
              <b>{daysWritten}</b>
              <span>Days written</span>
            </div>
            <div className="ac-stat">
              <b>{journeysFinished}</b>
              <span>Journeys finished</span>
            </div>
          </div>
          {createdAt && (
            <span className="ac-since">
              Writing here since {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          )}
          <button type="button" className="ac-out" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </aside>

        <div className="ac-secs">
          <section className="ac-psec" aria-labelledby="p-acc">
            <div className="ac-psec-h">
              <div>
                <h2 id="p-acc" className="ac-h3">
                  Account
                </h2>
                <span className="ac-psec-n">How you appear, and the time your days follow.</span>
              </div>
              {dirty ? (
                <button type="button" className="ac-btn ac-btn-pri" onClick={saveAccount} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              ) : savedAt ? (
                <span className="ac-saved">
                  <Check className="ai" size={14} aria-hidden="true" />
                  Saved
                </span>
              ) : null}
            </div>
            <div className="ac-g2">
              <div className="ac-f">
                <label htmlFor="p-n">Name</label>
                <div className="ac-in">
                  <User className="ai" size={18} aria-hidden="true" />
                  <input id="p-n" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                </div>
              </div>
              <div className="ac-f">
                <label htmlFor="p-a">How we greet you</label>
                <div className="ac-in">
                  <Sparkles className="ai" size={18} aria-hidden="true" />
                  <input id="p-a" value={aliasDraft} placeholder={name.split(" ")[0]} onChange={(e) => setAliasDraft(e.target.value)} />
                </div>
                <span className="ac-hint">
                  Used on Home: “Good evening, {aliasDraft.trim() || name.split(" ")[0] || "friend"}”.
                </span>
              </div>
              <div className="ac-f">
                <label htmlFor="p-e">Email</label>
                <div className="ac-in">
                  <Mail className="ai" size={18} aria-hidden="true" />
                  <input id="p-e" value={email} readOnly />
                </div>
              </div>
              <div className="ac-f">
                <label htmlFor="p-t">Time zone</label>
                <div className="ac-in">
                  <Globe className="ai" size={18} aria-hidden="true" />
                  <select id="p-t" value={tzDraft} onChange={(e) => setTzDraft(e.target.value)}>
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="ac-hint">Your day starts and ends here, and reminders follow it.</span>
              </div>
            </div>
            {error && <p className="ac-err">{error}</p>}
          </section>

          <section className="ac-psec" aria-labelledby="p-plan">
            <h2 id="p-plan" className="ac-h3">
              Plan
            </h2>
            <div className="ac-pl">
              <div>
                <b>{planLabel}</b>
                <span>
                  {plus
                    ? `Every day of every journey, for ${yearly ? `${yearPlan.price} a year` : `${monthPlan.price} a month`}.`
                    : `Day one of every journey is free. Plus opens every day, for ${yearPlan.price} a year or ${monthPlan.price} a month.`}
                </span>
              </div>
              <Link className={`ac-btn ${plus ? "ac-btn-sec" : "ac-btn-pri"}`} href="/subscription">
                {plus ? "Manage" : "See Plus"}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="ac-psec" aria-labelledby="p-pw">
            <div className="ac-psec-h">
              <div>
                <h2 id="p-pw" className="ac-h3">
                  Password
                </h2>
                <span className="ac-psec-n">At least 8 characters. You stay signed in on this device.</span>
              </div>
              {pwDone ? (
                <span className="ac-saved" role="status">
                  <Check className="ai" size={14} aria-hidden="true" />
                  Password changed
                </span>
              ) : null}
            </div>
            <form className="ac-g2" onSubmit={changePassword}>
              <div className="ac-f">
                <label htmlFor="p-pw1">New password</label>
                <div className="ac-in">
                  <KeyRound className="ai" size={18} aria-hidden="true" />
                  <input
                    id="p-pw1"
                    type="password"
                    autoComplete="new-password"
                    value={pwNew}
                    onChange={(e) => {
                      setPwNew(e.target.value);
                      setPwDone(false);
                    }}
                  />
                </div>
              </div>
              <div className="ac-f">
                <label htmlFor="p-pw2">Repeat it</label>
                <div className="ac-in">
                  <KeyRound className="ai" size={18} aria-hidden="true" />
                  <input id="p-pw2" type="password" autoComplete="new-password" value={pwAgain} onChange={(e) => setPwAgain(e.target.value)} />
                </div>
              </div>
              <div className="ac-f" style={{ gridColumn: "1 / -1", flexDirection: "row", alignItems: "center", gap: 16 }}>
                <button type="submit" className="ac-btn ac-btn-sec" disabled={pwSaving || !pwNew || !pwAgain}>
                  {pwSaving ? "Changing…" : "Change password"}
                </button>
                {pwError ? <p className="ac-err">{pwError}</p> : null}
              </div>
            </form>
          </section>

          <section className="ac-psec" aria-labelledby="p-rem">
            <div>
              <h2 id="p-rem" className="ac-h3">
                Reminders
              </h2>
              <span className="ac-psec-n">Only what you turn on. Nothing else, ever.</span>
            </div>
            <div className="ac-rows">
              <div className="ac-row">
                <span className="ac-row-i">
                  <Bell size={18} aria-hidden="true" />
                </span>
                <div>
                  <div className="ac-row-t">A daily reminder to write</div>
                  <div className="ac-row-n">One quiet reminder a day. No streaks, no guilt.</div>
                </div>
                <button
                  type="button"
                  className="ac-sw"
                  role="switch"
                  aria-checked={reminderOn}
                  aria-label="Daily reminder"
                  onClick={() => savePreference({ reminder_hour: reminderOn ? null : "21:00" })}
                />
              </div>
              {reminderOn && (
                <div className="ac-times" role="radiogroup" aria-label="Reminder time">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="radio"
                      aria-checked={profile.reminder_hour === h}
                      onClick={() => savePreference({ reminder_hour: h })}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
              <div className="ac-row">
                <span className="ac-row-i">
                  <Compass size={18} aria-hidden="true" />
                </span>
                <div>
                  <div className="ac-row-t">New journeys</div>
                  <div className="ac-row-n">When a journey is added to the library.</div>
                </div>
                <button type="button" className="ac-sw" role="switch" aria-checked={pref("newJourneys")} aria-label="New journeys" onClick={() => togglePref("newJourneys")} />
              </div>
              <div className="ac-row">
                <span className="ac-row-i">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <div>
                  <div className="ac-row-t">Sunday recap by email</div>
                  <div className="ac-row-n">How many days you wrote and the journeys you&apos;re on. Never your words.</div>
                </div>
                <button type="button" className="ac-sw" role="switch" aria-checked={pref("weekly")} aria-label="Sunday recap" onClick={() => togglePref("weekly")} />
              </div>
            </div>
          </section>

          <section className="ac-psec" aria-labelledby="p-look">
            <h2 id="p-look" className="ac-h3">
              Appearance
            </h2>
            <div className="ac-themes" role="radiogroup" aria-label="Theme">
              {(
                [
                  ["system", "Same as device", Monitor],
                  ["light", "Light", Sun],
                  ["dark", "Dark", Moon],
                ] as const
              ).map(([key, label, Ic]) => (
                <button
                  key={key}
                  type="button"
                  className="ac-opt"
                  role="radio"
                  aria-checked={mounted && (theme ?? "system") === key}
                  onClick={() => setTheme(key)}
                >
                  <span className={`ac-opt-p${key === "system" ? "" : " one"}`} aria-hidden="true">
                    {key !== "dark" && (
                      <span className="l">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    {key !== "light" && (
                      <span className="d">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </span>
                  <span className="ac-opt-t">
                    <Ic size={16} aria-hidden="true" />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="ac-psec" aria-labelledby="p-data">
            <div>
              <h2 id="p-data" className="ac-h3">
                Your writing
              </h2>
              <span className="ac-psec-n">Private by default. Never shown to anyone, never used to train AI.</span>
            </div>
            <div className="ac-acts">
              <button type="button" className="ac-actrow" onClick={exportEverything}>
                <span className="ac-row-i">
                  <Download size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="ac-row-t" style={{ display: "block" }}>
                    Download everything
                  </span>
                  <span className="ac-row-n" style={{ display: "block" }}>
                    All {reflections.length} {reflections.length === 1 ? "entry" : "entries"}, with dates, journals and journey days, as one file.
                  </span>
                </span>
                <ChevronRight className="end" size={18} aria-hidden="true" />
              </button>
              <Link className="ac-actrow" href="/privacy">
                <span className="ac-row-i">
                  <Shield size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="ac-row-t" style={{ display: "block" }}>
                    Privacy
                  </span>
                  <span className="ac-row-n" style={{ display: "block" }}>
                    What we keep and what we never do with your writing.
                  </span>
                </span>
                <ChevronRight className="end" size={18} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="ac-psec" aria-labelledby="p-help">
            <div>
              <h2 id="p-help" className="ac-h3">
                If things feel heavy
              </h2>
              <span className="ac-psec-n">HumanSoul is a space to reflect. It is not therapy or medical care.</span>
            </div>
            <div className="ac-acts">
              <a className="ac-actrow" href="tel:988">
                <span className="ac-row-i">
                  <LifeBuoy size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="ac-row-t" style={{ display: "block" }}>
                    Call or text 988
                  </span>
                  <span className="ac-row-n" style={{ display: "block" }}>
                    The 988 Suicide &amp; Crisis Lifeline, free and open 24/7 in the US. Elsewhere, call your local emergency number.
                  </span>
                </span>
                <ChevronRight className="end" size={18} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="ac-danger" aria-labelledby="p-del">
            <div>
              <b id="p-del">Delete account</b>
              <span>Erases your account and everything you wrote. This can&apos;t be undone, so download first if you want a copy.</span>
            </div>
            {!deleteAsked ? (
              <button type="button" className="ac-btn ac-btn-dg" onClick={() => setDeleteAsked(true)}>
                <Trash2 size={16} aria-hidden="true" />
                Delete account
              </button>
            ) : (
              <span />
            )}
            {deleteAsked && (
              <div className="ac-confirm">
                <span className="ac-hint">
                  Type <b style={{ color: "var(--foreground)" }}>DELETE</b> to confirm.
                </span>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" />
                <button type="button" className="ac-btn ac-btn-dg" disabled={confirmText !== "DELETE" || deleting} onClick={handleDelete}>
                  {deleting ? "Deleting…" : "Delete for good"}
                </button>
                <button
                  type="button"
                  className="ac-btn ac-btn-ghost"
                  onClick={() => {
                    setDeleteAsked(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
