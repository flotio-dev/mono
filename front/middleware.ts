import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Skip static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.match(/\.[^/]+$/)) {
    return NextResponse.next();
  }

  // Check for locale in pathname
  const locales = ['en', 'fr'];
  const pathnameParts = pathname.split('/');
  if (locales.includes(pathnameParts[1])) {
    return NextResponse.next();
  }

  // Default to French if no locale
  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname}${search}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|.*\..*).*)'],
};
