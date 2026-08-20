"use client";

import React, { useEffect, useState } from "react";
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
} from "@/components/auth-shell";

const IMAGE =
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1600&q=80";

type Stage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * The link in the email signs the person in with a short-lived recovery
   * session. Without it there is nothing to update, so the form only appears
   * once that session exists.
   */
  useEffect(() => {
    const supabase = createClient();

    // Supabase reports an expired or reused link in the URL fragment
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error")) {
      // The URL is only readable after mount, which is what this effect is for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("invalid");
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStage("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      setStage((current) => (data.session ? "ready" : current === "ready" ? current : "invalid"));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) return setError(updateError.message);

    setStage("done");
  };

  return (
    <AuthShell
      image={IMAGE}
      aside={
        <>
          <div className="text-[22px] leading-[1.55] font-medium text-[#f6f4ed]">
            “Everything you have written is still there, waiting.”
          </div>
          <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-white/70 mt-4">
            Choose a new password and carry on
          </div>
        </>
      }
    >
      {stage === "checking" && (
        <p className="text-sm text-[var(--ds-text-muted)]">Checking your link…</p>
      )}

      {stage === "invalid" && (
        <>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">
            This link has expired
          </h1>
          <p className="text-sm leading-[1.7] text-[var(--ds-text-muted)] m-0">
            Recovery links last an hour and can only be used once. Ask for a new one and it will
            work.
          </p>
          <Link href="/forgot-password" className={AUTH_SUBMIT}>
            Send me a new link
          </Link>
        </>
      )}

      {stage === "ready" && (
        <>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">
            Choose a new password
          </h1>
          <p className="text-sm text-[var(--ds-text-muted)] m-0">
            You will stay signed in on this device once it is saved.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className={AUTH_FIELD}>
              <span className={AUTH_LABEL}>NEW PASSWORD</span>
              <input
                type={show ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={AUTH_INPUT}
              />
            </label>

            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => setShow((v) => !v)} className={AUTH_SMALL_LINK}>
                {show ? "Hide password" : "Show password"}
              </button>
            </div>

            {error && (
              <div className="mt-4 px-3.5 py-3 rounded-[10px] border border-[var(--ds-danger)] text-[var(--ds-danger)] text-[12.5px]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={AUTH_SUBMIT}>
              {loading ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </>
      )}

      {stage === "done" && (
        <>
          <h1 className="text-[30px] font-semibold tracking-[-0.015em] m-0 mb-2">
            Your password is changed
          </h1>
          <p className="text-sm leading-[1.7] text-[var(--ds-text-muted)] m-0">
            Nothing else about your account or your journal has changed.
          </p>
          <button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className={AUTH_SUBMIT}
          >
            Go to your journal
          </button>
        </>
      )}
    </AuthShell>
  );
}
