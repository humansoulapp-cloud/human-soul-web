"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthError, AuthShell, Field, PasswordInput, QUOTE_IMAGE, QuotePanel, Strength } from "@/components/auth-shell";

type Stage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
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

  const goHome = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell image={QUOTE_IMAGE} banner="Everything you wrote is still there" panel={<QuotePanel />}>
      {stage === "checking" && <p className="au-muted">Checking your link…</p>}

      {stage === "invalid" && (
        <>
          <span className="au-over">Password reset</span>
          <h1 className="au-h">This link has expired</h1>
          <p className="au-p">Recovery links last an hour and can only be used once. Ask for a new one and it will work.</p>
          <div className="au-box soft">
            <Clock size={20} className="ai" aria-hidden="true" />
            <div>
              <b>Nothing has changed</b>
              Your account and your journal are exactly as you left them.
            </div>
          </div>
          <Link href="/forgot-password" className="au-btn">
            Send me a new link
          </Link>
        </>
      )}

      {stage === "ready" && (
        <>
          <span className="au-over">Almost there</span>
          <h1 className="au-h">Choose a new password</h1>
          <p className="au-p">Use at least 8 characters. Once it&apos;s saved you&apos;ll go straight to your journal.</p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="au-fields">
              <Field label="New password" hint={<Strength password={password} />}>
                <PasswordInput autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </Field>
            </div>
            <AuthError>{error}</AuthError>
            <button type="submit" disabled={loading} className="au-btn">
              {loading ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </>
      )}

      {stage === "done" && (
        <>
          <span className="au-over">All set</span>
          <h1 className="au-h">Your password is changed</h1>
          <p className="au-p">Nothing else about your account or your journal has changed.</p>
          <button type="button" onClick={goHome} className="au-btn">
            Go to your journal
          </button>
        </>
      )}
    </AuthShell>
  );
}
