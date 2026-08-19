"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_FIELD,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_SMALL_LINK,
  AUTH_SUBMIT,
  AuthShell,
  SocialButtons,
} from "@/components/auth-shell";

const IMAGE =
  "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1600&q=80";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (signInError) return setError(signInError.message);

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      image={IMAGE}
      aside={
        <>
          <div className="text-[22px] leading-[1.55] font-medium text-[#f6f4ed]">
            “Most of life unfolds in ordinary moments that rarely seem important while they are
            happening.”
          </div>
          <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-white/70 mt-4">
            From Becoming More Human, day one
          </div>
        </>
      }
    >
      <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">Welcome back</h1>
      <p className="text-sm text-[var(--ds-text-muted)] m-0">Your journal is where you left it.</p>

      <SocialButtons verb="Continue" />

      <form onSubmit={handleSignIn}>
        <div className="flex flex-col gap-3">
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
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={AUTH_INPUT}
            />
          </label>

          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] text-[var(--ds-text-muted)]">
              Signed in until you sign out.
            </span>
            <span className="flex-1" />
            <button type="button" onClick={() => setShow((v) => !v)} className={AUTH_SMALL_LINK}>
              {show ? "Hide password" : "Show password"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3.5 py-3 rounded-[10px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[12.5px]">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className={AUTH_SUBMIT}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-[12.5px] text-[var(--ds-text-muted)] leading-[1.6] mt-4">
        New here? <Link href="/sign-up">Create an account</Link>.
      </p>
    </AuthShell>
  );
}
