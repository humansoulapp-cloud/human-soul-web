"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { sendFeedback, type FeedbackKind } from "@/lib/actions/feedback";
import "../../account.css";

const KINDS: [FeedbackKind, string][] = [
  ["problem", "Something didn't work"],
  ["idea", "An idea"],
  ["feeling", "How it feels"],
];

const PLACEHOLDER: Record<FeedbackKind, string> = {
  problem: "What did you do, what did you expect, and what happened instead?",
  idea: "What would make HumanSoul more useful for you?",
  feeling: "What felt good, and what felt off?",
};

export default function FeedbackPage() {
  const pathname = usePathname();
  const [kind, setKind] = useState<FeedbackKind>("problem");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    let page = pathname;
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) page = new URL(document.referrer).pathname;
    } catch {
      /* keep the current page */
    }
    const res = await sendFeedback({ kind, message, page }).catch(() => ({ ok: false, error: "Couldn't send it right now. Try again in a moment." }));
    setSending(false);
    if (!res.ok) return setError(res.error ?? "Couldn't send it right now.");
    setSent(true);
    setMessage("");
  };

  return (
    <div className="ac">
      <header className="hs-phead">
        <div className="hs-phead-t">
          <h1 className="text-h1">Feedback</h1>
          <p className="hs-phead-sub">You&apos;re one of the first people here. Tell us what works, what breaks and how it feels.</p>
        </div>
      </header>

      <div className="fb-lay">
        <section className="ac-psec" aria-labelledby="fb-h">
          {sent ? (
            <div className="fb-done" role="status">
              <CircleCheck size={22} aria-hidden="true" />
              <div>
                <b id="fb-h">Thank you, it&apos;s on its way</b>
                <span>We read every message. If we have a question, we&apos;ll reply to your email.</span>
              </div>
              <button type="button" className="ac-btn ac-btn-sec" onClick={() => setSent(false)}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="fb-form">
              <div>
                <h2 id="fb-h" className="ac-h3">
                  Send feedback
                </h2>
                <span className="ac-psec-n">It goes straight to the team. Replies come to your email.</span>
              </div>
              <div className="ac-seg fb-kinds" role="radiogroup" aria-label="What is it about?">
                {KINDS.map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={kind === k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                    {label}
                  </button>
                ))}
              </div>
              <label className="hs-sr-only" htmlFor="fb-msg">
                Your message
              </label>
              <textarea
                id="fb-msg"
                className="fb-msg"
                rows={7}
                maxLength={5000}
                value={message}
                placeholder={PLACEHOLDER[kind]}
                onChange={(e) => setMessage(e.target.value)}
              />
              {error ? <p className="ac-err">{error}</p> : null}
              <div className="fb-foot">
                <button type="submit" className="ac-btn ac-btn-pri" disabled={sending || message.trim().length < 3}>
                  {sending ? "Sending…" : "Send"}
                </button>
                <span className="ac-psec-n" style={{ margin: 0 }}>
                  A screenshot helps: reply to our email and attach it.
                </span>
              </div>
            </form>
          )}
        </section>

      </div>
    </div>
  );
}
