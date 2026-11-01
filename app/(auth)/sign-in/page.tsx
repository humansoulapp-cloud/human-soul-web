"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthError, AuthShell, Field, PasswordInput, QUOTE_IMAGE, QuotePanel, TextInput } from "@/components/auth-shell";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Enter your email and password to continue.");

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    setLoading(false);
    if (signInError) {
      return setError(
        /invalid login credentials/i.test(signInError.message)
          ? "That email and password don't match. Check them and try again."
          : signInError.message
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell image={QUOTE_IMAGE} panel={<QuotePanel />}>
      <span className="au-over">Welcome back</span>
      <h1 className="au-h">Your journal is where you left it</h1>

      <form onSubmit={handleSignIn} noValidate>
        <div className="au-fields">
          <Field label="Email">
            <TextInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Password" action={<Link href="/forgot-password">Forgot password?</Link>}>
            <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          </Field>
        </div>

        <AuthError>{error}</AuthError>

        <button type="submit" disabled={loading} className="au-btn">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="au-alt">
        New to HumanSoul? <Link href="/sign-up">Create an account</Link>
      </p>
    </AuthShell>
  );
}
