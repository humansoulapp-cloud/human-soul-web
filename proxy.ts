import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // ─── Hostname routing ─────────────────────────────────────────────────────
  // humansoul.co serves the landing at "/", my.humansoul.co is the app and
  // sends "/" straight to the dashboard. The check is on the `my.` subdomain
  // rather than the domain itself, so localhost and Vercel preview URLs keep
  // the landing and stay previewable.
  const isAppHost = host.startsWith('my.');

  if (pathname === '/') {
    if (isAppHost || user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ─── Auth pages ───────────────────────────────────────────────────────────
  const isAuthPage =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');
  const isPublicPage = isAuthPage || pathname === '/onboarding' || pathname === '/';

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // A recovery link signs the person in before they choose a new password, so
  // /reset-password must stay reachable with a session.
  const isEntryPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  if (user && isEntryPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ─── Admin guard ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
