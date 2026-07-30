"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to return to your personal space."
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-[#D4A3A3]/20 border border-[#D4A3A3] text-[var(--text-primary)] text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="flex justify-center items-center gap-1.5 pt-4 text-xs text-[var(--text-secondary)]">
          <span>Don't have an account?</span>
          <Link
            href="/sign-up"
            className="font-medium text-[var(--brand-primary)] hover:underline"
          >
            Create one
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
