// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mapPermissionSummary, mapPermissionsListResponse, permissionsApi } from './permissions';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('mapPermissionSummary', () => {
  it('maps backend fields and casing into a permission summary', () => {
    expect(
      mapPermissionSummary({
        id: 'perm-1',
        key: 'roles.read',
        display_name: 'Read roles',
        description: 'View role settings',
        category: 'Roles',
        status: 'active',
        sort_order: 20,
      }),
    ).toEqual({
      id: 'perm-1',
      key: 'roles.read',
      displayName: 'Read roles',
      description: 'View role settings',
      category: 'Roles',
      status: 'active',
      sortOrder: 20,
    });
  });

  it('uses safe fallbacks for unsupported backend values', () => {
    expect(mapPermissionSummary({ key: 'roles.write', status: 'archived' })).toEqual({
      id: 'roles.write',
      key: 'roles.write',
      displayName: 'roles.write',
      category: 'General',
      status: 'disabled',
      sortOrder: 0,
    });
  });
});

describe('mapPermissionsListResponse', () => {
  it('maps a paginated permissions response', () => {
    expect(
      mapPermissionsListResponse({
        items: [{ id: 'perm-1', key: 'roles.read', displayName: 'Read roles' }],
        pagination: { total: 1, limit: 100, offset: 0 },
      }),
    ).toEqual({
      permissions: [
        {
          id: 'perm-1',
          key: 'roles.read',
          displayName: 'Read roles',
          category: 'General',
          status: 'disabled',
          sortOrder: 0,
        },
      ],
      pagination: { total: 1, limit: 100, offset: 0 },
      total: 1,
    });
  });
});

describe('permissionsApi.listPermissions contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('requests permissions with backend pagination defaults', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0, limit: 50, offset: 0 } },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await permissionsApi.listPermissions('access-token');

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/permissions?limit=50',
      expect.objectContaining({
        headers: { Accept: 'application/json', Authorization: 'Bearer access-token' },
        method: 'GET',
      }),
    );
  });
});
