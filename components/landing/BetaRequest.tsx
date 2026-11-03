"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { joinWaitlist } from "@/lib/actions/beta";

/**
 * "Request beta access" on the landing: just an email, straight onto the
 * waitlist (Admin → Beta). Invited people create their account at /sign-up.
 */
export default function BetaRequest() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) return setError("Enter a valid email address.");
    setSending(true);
    setError("");
    const res = await joinWaitlist(value).catch(() => ({ ok: false, error: "Couldn't send it right now. Try again in a moment." }));
    setSending(false);
    if (!res.ok) return setError(res.error ?? "Couldn't send it right now.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="breq-done" role="status">
        <CircleCheck size={20} aria-hidden="true" />
        <span>
          <b>Request received</b>
          We&apos;ll write to {email.trim()} if a place opens for you.
        </span>
      </div>
    );
  }

  return (
    <div className="breq">
      <form className="breq-f" onSubmit={submit} noValidate>
        <label className="hs-sr-only" htmlFor="breq-email">
          Email
        </label>
        <input
          id="breq-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn btn-pri" disabled={sending}>
          {sending ? "Sending…" : "Request beta access"}
          {!sending && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>
      {error ? <p className="breq-err">{error}</p> : null}
      <span className="breq-n">
        Limited to 30 participants · No payment required · Already invited? <Link href="/sign-up">Create your account</Link>
      </span>
    </div>
  );
}
