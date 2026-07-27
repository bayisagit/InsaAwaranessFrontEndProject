import { NextRequest, NextResponse } from 'next/server';
import { localeCodes, defaultLocale } from '@/config/locales';

const COOKIE_NAME = 'NEXT_LOCALE';

function getLocale(request: NextRequest): string {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && localeCodes.includes(cookie)) return cookie;

  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0]?.split('-')[0];
    if (preferred && localeCodes.includes(preferred)) return preferred;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith('/api');
  const isAuthRoute = pathname.startsWith('/_next') || pathname.startsWith('/_vercel');
  const isStaticFile = /\.(.*)$/.test(pathname);

  if (isApiRoute || isAuthRoute || isStaticFile) {
    return NextResponse.next();
  }

  const locale = getLocale(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.set(COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_verdict|.*\\..*).*)'],
};
