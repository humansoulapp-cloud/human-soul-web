"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck, Clock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkSignupAllowed, joinWaitlist } from "@/lib/actions/beta";
import {
  AuthError,
  AuthShell,
  BenefitsPanel,
  Checkbox,
  Field,
  PasswordInput,
  SIGN_UP_IMAGE,
  Strength,
  TextInput,
} from "@/components/auth-shell";
import { track } from "@/lib/analytics";
import { PAYWALL } from "@/lib/plans";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /* Set when the account exists but the email still has to be confirmed. */
  const [confirm, setConfirm] = useState(false);
  /* Set when the beta is invite-only and this email can't join yet. */
  const [closed, setClosed] = useState<null | "not_invited" | "full">(null);
  const [waitlisted, setWaitlisted] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (!terms) return setError("Accept the Terms and the Privacy Policy to continue.");

    setLoading(true);
    setError("");

    // Paid launch: anyone can create an account; access opens after payment (/join).
    const gate = PAYWALL ? ({ ok: true } as const) : await checkSignupAllowed(email).catch(() => ({ ok: true as const }));
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

    track("signed_up", { confirmed_now: Boolean(data.session) });
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setConfirm(true);
    }
  };

  return (
    <AuthShell image={SIGN_UP_IMAGE} panel={<BenefitsPanel />}>
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
      ) : confirm ? (
        <>
          <span className="au-over">
            <Mail size={14} aria-hidden="true" />
            One last step
          </span>
          <h1 className="au-h">Check your email</h1>
          <p className="au-p">
            We sent a link to <b>{email.trim()}</b>. Open it to confirm your account and we&apos;ll take you to your first journey.
          </p>
          <div className="au-box">
            <Clock size={20} className="ai" aria-hidden="true" />
            <div>
              <b>It should arrive in a minute</b>
              If you don&apos;t see it, look in spam or promotions.
            </div>
          </div>
          <p className="au-alt">
            Wrong email?{" "}
            <button type="button" onClick={() => setConfirm(false)}>
              Use another one
            </button>
          </p>
        </>
      ) : (
        <>
          <span className="au-over">Join HumanSoul</span>
          <h1 className="au-h">Create your account</h1>
          <p className="au-p">It takes a minute. Then we&apos;ll help you choose where to begin.</p>

          <form onSubmit={handleSignUp} noValidate>
            <div className="au-fields">
              <Field label="What should we call you?">
                <TextInput autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
              </Field>
              <Field label="Email">
                <TextInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Field label="Password" hint={<Strength password={password} />}>
                <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </Field>
              <div className="au-terms">
                <Checkbox checked={terms} onChange={setTerms} label="I agree to the Terms and the Privacy Policy" />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank">
                    Terms
                  </Link>{" "}
                  and the{" "}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                  . What I write stays private and is never used to train AI.
                </span>
              </div>
            </div>

            <AuthError>{error}</AuthError>

            <button type="submit" disabled={loading} className="au-btn">
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>

          <p className="au-alt">
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </p>
        </>
      )}
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
      <button type="button" className="au-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </button>
      <span className="au-over">Private beta</span>
      <h1 className="au-h">{reason === "full" ? "The beta is full, for now" : "HumanSoul is invite only, for now"}</h1>
      <p className="au-p">
        {reason === "full"
          ? "Every beta place is taken. Leave your email and we'll write when HumanSoul opens to everyone."
          : "Only invited people can create an account right now. If you were invited, use the exact email the invitation was sent to."}
      </p>

      {waitlisted ? (
        <div className="au-box">
          <CircleCheck size={20} className="ai" aria-hidden="true" />
          <div>
            <b>You&apos;re on the list</b>
            We&apos;ll write to {email.trim()} when there&apos;s a place for you.
          </div>
        </div>
      ) : (
        <>
          <div className="au-fields">
            <Field label="Email">
              <TextInput type="email" value={email.trim()} readOnly />
            </Field>
          </div>
          <button type="button" onClick={join} disabled={sending} className="au-btn">
            {sending ? "Adding you…" : "Join the waitlist"}
          </button>
          <div className="au-box soft">
            <Clock size={18} className="ai" aria-hidden="true" />
            <div>
              <b>No spam, one email</b>
              We&apos;ll write once, when there&apos;s a place for you.
            </div>
          </div>
        </>
      )}
      <AuthError>{error}</AuthError>

      <p className="au-alt">
        Have an invite?{" "}
        <button type="button" onClick={onBack}>
          Try another email
        </button>
      </p>
    </div>
  );
}
