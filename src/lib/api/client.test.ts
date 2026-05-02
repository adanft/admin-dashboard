import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AdminApiError, authApi } from './client';

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
      accessToken: 'token',
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
