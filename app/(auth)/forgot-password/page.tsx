"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_FIELD,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_SUBMIT,
  AuthShell,
} from "@/components/auth-shell";

const IMAGE =
  "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1600&q=80";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <AuthShell
      image={IMAGE}
      aside={
        <>
          <div className="text-[22px] leading-[1.55] font-medium text-[#f6f4ed]">
            “Your journal is where you left it.”
          </div>
          <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-white/70 mt-4">
            Nothing you wrote is affected by this
          </div>
        </>
      }
    >
      {sent ? (
        <>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">Check your email</h1>
          <p className="text-sm leading-[1.7] text-[var(--ds-text-muted)] m-0">
            If there is an account for <strong>{email.trim()}</strong>, a link to choose a new
            password is on its way. It is valid for one hour.
          </p>
          <p className="text-[12.5px] text-[var(--ds-text-muted)] leading-[1.6] mt-5">
            Nothing arrived? Look in spam, or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-[var(--ds-accent)]"
            >
              try another address
            </button>
            .
          </p>
          <p className="text-[12.5px] text-[var(--ds-text-muted)] mt-4">
            <Link href="/sign-in">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">
            Forgot your password
          </h1>
          <p className="text-sm text-[var(--ds-text-muted)] m-0">
            Tell us your email and we will send you a link to choose a new one.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className={AUTH_FIELD}>
              <span className={AUTH_LABEL}>EMAIL</span>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={AUTH_INPUT}
              />
            </label>

            {error && (
              <div className="mt-4 px-3.5 py-3 rounded-[10px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[12.5px]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={AUTH_SUBMIT}>
              {loading ? "Sending…" : "Send the link"}
            </button>
          </form>

          <p className="text-[12.5px] text-[var(--ds-text-muted)] mt-4">
            Remembered it? <Link href="/sign-in">Sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
