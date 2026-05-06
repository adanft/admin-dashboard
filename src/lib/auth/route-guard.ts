import { ADMIN_SESSION_COOKIE, decodeAdminSession } from '@/lib/auth/session-cookie';

const AUTH_PATHS = ['/auth', '/auth/sign-in', '/auth/sign-up'];
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

export type AuthRedirectDecision = {
  clearCookieName?: typeof ADMIN_SESSION_COOKIE;
  redirectTo?: '/' | '/auth/sign-in';
};

export function getAuthRedirectDecision(
  pathname: string,
  sessionCookieValue: string | undefined,
): AuthRedirectDecision {
  const session = decodeAdminSession(sessionCookieValue);
  const isAuthPath = AUTH_PATHS.includes(pathname);

  if (session && isAuthPath) {
    return { redirectTo: '/' };
  }

  if (!session && isPrivatePath(pathname)) {
    return {
      redirectTo: '/auth/sign-in',
      ...(sessionCookieValue ? { clearCookieName: ADMIN_SESSION_COOKIE } : {}),
    };
  }

  return {};
}

function isPrivatePath(pathname: string) {
  if (AUTH_PATHS.includes(pathname)) {
    return false;
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE_PATTERN.test(pathname)
  ) {
    return false;
  }

  return true;
}
