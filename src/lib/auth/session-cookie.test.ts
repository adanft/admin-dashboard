import { afterEach, describe, expect, it, vi } from 'vitest';

import { decodeAdminSession, encodeAdminSession } from './session-cookie';

describe('admin session cookie helpers', () => {
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminSessionSecret = process.env.ADMIN_SESSION_SECRET;

  afterEach(() => {
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
    process.env.ADMIN_SESSION_SECRET = originalAdminSessionSecret;
    vi.unstubAllEnvs();
  });

  function requireEncodedCookie(value: string | null) {
    if (!value) {
      throw new Error('Expected test session cookie to be encoded.');
    }

    return value;
  }

  it('round-trips access token and expiry metadata without profile data', () => {
    const expiresAt = Date.now() + 60_000;
    const encoded = requireEncodedCookie(
      encodeAdminSession({ accessToken: 'access-token', expiresAt }),
    );

    expect(decodeAdminSession(encoded)).toEqual({ accessToken: 'access-token', expiresAt });
    expect(encoded).not.toContain('access-token');
    expect(encoded).not.toContain('profile');
    expect(encoded).not.toContain('permissions');
  });

  it('treats missing, malformed, incomplete, and expired values as unauthenticated', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T00:00:00.000Z'));

    try {
      expect(decodeAdminSession(undefined)).toBeNull();
      expect(decodeAdminSession('%7Bbad-json')).toBeNull();
      expect(
        decodeAdminSession(
          Buffer.from(JSON.stringify({ accessToken: 'token' })).toString('base64url'),
        ),
      ).toBeNull();
      expect(
        decodeAdminSession(
          encodeAdminSession({ accessToken: 'token', expiresAt: Date.now() - 1_000 }) ?? undefined,
        ),
      ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a signed cookie when the payload is tampered with', () => {
    const encoded = requireEncodedCookie(
      encodeAdminSession({ accessToken: 'access-token', expiresAt: Date.now() + 60_000 }),
    );

    const [payload, signature] = encoded.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ accessToken: 'forged-token', expiresAt: Date.now() + 60_000 }),
    ).toString('base64url');

    expect(decodeAdminSession(`${tamperedPayload}.${signature}`)).toBeNull();
    expect(decodeAdminSession(`${payload}.invalid-signature`)).toBeNull();
  });

  it('uses ADMIN_SESSION_SECRET when present', () => {
    process.env.ADMIN_SESSION_SECRET = 'first-secret';

    const encoded = requireEncodedCookie(
      encodeAdminSession({ accessToken: 'access-token', expiresAt: Date.now() + 60_000 }),
    );

    process.env.ADMIN_SESSION_SECRET = 'second-secret';

    expect(decodeAdminSession(encoded)).toBeNull();

    process.env.ADMIN_SESSION_SECRET = 'first-secret';

    expect(decodeAdminSession(encoded)?.accessToken).toBe('access-token');
  });

  it('fails closed in production when ADMIN_SESSION_SECRET is missing', () => {
    process.env.ADMIN_SESSION_SECRET = '';
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      encodeAdminSession({ accessToken: 'access-token', expiresAt: Date.now() + 60_000 }),
    ).toBeNull();
    expect(decodeAdminSession('unsigned-cookie')).toBeNull();
  });
});
