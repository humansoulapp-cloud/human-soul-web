"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Lock } from "lucide-react";
import { AuthShell, BenefitsPanel, SIGN_UP_IMAGE } from "@/components/auth-shell";
import { startCheckout } from "@/lib/actions/billing";
import { track } from "@/lib/analytics";

const INCLUDED = [
  "Every guided journey, and new ones as they arrive",
  "A new day each morning, at your own pace",
  "Your private journal, searchable and exportable",
];

export default function JoinForm({
  price,
  left,
  nextPrice,
}: {
  price: string;
  left: number | null;
  nextPrice: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const pay = () =>
    start(async () => {
      setError("");
      track("checkout_started", { price });
      const res = await startCheckout();
      if (res && "error" in res) setError(res.error);
    });

  return (
    <AuthShell image={SIGN_UP_IMAGE} panel={<BenefitsPanel />}>
      <h1 className="au-h">
        {price} for your first year
      </h1>
      <p className="au-p">
        {left !== null && nextPrice ? (
          <>
            <b>{left} spots left</b> at this price.
            <br />
            After that, the first year is {nextPrice}.
          </>
        ) : (
          "Full access to HumanSoul for a year."
        )}
      </p>

      <ul className="au-inc">
        {INCLUDED.map((t) => (
          <li key={t}>
            <Check size={16} className="ai" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>

      {error && (
        <p className="au-err" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="au-btn" onClick={pay} disabled={pending}>
        {pending ? "Opening secure checkout…" : `Continue to payment`}
        {!pending && <ArrowRight size={16} aria-hidden="true" />}
      </button>

      <p className="au-alt au-secure">
        <Lock size={14} aria-hidden="true" />
        Paid securely with Stripe. Cancel anytime from your profile.
      </p>
    </AuthShell>
  );
}
