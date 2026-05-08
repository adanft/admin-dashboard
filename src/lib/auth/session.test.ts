import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSessionFromAuthData, persistRefreshCookie } from './session';

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: mocks.cookieSet })),
}));

describe('createSessionFromAuthData', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when the backend does not provide an access token', () => {
    expect(createSessionFromAuthData({})).toBeNull();
  });

  it('uses accessToken when present and falls back to token otherwise', () => {
    expect(
      createSessionFromAuthData({ accessToken: 'access-token', expiresAt: 1_800_000_000_000 }),
    ).toEqual({ accessToken: 'access-token', expiresAt: 1_800_000_000_000 });

    expect(createSessionFromAuthData({ token: 'token', expiresAt: 1_800_000_000_000 })).toEqual({
      accessToken: 'token',
      expiresAt: 1_800_000_000_000,
    });
  });

  it('normalizes numeric expiresAt values expressed in seconds or milliseconds', () => {
    expect(createSessionFromAuthData({ accessToken: 'token', expiresAt: 1_800_000_000 })).toEqual({
      accessToken: 'token',
      expiresAt: 1_800_000_000_000,
    });

    expect(
      createSessionFromAuthData({ accessToken: 'token', expiresAt: 1_800_000_000_000 }),
    ).toEqual({
      accessToken: 'token',
      expiresAt: 1_800_000_000_000,
    });
  });

  it('parses string expiresAt values when they are valid dates', () => {
    expect(
      createSessionFromAuthData({
        accessToken: 'token',
        expiresAt: '2026-05-02T12:00:00.000Z',
      }),
    ).toEqual({ accessToken: 'token', expiresAt: Date.parse('2026-05-02T12:00:00.000Z') });
  });

  it('uses expiresIn fields relative to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T00:00:00.000Z'));

    expect(createSessionFromAuthData({ accessToken: 'token', expiresIn: 120 })).toEqual({
      accessToken: 'token',
      expiresAt: Date.parse('2026-05-02T00:02:00.000Z'),
    });

    expect(createSessionFromAuthData({ accessToken: 'token', expiresInSeconds: 180 })).toEqual({
      accessToken: 'token',
      expiresAt: Date.parse('2026-05-02T00:03:00.000Z'),
    });
  });

  it('uses JWT exp when explicit expiry fields are unavailable', () => {
    const accessToken = createJwtWithPayload({ exp: 1_800_000_000 });

    expect(createSessionFromAuthData({ accessToken })).toEqual({
      accessToken,
      expiresAt: 1_800_000_000_000,
    });
  });

  it('preserves user profile data from the auth response', () => {
    expect(
      createSessionFromAuthData({
        accessToken: 'token',
        expiresAt: 1_800_000_000_000,
        user: {
          avatar: 'https://cdn.example.com/ada.png',
          lastName: 'Lovelace',
          name: 'Ada',
          username: 'ada',
        },
      }),
    ).toEqual({
      accessToken: 'token',
      expiresAt: 1_800_000_000_000,
      user: {
        avatar: 'https://cdn.example.com/ada.png',
        lastName: 'Lovelace',
        name: 'Ada',
        username: 'ada',
      },
    });
  });

  it('derives user profile data from JWT claims when the auth response omits it', () => {
    const accessToken = createJwtWithPayload({
      exp: 1_800_000_000,
      family_name: 'Hopper',
      given_name: 'Grace',
      picture: 'https://cdn.example.com/grace.png',
      preferred_username: 'grace',
    });

    expect(createSessionFromAuthData({ accessToken })).toEqual({
      accessToken,
      expiresAt: 1_800_000_000_000,
      user: {
        avatar: 'https://cdn.example.com/grace.png',
        lastName: 'Hopper',
        name: 'Grace',
        username: 'grace',
      },
    });
  });

  it('falls back to the default session TTL when no usable expiry exists', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T00:00:00.000Z'));

    expect(
      createSessionFromAuthData({ accessToken: 'not-a-jwt', expiresAt: 'invalid-date' }),
    ).toEqual({
      accessToken: 'not-a-jwt',
      expiresAt: Date.parse('2026-05-02T01:00:00.000Z'),
    });
  });
});

describe('persistRefreshCookie', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets a safe httpOnly refresh cookie for dashboard SSR', async () => {
    await persistRefreshCookie({ maxAge: 604_800, value: 'refresh-token' });

    expect(mocks.cookieSet).toHaveBeenCalledWith({
      name: 'refresh_token',
      value: 'refresh-token',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 604_800,
    });
  });

  it('preserves a parseable backend refresh cookie expiry', async () => {
    const expires = new Date('2026-05-09T10:00:00.000Z');

    await persistRefreshCookie({ expires, value: 'refresh-token' });

    expect(mocks.cookieSet).toHaveBeenCalledWith({
      name: 'refresh_token',
      value: 'refresh-token',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      expires,
    });
  });
});

function createJwtWithPayload(payload: object) {
  return ['header', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'signature'].join(
    '.',
  );
}
