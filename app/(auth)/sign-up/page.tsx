"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkSignupAllowed, joinWaitlist } from "@/lib/actions/beta";
import {
  AUTH_FIELD,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_SUBMIT,
  AuthShell,
  SocialButtons,
} from "@/components/auth-shell";

const IMAGE =
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1600&q=80";

const PERKS = [
  "A question each morning, one day at a time",
  "Guided journeys you move through at your own pace",
  "Your full journal history, kept and searchable",
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  /* Set when the beta is invite-only and this email can't join yet. */
  const [closed, setClosed] = useState<null | "not_invited" | "full">(null);
  const [waitlisted, setWaitlisted] = useState(false);

  const level = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strength = ["", "Too short", "Fine", "Strong"][level];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (!terms) return setError("Accept the terms to continue.");

    setLoading(true);
    setError("");

    const gate = await checkSignupAllowed(email).catch(() => ({ ok: true as const }));
    if (!gate.ok) {
      setLoading(false);
      return setClosed(gate.reason);
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    setLoading(false);
    if (signUpError) {
      // The database refuses accounts without an invite (see the beta migration).
      if (/invite-only|beta is full|database error saving new user/i.test(signUpError.message)) {
        return setClosed(/full/i.test(signUpError.message) ? "full" : "not_invited");
      }
      return setError(signUpError.message);
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setInfo("Account created. Check your email to confirm your registration.");
    }
  };

  return (
    <AuthShell
      image={IMAGE}
      aside={
        <>
          <div className="flex flex-col gap-3.5">
            {PERKS.map((text) => (
              <div
                key={text}
                className="flex items-start gap-3 text-[17px] leading-[1.5] text-[#f6f4ed]"
              >
                <span className="text-[#cfe0c9] font-bold flex-shrink-0">✓</span>
                {text}
              </div>
            ))}
          </div>
          <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-white/70 mt-6">
            Guided journeys · new ones each month
          </div>
        </>
      }
    >
      {closed ? (
        <BetaClosed
          reason={closed}
          email={email}
          waitlisted={waitlisted}
          onJoined={() => setWaitlisted(true)}
          onBack={() => {
            setClosed(null);
            setWaitlisted(false);
          }}
        />
      ) : (
      <>
      <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">Create your account</h1>
      <p className="text-sm text-[var(--ds-text-muted)] m-0">
        Start today&apos;s reflection in about a minute.
      </p>

      <SocialButtons verb="Sign up" />

      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-3">
          <label className={AUTH_FIELD}>
            <span className={AUTH_LABEL}>NAME</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How you want to be greeted"
              className={AUTH_INPUT}
            />
          </label>

          <label className={AUTH_FIELD}>
            <span className={AUTH_LABEL}>EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={AUTH_INPUT}
            />
          </label>

          <label className={AUTH_FIELD}>
            <span className={AUTH_LABEL}>PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={AUTH_INPUT}
            />
            <span className="flex items-center gap-2 mt-0.5">
              <span className="flex-1 h-1 rounded-full bg-[var(--ds-line)] block overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-all ${
                    level < 2 ? "bg-[var(--ds-gold)]" : "bg-[var(--ds-accent)]"
                  }`}
                  style={{ width: `${level * 33}%` }}
                />
              </span>
              <span className="text-[11px] text-[var(--ds-text-muted)] w-16 text-right">
                {strength}
              </span>
            </span>
          </label>

          <div className="flex items-start gap-2.5 mt-0.5">
            <button
              type="button"
              onClick={() => setTerms((v) => !v)}
              aria-pressed={terms}
              className={`w-[19px] h-[19px] flex-shrink-0 mt-0.5 rounded-md grid place-items-center text-[11px] font-bold border ${
                terms
                  ? "border-[var(--ds-accent)] bg-[var(--ds-accent)] text-[var(--ds-on-accent)]"
                  : "border-[var(--ds-line-strong)]"
              }`}
            >
              {terms ? "✓" : ""}
            </button>
            <span className="text-xs leading-[1.55] text-[var(--ds-text-muted)]">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-[var(--ds-text)]">
                Terms
              </Link>{" "}
              and the{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-[var(--ds-text)]">
                Privacy Policy
              </Link>
              . Entries are private and never used to train anything.
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3.5 py-3 rounded-[10px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[12.5px]">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-4 px-3.5 py-3 rounded-[10px] bg-[var(--ds-accent-soft)] text-[var(--ds-text-mid)] text-[12.5px]">
            {info}
          </div>
        )}

        <button type="submit" disabled={loading} className={AUTH_SUBMIT}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      </>
      )}

      <p className="text-[12.5px] text-[var(--ds-text-muted)] mt-[18px]">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
}

/* Shown instead of the form while HumanSoul is invite-only and this email has no invite. */
function BetaClosed({
  reason,
  email,
  waitlisted,
  onJoined,
  onBack,
}: {
  reason: "not_invited" | "full";
  email: string;
  waitlisted: boolean;
  onJoined: () => void;
  onBack: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const join = async () => {
    setSending(true);
    setError("");
    const res = await joinWaitlist(email).catch(() => ({ ok: false, error: "Couldn't add you right now. Try again in a moment." }));
    setSending(false);
    if (!res.ok) return setError(res.error ?? "Couldn't add you right now.");
    onJoined();
  };

  return (
    <div role="status">
      <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">
        {reason === "full" ? "The beta is full" : "HumanSoul is in private beta"}
      </h1>
      <p className="text-sm leading-[1.6] text-[var(--ds-text-muted)] m-0">
        {reason === "full"
          ? "Every beta place is taken for now. Leave your email and we'll write when HumanSoul opens to everyone."
          : <>Right now only invited people can create an account. If you were invited, use the exact email the invitation was sent to. Otherwise, join the waitlist and we&apos;ll write when there&apos;s a place for you.</>}
      </p>

      {waitlisted ? (
        <div className="mt-5 px-3.5 py-3 rounded-[10px] bg-[var(--ds-accent-soft)] text-[var(--ds-text-mid)] text-[13px]">
          You&apos;re on the list. We&apos;ll write to <b>{email.trim()}</b>.
        </div>
      ) : (
        <button type="button" onClick={join} disabled={sending} className={AUTH_SUBMIT}>
          {sending ? "Adding you…" : `Join the waitlist with ${email.trim()}`}
        </button>
      )}
      {error && (
        <div className="mt-4 px-3.5 py-3 rounded-[10px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[12.5px]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-[12.5px] text-[var(--ds-text-muted)] underline underline-offset-2 hover:text-[var(--ds-text)] bg-transparent border-0 p-0 cursor-pointer"
      >
        Use a different email
      </button>
    </div>
  );
}
