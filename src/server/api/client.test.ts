// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type AdminApiError,
  authApi,
  requestAuthenticatedDelete,
  requestAuthenticatedGet,
  requestAuthenticatedJson,
} from './client';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('authApi', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('posts login payloads to the external Go backend and returns envelope data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'token' }, status: 200 }), {
        status: 200,
      }),
    );

    await expect(authApi.login({ identity: 'ada', password: 'secret' })).resolves.toEqual({
      data: { accessToken: 'token' },
    });

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ identity: 'ada', password: 'secret' }),
      cache: 'no-store',
    });
  });

  it('returns the backend refresh cookie from successful login responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'token' }, status: 200 }), {
        status: 200,
        headers: {
          'Set-Cookie':
            'refresh_token=refresh-value; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800',
        },
      }),
    );

    await expect(authApi.login({ identity: 'ada', password: 'secret' })).resolves.toEqual({
      data: { accessToken: 'token' },
      refreshCookie: { maxAge: 604_800, value: 'refresh-value' },
    });
  });

  it('returns the backend refresh cookie expiry from successful register responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'token' }, status: 200 }), {
        status: 200,
        headers: {
          'Set-Cookie':
            'refresh_token=registered-value; Path=/; HttpOnly; SameSite=Lax; Expires=Sat, 09 May 2026 10:00:00 GMT',
        },
      }),
    );

    await expect(
      authApi.register({
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).resolves.toEqual({
      data: { accessToken: 'token' },
      refreshCookie: { expires: new Date('2026-05-09T10:00:00.000Z'), value: 'registered-value' },
    });
  });

  it('posts logout with the backend refresh cookie and accepts 204 responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(authApi.logout({ refreshToken: 'refresh-token' })).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Cookie: 'refresh_token=refresh-token',
      },
      cache: 'no-store',
    });
  });

  it('posts logout without a cookie when the refresh token is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(authApi.logout()).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  });

  it.each([401, 403])(
    'preserves %i error status distinctions from backend envelopes',
    async (status) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, code: 'AUTH_ERROR', error: 'auth failed', status }),
          { status },
        ),
      );

      await expect(authApi.login({ identity: 'ada', password: 'secret' })).rejects.toMatchObject({
        code: 'AUTH_ERROR',
        message: 'auth failed',
        status,
      } satisfies Partial<AdminApiError>);
    },
  );

  it('falls back to the HTTP status when an invalid JSON error response is returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not json', { status: 403 }));

    await expect(
      authApi.register({
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects non-OK HTTP responses even when the envelope claims success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { accessToken: 'token' }, status: 401 }), {
        status: 401,
        statusText: 'Denied',
      }),
    );

    await expect(authApi.login({ identity: 'ada', password: 'secret' })).rejects.toMatchObject({
      message: 'Denied',
      status: 401,
    });
  });

  it('preserves backend error envelope details when HTTP status disagrees', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'REGISTRATION_CLOSED',
          error: 'setup closed',
          status: 409,
        }),
        { status: 200 },
      ),
    );

    await expect(
      authApi.register({
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      code: 'REGISTRATION_CLOSED',
      message: 'setup closed',
      status: 409,
    } satisfies Partial<AdminApiError>);
  });
});

describe('requestAuthenticatedGet', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('sends Bearer authenticated GET requests with query params and no-store caching', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { users: [] }, status: 200 }), {
        status: 200,
      }),
    );

    await expect(
      requestAuthenticatedGet<{ users: [] }>({
        path: '/users',
        token: 'access-token',
        query: {
          search: 'ada lovelace',
          status: 'active',
          limit: 25,
          offset: 50,
        },
      }),
    ).resolves.toEqual({ users: [] });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users?search=ada+lovelace&status=active&limit=25&offset=50',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer access-token',
        },
        cache: 'no-store',
      },
    );
  });

  it.each([401, 403])('preserves %i status for authenticated GET failures', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'USERS_DENIED',
          error: 'cannot list users',
          status,
        }),
        { status },
      ),
    );

    await expect(
      requestAuthenticatedGet<{ users: [] }>({ path: '/users', token: 'access-token' }),
    ).rejects.toMatchObject({
      code: 'USERS_DENIED',
      message: 'cannot list users',
      status,
    } satisfies Partial<AdminApiError>);
  });

  it('includes the refresh cookie on authenticated GET requests when provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [], status: 200 }), { status: 200 }),
    );

    await expect(
      requestAuthenticatedGet<[]>({
        path: '/auth/sessions',
        refreshToken: 'refresh-token',
        token: 'access-token',
      }),
    ).resolves.toEqual([]);

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/sessions', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer access-token',
        Cookie: 'refresh_token=refresh-token',
      },
      cache: 'no-store',
    });
  });
});

describe('authenticated mutation helpers', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it.each(['POST', 'PUT'] as const)(
    'sends Bearer authenticated %s JSON requests and returns envelope data',
    async (method) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: 'user-1' }, status: 200 }), {
          status: 200,
        }),
      );

      await expect(
        requestAuthenticatedJson<{ name: string }, { id: string }>({
          method,
          path: method === 'POST' ? '/users' : '/users/user-1',
          token: 'access-token',
          payload: { name: 'Ada' },
        }),
      ).resolves.toEqual({ id: 'user-1' });

      expect(fetch).toHaveBeenCalledWith(
        `https://admin-api.test/${method === 'POST' ? 'users' : 'users/user-1'}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer access-token',
          },
          body: JSON.stringify({ name: 'Ada' }),
          cache: 'no-store',
        },
      );
    },
  );

  it('treats 204 authenticated DELETE responses as successful empty responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      requestAuthenticatedDelete({ path: '/users/user-1', token: 'access-token' }),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/users/user-1', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer access-token',
      },
      cache: 'no-store',
    });
  });

  it.each([401, 403])('preserves %i status for authenticated mutation failures', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, code: 'USERS_MUTATION_DENIED', error: 'denied', status }),
        { status },
      ),
    );

    await expect(
      requestAuthenticatedDelete({ path: '/users/user-1', token: 'access-token' }),
    ).rejects.toMatchObject({
      code: 'USERS_MUTATION_DENIED',
      message: 'denied',
      status,
    } satisfies Partial<AdminApiError>);
  });

  it('includes the refresh cookie on authenticated DELETE requests when provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      requestAuthenticatedDelete({
        path: '/auth/sessions/session-1',
        refreshToken: 'refresh-token',
        token: 'access-token',
      }),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/sessions/session-1', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer access-token',
        Cookie: 'refresh_token=refresh-token',
      },
      cache: 'no-store',
    });
  });
});
