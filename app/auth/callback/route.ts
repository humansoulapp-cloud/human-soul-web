import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the links in Supabase's emails land (sign-up confirmation, password
 * reset, email change). It turns the link into a session cookie, then sends the
 * person on to `next`.
 *
 * Two kinds of link are accepted:
 * - `?token_hash=…&type=…` — works on any device. Use it in the Supabase email
 *   templates, e.g. for "Reset password":
 *   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 * - `?code=…` — Supabase's default (PKCE) link. It only works in the browser
 *   where the email was requested.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const fallback = type === "recovery" ? "/reset-password" : type === "signup" || type === "email" ? "/onboarding" : "/dashboard";
  const next = safePath(searchParams.get("next")) ?? fallback;

  const supabase = await createClient();
  let failed = true;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  }

  if (!failed) return NextResponse.redirect(new URL(next, origin));

  // A reset link that has expired or was already used: the reset page explains
  // and offers a new one. Anything else goes to sign-in.
  const url = new URL(next === "/reset-password" ? "/reset-password" : "/sign-in", origin);
  url.hash = "error=link_expired";
  return NextResponse.redirect(url);
}

/** Only paths on this site, so the link can't send people elsewhere. */
function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
