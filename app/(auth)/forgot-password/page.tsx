"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, KeyRound, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthError, AuthShell, Field, QUOTE_IMAGE, QuotePanel, TextInput } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!email.trim()) return setError("Enter the email you signed up with.");

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) return setError(resetError.message);

    // Always the same answer, so the page cannot be used to find out
    // which addresses have an account.
    setSent(true);
  };

  return (
    <AuthShell image={QUOTE_IMAGE} panel={<QuotePanel />}>
      {sent ? (
        <>
          <span className="au-over">
            <Mail size={14} aria-hidden="true" />
            Link sent
          </span>
          <h1 className="au-h">Check your email</h1>
          <p className="au-p">
            If there is an account for <b>{email.trim()}</b>, a link to choose a new password is on its way. Open it on this device to continue.
          </p>
          <div className="au-box">
            <Clock size={20} className="ai" aria-hidden="true" />
            <div>
              <b>The link works for one hour</b>
              If you don&apos;t see it, look in spam or promotions.
            </div>
          </div>
          <button type="button" className="au-btn sec" disabled={loading} onClick={send}>
            {loading ? "Sending…" : "Resend the email"}
          </button>
          <AuthError>{error}</AuthError>
          <p className="au-alt">
            Wrong email?{" "}
            <button type="button" onClick={() => setSent(false)}>
              Use another one
            </button>
          </p>
        </>
      ) : (
        <>
          <Link href="/sign-in" className="au-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to sign in
          </Link>
          <span className="au-over">
            <KeyRound size={14} aria-hidden="true" />
            Password reset
          </span>
          <h1 className="au-h">Forgot your password?</h1>
          <p className="au-p">Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            noValidate
          >
            <div className="au-fields">
              <Field label="Email">
                <TextInput type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
            </div>
            <AuthError>{error}</AuthError>
            <button type="submit" disabled={loading} className="au-btn">
              {loading ? "Sending…" : "Send the link"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
