// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mapPermissionSummary,
  mapPermissionsListResponse,
  normalizePermissionsListQuery,
  type PermissionsListState,
  permissionsApi,
} from './permissions';

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

describe('normalizePermissionsListQuery', () => {
  it('normalizes supported list search params', () => {
    expect(normalizePermissionsListQuery({ search: ' roles ', limit: '25', offset: '50' })).toEqual(
      {
        search: 'roles',
        limit: 25,
        offset: 50,
      },
    );
  });

  it('falls back on unsupported limit and offset values', () => {
    expect(normalizePermissionsListQuery({ limit: '5', offset: '-1' })).toEqual({
      limit: 50,
      offset: 0,
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

    await expect(permissionsApi.listPermissions('access-token')).resolves.toEqual({
      status: 'success',
      data: { permissions: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    } satisfies PermissionsListState);

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/permissions?limit=50',
      expect.objectContaining({
        headers: { Accept: 'application/json', Authorization: 'Bearer access-token' },
        method: 'GET',
      }),
    );
  });

  it('requests a permission detail by encoded id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: 'permission/1', key: 'permissions.read', displayName: 'Read permissions' },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(permissionsApi.getPermission('permission/1', 'access-token')).resolves.toEqual({
      id: 'permission/1',
      key: 'permissions.read',
      displayName: 'Read permissions',
      category: 'General',
      status: 'disabled',
      sortOrder: 0,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/permissions/permission%2F1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('patches editable display metadata only', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: 'perm-1', key: 'permissions.update', displayName: 'Update permissions' },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await permissionsApi.updatePermission(
      'perm-1',
      {
        displayName: 'Update permissions',
        description: 'Edit metadata',
        category: 'Permissions',
        sortOrder: 10,
      },
      'access-token',
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/permissions/perm-1',
      expect.objectContaining({
        body: JSON.stringify({
          displayName: 'Update permissions',
          description: 'Edit metadata',
          category: 'Permissions',
          sortOrder: 10,
        }),
        method: 'PATCH',
      }),
    );
  });
});
