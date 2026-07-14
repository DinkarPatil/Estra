import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];
const ROLE_PREFIXES = ['/investor', '/broker', '/developer', '/admin'];
const PLAN_SELECTION_ROUTE = '/select-plan';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes (incl. /auth/* which is rewritten to backend)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const session = request.cookies.get('glimmora-session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let role: string | undefined;
  try {
    ({ role } = JSON.parse(decodeURIComponent(session)));
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const plan = request.cookies.get('glimmora-plan')?.value;
  const isPlanRoute = pathname === PLAN_SELECTION_ROUTE;

  // No plan yet → force plan selection (admins skip the paywall)
  if (!plan && role !== 'admin' && !isPlanRoute) {
    return NextResponse.redirect(new URL(PLAN_SELECTION_ROUTE, request.url));
  }

  // Plan already chosen → bounce off the plan-selection page
  if (plan && isPlanRoute) {
    const target = ROLE_PREFIXES.find(p => p === `/${role}`) ?? '/investor';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Role-route enforcement
  const isRoleRoute = ROLE_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isRoleRoute) {
    const allowedPrefix = `/${role}`;
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
