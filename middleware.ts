import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const isAppRoute = request.nextUrl.pathname.startsWith('/app');
  const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
  const isManagerRoute = request.nextUrl.pathname.startsWith('/manager');
  const isProtectedRoute = isAppRoute || isOwnerRoute || isManagerRoute;
  const isRootRoute = request.nextUrl.pathname === '/';
  const isLoginRoute = request.nextUrl.pathname === '/login';

  // If visiting /login, redirect to /
  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fast cookie check
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.includes('auth-token') || c.name.startsWith('sb-')
  );

  // If trying to access protected route with no auth cookie at all, redirect to / immediately
  if (isProtectedRoute && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fast path for internal Next.js RSC transitions:
  // When already inside /app and auth cookie exists, pass through immediately
  // avoiding duplicate blocking remote network round-trips to Supabase Auth API
  const isRsc =
    request.headers.get('rsc') === '1' ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('x-next-router-prefetch');

  if (isRsc && isProtectedRoute && hasAuthCookie) {
    return NextResponse.next();
  }

  // Full page loads & Login verification
  let response = NextResponse.next({ request });
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder.supabase.co';
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'placeholder-anon-key';

  const supabaseUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  const supabaseKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) =>
        values.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        }),
    },
  });

  const {
    data: { user },
  } = await client.auth.getUser();

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (user) {
    const metaRole = user.app_metadata?.role || user.user_metadata?.role;
    let isSuperAdmin = metaRole === 'super_admin';
    const isManager = metaRole === 'manager';

    if (!isSuperAdmin && !isManager) {
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'super_admin') {
        isSuperAdmin = true;
      }
    }

    const isAdmin = !isSuperAdmin && !isManager;

    if ((isRootRoute || isLoginRoute) && request.nextUrl.searchParams.get('setup') !== '1') {
      if (isSuperAdmin) {
        return NextResponse.redirect(new URL('/owner', request.url));
      }
      if (isManager) {
        return NextResponse.redirect(new URL('/manager', request.url));
      }
      return NextResponse.redirect(new URL('/app', request.url));
    }

    if (isOwnerRoute && !isSuperAdmin) {
      return NextResponse.redirect(new URL(isManager ? '/manager' : '/app', request.url));
    }

    if (isAppRoute && isManager) {
      return NextResponse.redirect(new URL('/manager', request.url));
    }

    if (isManagerRoute && isAdmin) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/app/:path*', '/owner/:path*', '/manager/:path*', '/login'],
};
