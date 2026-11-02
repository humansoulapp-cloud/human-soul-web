import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * The signed-in user from the session kept in the browser: no round trip to the
 * auth server before a screen loads its data. Row Level Security still checks
 * every query on the server, so this is only used to scope queries to the user.
 */
export async function currentUser(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
