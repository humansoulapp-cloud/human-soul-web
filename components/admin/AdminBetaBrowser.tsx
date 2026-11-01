"use client";

import { askConfirm } from "@/components/dialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Copy, MailPlus, Trash2, UserPlus } from "lucide-react";
import {
  extendAccess,
  inviteToBeta,
  removeInvite,
  updateBetaSettings,
  type BetaInvite,
  type BetaSettings,
  type WaitlistEntry,
} from "@/lib/actions/beta";

const DAY = 86_400_000;

function shortDate(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

function daysLeft(iso: string | null) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));
}

type Status = "waiting" | "active" | "ended";

function statusOf(i: BetaInvite): Status {
  if (!i.joined_at) return "waiting";
  return daysLeft(i.access_until) > 0 ? "active" : "ended";
}

export default function AdminBetaBrowser({
  settings,
  invites,
  waitlist,
}: {
  settings: BetaSettings;
  invites: BetaInvite[];
  waitlist: WaitlistEntry[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ text: string; err?: boolean } | null>(null);
  const [emails, setEmails] = useState("");
  const [note, setNote] = useState("");
  const [maxUsers, setMaxUsers] = useState(String(settings.max_users));
  const [accessDays, setAccessDays] = useState(String(settings.access_days));
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const joined = invites.filter((i) => i.joined_at).length;
  const waiting = invites.filter((i) => !i.joined_at).length;
  const endingSoon = invites.filter((i) => statusOf(i) === "active" && daysLeft(i.access_until) <= 14).length;
  const placesLeft = Math.max(0, settings.max_users - joined);

  const sorted = useMemo(() => {
    const order: Record<Status, number> = { active: 0, waiting: 1, ended: 2 };
    return [...invites].sort(
      (a, b) =>
        order[statusOf(a)] - order[statusOf(b)] ||
        (a.access_until ?? a.invited_at).localeCompare(b.access_until ?? b.invited_at)
    );
  }, [invites]);

  /* Only called from a click, so window is always there. */
  const message = (email: string) =>
    `You're invited to the HumanSoul beta.\n\nCreate your account at ${window.location.origin}/sign-up with this email address: ${email}\n\nYou'll have ${settings.access_days} days of full access, free. Everything you write is private to you.`;

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ text: done });
    } catch {
      setNotice({ text: "Couldn't copy. Select the text and copy it by hand.", err: true });
    }
  };

  const run = (task: () => Promise<{ error?: string } | void>, done: string) =>
    start(async () => {
      const res = await task();
      if (res && res.error) return setNotice({ text: res.error, err: true });
      setNotice({ text: done });
      router.refresh();
    });

  const invite = (raw: string, clear = true) =>
    start(async () => {
      const res = await inviteToBeta(raw, note);
      if (res.error) return setNotice({ text: res.error, err: true });
      const skipped = res.skipped.length ? ` Skipped: ${res.skipped.join(", ")}.` : "";
      setNotice({ text: `${res.added} ${res.added === 1 ? "person" : "people"} invited.${skipped}`, err: res.added === 0 });
      if (clear && res.added) {
        setEmails("");
        setNote("");
      }
      router.refresh();
    });

  const saveNumbers = () => {
    const m = Number(maxUsers);
    const d = Number(accessDays);
    run(() => updateBetaSettings({ max_users: m, access_days: d }), "Beta settings saved.");
  };

  const numbersChanged = maxUsers !== String(settings.max_users) || accessDays !== String(settings.access_days);

  return (
    <>
      <div className="hsa-head">
        <div className="hsa-head-t">
          <h1 className="text-h1" style={{ margin: 0 }}>
            Beta
          </h1>
          <span className="hs-hint">
            {joined} of {settings.max_users} places used · {settings.access_days} days of full access each ·{" "}
            {settings.invite_only ? "sign-up is invite only" : "sign-up is open to everyone"}
          </span>
        </div>
      </div>

      <div className="hsa-kpis">
        <div className="hsa-card hsa-kpi">
          <span className="hsa-kpi-l">Joined</span>
          <b>{joined}</b>
          <small>{placesLeft} {placesLeft === 1 ? "place" : "places"} left</small>
        </div>
        <div className="hsa-card hsa-kpi">
          <span className="hsa-kpi-l">Invited, not joined yet</span>
          <b>{waiting}</b>
          <small>{waiting ? "Send them the invite message" : "Everyone invited has joined"}</small>
        </div>
        <div className="hsa-card hsa-kpi">
          <span className="hsa-kpi-l">Access ending soon</span>
          <b>{endingSoon}</b>
          <small>In the next 14 days</small>
        </div>
        <div className="hsa-card hsa-kpi">
          <span className="hsa-kpi-l">Waitlist</span>
          <b>{waitlist.length}</b>
          <small>{waitlist.length ? "Waiting for an invite" : "Nobody yet"}</small>
        </div>
      </div>

      {notice ? (
        <div className={`hsa-banner ${notice.err ? "err" : "ok"} hsa-u-notice`} role="status">
          {notice.text}
        </div>
      ) : null}

      <div className="hsa-beta-top">
        <section className="hsa-card hsa-pad" aria-labelledby="beta-invite">
          <div className="hsa-card-h">
            <h2 id="beta-invite" className="hsa-card-t" style={{ margin: 0 }}>
              Invite people
            </h2>
            <span className="hsa-card-n">One or more emails</span>
          </div>
          <form
            className="hsa-beta-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (emails.trim()) invite(emails);
            }}
          >
            <label className="hs-field">
              <span className="sr-only">Emails</span>
              <textarea
                className="hs-control hsa-beta-emails"
                rows={3}
                placeholder={"ana@example.com, leo@example.com"}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </label>
            <label className="hs-field">
              <span className="hs-label">
                Note <span className="hs-label-opt">(only you see it)</span>
              </span>
              <input className="hs-control" placeholder="e.g. Journaling group" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="hsa-beta-actions">
              <button type="submit" className="hs-btn hs-btn-default" disabled={pending || !emails.trim()}>
                <UserPlus size={16} aria-hidden="true" />
                Invite
              </button>
              <span className="hs-hint">
                Then send each person the invite message. If they already have an account, their {settings.access_days} days start now.
              </span>
            </div>
          </form>
        </section>

        <section className="hsa-card hsa-pad" aria-labelledby="beta-settings">
          <div className="hsa-card-h">
            <h2 id="beta-settings" className="hsa-card-t" style={{ margin: 0 }}>
              Sign-up
            </h2>
          </div>
          <label className="hs-check hsa-beta-switch">
            <input
              type="checkbox"
              checked={settings.invite_only}
              disabled={pending}
              onChange={(e) =>
                run(
                  () => updateBetaSettings({ invite_only: e.target.checked }),
                  e.target.checked ? "Sign-up is invite only again." : "Sign-up is now open to everyone."
                )
              }
            />
            <span className="hs-switch" aria-hidden="true" />
            <span>
              Invite only
              <small className="hsa-soft" style={{ display: "block" }}>
                Turn off for the public launch. Invites keep their days.
              </small>
            </span>
          </label>
          <div className="hsa-beta-nums">
            <label className="hs-field">
              <span className="hs-label">Places</span>
              <input className="hs-control" type="number" min={0} inputMode="numeric" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
            </label>
            <label className="hs-field">
              <span className="hs-label">Days of access</span>
              <input className="hs-control" type="number" min={1} max={365} inputMode="numeric" value={accessDays} onChange={(e) => setAccessDays(e.target.value)} />
            </label>
          </div>
          <div className="hsa-beta-actions">
            <button type="button" className="hs-btn hs-btn-secondary" disabled={pending || !numbersChanged} onClick={saveNumbers}>
              Save
            </button>
            <span className="hs-hint">New days apply to people who join from now on.</span>
          </div>
        </section>
      </div>

      <section className="hsa-card hsa-list" aria-label="Invites">
        <div className="hsa-beta-cols">
          <span>Email</span>
          <span>Status</span>
          <span>Access until</span>
          <span />
        </div>
        {sorted.length === 0 ? (
          <div className="hsa-empty">No invites yet. Add the first emails above.</div>
        ) : (
          <ul className="hsa-rows">
            {sorted.map((i) => {
              const status = statusOf(i);
              const left = daysLeft(i.access_until);
              return (
                <li key={i.id} className={`hsa-beta-row${status === "ended" ? " off" : ""}`}>
                  <span className="hsa-r-txt">
                    <span className="hsa-u-n">
                      <span className="t">{i.email}</span>
                    </span>
                    <span className="hsa-u-e">
                      Invited {shortDate(i.invited_at)}
                      {i.note ? ` · ${i.note}` : ""}
                    </span>
                  </span>
                  <span className={`hsa-plan${status === "active" ? " plus" : ""}`}>
                    {status === "waiting" ? "Not joined yet" : status === "active" ? `Joined ${shortDate(i.joined_at!)}` : "Ended"}
                  </span>
                  <span className="hsa-u-soft">
                    {i.access_until ? `${shortDate(i.access_until)}${status === "active" ? ` · ${left} d left` : ""}` : "Starts when they join"}
                  </span>
                  <span className="hsa-beta-btns">
                    {status === "waiting" ? (
                      <button
                        type="button"
                        className="hsa-icon-btn"
                        title="Copy invite message"
                        aria-label={`Copy invite message for ${i.email}`}
                        onClick={() => copy(message(i.email), `Invite message for ${i.email} copied.`)}
                      >
                        <Copy size={17} aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="hsa-icon-btn"
                        title="Add 30 days"
                        aria-label={`Add 30 days for ${i.email}`}
                        disabled={pending}
                        onClick={() => run(() => extendAccess(i.id, 30), `${i.email} has 30 more days.`)}
                      >
                        <CalendarPlus size={17} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="hsa-icon-btn"
                      title={i.joined_at ? "Remove (their beta access ends now)" : "Remove invite"}
                      aria-label={`Remove ${i.email}`}
                      disabled={pending}
                      onClick={async () => {
                        const ok = await askConfirm({
                          title: i.joined_at ? `Remove ${i.email}?` : "Remove this invite?",
                          body: i.joined_at
                            ? "Their beta access ends now. Their account and writing stay."
                            : `${i.email} won't be able to create an account with this invite.`,
                          confirm: "Remove",
                          tone: "danger",
                        });
                        if (ok) run(() => removeInvite(i.id), `${i.email} removed.`);
                      }}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="hsa-card hsa-list" aria-labelledby="beta-wait" style={{ marginTop: 24 }}>
        <div className="hsa-beta-cols">
          <span id="beta-wait">Waitlist</span>
          <span>Joined the list</span>
          <span />
          <span />
        </div>
        {waitlist.length === 0 ? (
          <div className="hsa-empty">Nobody on the waitlist yet. People without an invite can join it from the sign-up page.</div>
        ) : (
          <ul className="hsa-rows">
            {waitlist.map((w) => (
              <li key={w.id} className="hsa-beta-row">
                <span className="hsa-r-txt">
                  <span className="hsa-u-n">
                    <span className="t">{w.email}</span>
                  </span>
                </span>
                <span className="hsa-u-soft">{shortDate(w.created_at)}</span>
                <span />
                <span className="hsa-beta-btns">
                  <button
                    type="button"
                    className="hsa-icon-btn"
                    title="Invite"
                    aria-label={`Invite ${w.email}`}
                    disabled={pending}
                    onClick={() => invite(w.email, false)}
                  >
                    <MailPlus size={17} aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="hsa-foot">
        <span>Access ends quietly: the journal stays, Plus journeys lock after Day 1.</span>
      </div>
    </>
  );
}
