import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous Supabase client with no cookies.
 * Safe for statically rendered pages (the landing): Row Level Security still applies,
 * so it only ever sees what the public can see.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
