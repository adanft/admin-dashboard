// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError, authApi, mapCurrentAccountResponse, toCurrentAccountState } from './auth';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('mapCurrentAccountResponse', () => {
  it('maps the current actor and assigned roles', () => {
    expect(
      mapCurrentAccountResponse({
        actor: {
          id: 'user-1',
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          status: 'active',
        },
        roles: [
          {
            id: 'role-1',
            key: 'owner',
            displayName: 'Owner',
            status: 'active',
            isSystem: true,
          },
        ],
        effectivePermissions: ['users.read', { key: 'roles.read' }, { id: 'permissions.read' }],
      }),
    ).toEqual({
      actor: {
        id: 'user-1',
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        status: 'active',
      },
      roles: [
        {
          id: 'role-1',
          key: 'owner',
          displayName: 'Owner',
          status: 'active',
          isSystem: true,
        },
      ],
    });
  });

  it('supports actor fields at the top level and snake_case response names', () => {
    expect(
      mapCurrentAccountResponse({
        id: 'user-2',
        name: 'Grace',
        last_name: 'Hopper',
        username: 'grace',
        email: 'grace@example.com',
        roles: [{ id: 'role-2', key: 'admin', display_name: 'Admin', is_system: false }],
      }),
    ).toMatchObject({
      actor: { id: 'user-2', lastName: 'Hopper', username: 'grace' },
      roles: [{ displayName: 'Admin', isSystem: false }],
    });
  });
});

describe('toCurrentAccountState', () => {
  it.each([
    [401, 'unauthorized', 'Your session expired or is invalid.'],
    [403, 'forbidden', 'You do not have permission to view this account.'],
    [500, 'error', 'Unable to load your account right now.'],
  ] as const)('maps API status %i to %s', (status, expectedStatus, expectedMessage) => {
    expect(toCurrentAccountState(new AdminApiError({ message: 'backend detail', status }))).toEqual(
      {
        status: expectedStatus,
        message: expectedMessage,
      },
    );
  });
});

describe('authApi account contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('loads the current account with a Bearer token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { actor: { id: 'user-1', username: 'ada' }, roles: [] },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(authApi.getCurrentAccount('access-token')).resolves.toMatchObject({
      status: 'success',
      data: { actor: { id: 'user-1', username: 'ada' } },
    });

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: 'Bearer access-token' },
      cache: 'no-store',
    });
  });

  it('changes the personal password with a Bearer token and JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { id: 'user-1', username: 'ada' }, status: 200 }),
        { status: 200 },
      ),
    );

    await expect(
      authApi.changePassword(
        { currentPassword: 'current-secret', newPassword: 'new-secret' },
        'access-token',
      ),
    ).resolves.toMatchObject({ id: 'user-1', username: 'ada' });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/auth/change-password',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer access-token',
        },
        body: JSON.stringify({ currentPassword: 'current-secret', newPassword: 'new-secret' }),
      }),
    );
  });

  it('logs out all sessions with Bearer token and refresh cookie', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(authApi.logoutAll('access-token', 'refresh-token')).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith('https://admin-api.test/auth/logout-all', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer access-token',
        Cookie: 'refresh_token=refresh-token',
      },
      cache: 'no-store',
    });
  });
});
