import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { legacyJourneyId } from './lib/journey-redirects';

export async function proxy(request: NextRequest) {
  // ─── Journey addresses ────────────────────────────────────────────────────
  // Old codes (HS-J-001) and other capitalisations go to the readable address
  // with a real 308 before anything renders, so links and search engines
  // update. The page keeps its own fallback for addresses changed in Admin.
  const journeyMatch = request.nextUrl.pathname.match(/^\/(admin\/)?journeys\/([^/]+)$/);
  if (journeyMatch) {
    const raw = journeyMatch[2];
    const target = legacyJourneyId(raw) ?? (raw !== raw.toLowerCase() ? raw.toLowerCase() : null);
    if (target && target !== raw) {
      const url = request.nextUrl.clone();
      url.pathname = `/${journeyMatch[1] ?? ''}journeys/${target}`;
      return NextResponse.redirect(url, 308);
    }
  }

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

  // ─── Email links ──────────────────────────────────────────────────────────
  // Supabase sends confirmation links to the Site URL ("/") when no redirect is
  // given or allowed. Hand them to /auth/callback so they sign the person in.
  // The callback and the cron job must work without a session.
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/api/cron/') || pathname.startsWith('/api/stripe/')) {
    return supabaseResponse;
  }
  const params = request.nextUrl.searchParams;
  if (pathname === '/' && (params.has('code') || params.has('token_hash'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

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
  const isPublicPage = isAuthPage || pathname === '/onboarding' || pathname === '/' || pathname === '/privacy' || pathname === '/terms';

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
     * - robots.txt, sitemap.xml and the share image, which crawlers read signed out
     */
    '/((?!ingest|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
