import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Exposes the current path to Server Components via a request header — layouts (unlike
 * pages) don't otherwise receive the pathname, and Header.tsx's LanguageSwitcher needs it
 * so switching languages returns to the same page instead of always redirecting to "/".
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}
