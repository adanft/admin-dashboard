import { type NextRequest, NextResponse } from 'next/server';
import { getAuthRedirectDecision } from '@/server/auth/route-guard';
import { ADMIN_SESSION_COOKIE } from '@/server/auth/session-cookie';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const decision = getAuthRedirectDecision(pathname, sessionCookie);

  if (decision.redirectTo) {
    const response = NextResponse.redirect(new URL(decision.redirectTo, request.url));

    if (decision.clearCookieName) {
      response.cookies.delete(decision.clearCookieName);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
