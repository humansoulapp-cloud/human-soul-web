"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { AuthShell, BenefitsPanel, SIGN_UP_IMAGE } from "@/components/auth-shell";
import { createEmbeddedCheckout, startCheckout } from "@/lib/actions/billing";
import { track } from "@/lib/analytics";

const INCLUDED = [
  "Every guided journey, and new ones as they arrive",
  "A new day each morning, at your own pace",
  "Your private journal, searchable and exportable",
];

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

type EmbeddedCheckout = { mount: (el: HTMLElement) => void; destroy: () => void };
type StripeJs = { initEmbeddedCheckout: (o: { fetchClientSecret: () => Promise<string> }) => Promise<EmbeddedCheckout> };
declare global {
  interface Window {
    Stripe?: (key: string) => StripeJs;
  }
}

/** Stripe.js from Stripe's own servers (required by Stripe; not bundled). */
function loadStripe(): Promise<NonNullable<Window["Stripe"]>> {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe didn't load")));
    s.onerror = () => reject(new Error("Stripe didn't load"));
    document.head.appendChild(s);
  });
}

export default function JoinForm({ price, left, nextPrice }: { price: string; left: number | null; nextPrice: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<EmbeddedCheckout | null>(null);

  // Mount Stripe's form inside the page once the payment step is shown.
  useEffect(() => {
    if (!paying || !PK || !mountRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const Stripe = await loadStripe();
        const checkout = await Stripe(PK).initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const res = await createEmbeddedCheckout();
            if ("error" in res) throw new Error(res.error);
            return res.clientSecret;
          },
        });
        if (cancelled) return checkout.destroy();
        checkoutRef.current = checkout;
        checkout.mount(mountRef.current!);
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Checkout couldn't open. Please try again.");
        setPaying(false);
      }
    })();
    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
      setReady(false);
    };
  }, [paying]);

  const pay = () => {
    setError("");
    track("checkout_started", { price, embedded: Boolean(PK) });
    if (PK) return setPaying(true);
    start(async () => {
      const res = await startCheckout();
      if (res && "error" in res) setError(res.error);
    });
  };

  return (
    <AuthShell image={SIGN_UP_IMAGE} panel={<BenefitsPanel />}>
      {paying ? (
        <div className="au-pay">
          <button type="button" className="au-back" onClick={() => setPaying(false)}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          <h1 className="au-h au-pay-h">{price} for your first year</h1>
          {!ready && <p className="au-p">Opening secure checkout…</p>}
          <div ref={mountRef} className="au-pay-frame" />
          <p className="au-alt au-secure">
            <Lock size={14} aria-hidden="true" />
            Paid securely with Stripe. Cancel anytime from your profile.
          </p>
        </div>
      ) : (
        <>
          <h1 className="au-h">{price} for your first year</h1>
          <p className="au-p">
            {left !== null ? (
              <>
                <b>{left} spots left</b> at this price.
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
            {pending ? "Opening secure checkout…" : "Continue to payment"}
            {!pending && <ArrowRight size={16} aria-hidden="true" />}
          </button>

          {left !== null && nextPrice && <p className="au-next">After that, the first year is {nextPrice}.</p>}

          <p className="au-alt au-secure">
            <Lock size={14} aria-hidden="true" />
            Paid securely with Stripe. Cancel anytime from your profile.
          </p>
        </>
      )}
    </AuthShell>
  );
}
