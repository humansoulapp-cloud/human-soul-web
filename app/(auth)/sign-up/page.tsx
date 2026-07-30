"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Please enter an email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      // Immediate login if email confirmation is disabled
      router.push("/onboarding");
      router.refresh();
    } else {
      setInfoMsg("Account created. Please check your email to confirm your registration.");
    }
  };

  return (
    <AuthShell
      title="Begin Your Space"
      subtitle="A quiet, private place to notice yourself."
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-[#D4A3A3]/20 border border-[#D4A3A3] text-[var(--text-primary)] text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-[#A3B8A7]/20 border border-[#A3B8A7] text-[var(--text-primary)] text-xs rounded-xl">
            {infoMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>

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
            placeholder="At least 6 characters"
            className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 mt-2"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div className="flex justify-center items-center gap-1.5 pt-4 text-xs text-[var(--text-secondary)]">
          <span>Already have an account?</span>
          <Link
            href="/sign-in"
            className="font-medium text-[var(--brand-primary)] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
