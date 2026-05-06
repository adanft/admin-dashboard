import { describe, expect, it } from 'vitest';

import { ADMIN_SESSION_COOKIE, encodeAdminSession } from '@/lib/auth/session-cookie';
import { getAuthRedirectDecision } from './route-guard';

describe('auth route guard', () => {
  function createValidCookie() {
    const encoded = encodeAdminSession({
      accessToken: 'access-token',
      expiresAt: Date.now() + 60_000,
    });

    if (!encoded) {
      throw new Error('Expected test session cookie to be encoded.');
    }

    return encoded;
  }

  it('redirects unauthenticated private root requests to sign-in', () => {
    expect(getAuthRedirectDecision('/', undefined)).toEqual({ redirectTo: '/auth/sign-in' });
  });

  it.each(['/users', '/roles'])('redirects future private route %s to sign-in', (pathname) => {
    expect(getAuthRedirectDecision(pathname, undefined)).toEqual({ redirectTo: '/auth/sign-in' });
  });

  it('clears invalid session cookies when redirecting to sign-in', () => {
    expect(getAuthRedirectDecision('/', 'invalid-cookie')).toEqual({
      redirectTo: '/auth/sign-in',
      clearCookieName: ADMIN_SESSION_COOKIE,
    });
  });

  it.each(['/auth', '/auth/sign-in', '/auth/sign-up'])(
    'redirects authenticated auth route %s to the dashboard',
    (pathname) => {
      expect(getAuthRedirectDecision(pathname, createValidCookie())).toEqual({ redirectTo: '/' });
    },
  );

  it('allows non-root public paths to continue without redirects', () => {
    expect(getAuthRedirectDecision('/favicon.ico', undefined)).toEqual({});
  });
});
