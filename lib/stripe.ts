import crypto from "node:crypto";

/**
 * Minimal Stripe client over its REST API (no SDK): form-encoded requests with the secret key.
 * Server only. Keys live in Vercel: STRIPE_SECRET_KEY (sk_test_… / sk_live_…) and STRIPE_WEBHOOK_SECRET (whsec_…).
 */
const API = "https://api.stripe.com/v1";

export function stripeReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

type Params = Record<string, unknown>;

/** Flattens nested objects/arrays the way Stripe expects: a[b][0][c]=v */
function encode(params: Params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === "object" ? encode(item as Params, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === "object") encode(v as Params, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe<T = Record<string, unknown>>(method: "GET" | "POST", path: string, params?: Params): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  const body = params ? encode(params).toString() : undefined;
  const url = method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Stripe error ${res.status}`);
  return json;
}

/** Checks the Stripe-Signature header (HMAC-SHA256 of "t.payload"), allowing 5 minutes of clock skew. */
export function verifyWebhook(payload: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: number;
  metadata: Record<string, string>;
  items: { data: { price: { unit_amount: number | null } }[] };
};

export type StripeCheckoutSession = {
  id: string;
  client_reference_id: string | null;
  customer: string | null;
  subscription: string | StripeSubscription | null;
  payment_status: string;
  status: string;
  metadata: Record<string, string>;
};
