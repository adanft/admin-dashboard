// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import {
  mapRolePermissionsResponse,
  mapRoleProfileResponse,
  mapRolesListResponse,
  normalizeRolesListQuery,
  rolesApi,
  toRolesListBackendQuery,
  toRolesListState,
} from './roles';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('normalizeRolesListQuery', () => {
  it('normalizes supported URL search params', () => {
    expect(normalizeRolesListQuery({ search: '  admin  ', limit: '25', offset: '50' })).toEqual({
      search: 'admin',
      limit: 25,
      offset: 50,
    });
  });

  it('falls back safely for unsupported params', () => {
    expect(normalizeRolesListQuery({ search: '   ', limit: '500', offset: '-1' })).toEqual({
      limit: 50,
      offset: 0,
    });
  });
});

describe('toRolesListBackendQuery', () => {
  it('keeps default limit and omits default offset', () => {
    expect(toRolesListBackendQuery({ limit: 50, offset: 0 })).toEqual({ limit: 50 });
  });

  it('supports the backend max page size', () => {
    expect(normalizeRolesListQuery({ limit: '100' })).toEqual({ limit: 100, offset: 0 });
  });

  it('keeps explicit search and pagination', () => {
    expect(toRolesListBackendQuery({ search: 'admin', limit: 25, offset: 50 })).toEqual({
      search: 'admin',
      limit: 25,
      offset: 50,
    });
  });
});

describe('mapRolesListResponse', () => {
  it('maps backend roles into stable UI rows', () => {
    expect(
      mapRolesListResponse({
        items: [
          {
            id: 'role-1',
            key: 'admin',
            display_name: 'Admin',
            description: 'Full access',
            status: 'active',
            is_system: true,
            permission_count: 3,
            created_at: '2026-01-02T03:04:05.000Z',
            updated_at: '2026-02-03T04:05:06.000Z',
          },
        ],
        pagination: { total: 1, limit: 25, offset: 0 },
      }),
    ).toEqual({
      rows: [
        {
          id: 'role-1',
          key: 'admin',
          displayName: 'Admin',
          description: 'Full access',
          status: 'active',
          isSystem: true,
          permissionCount: 3,
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        },
      ],
      pagination: { total: 1, limit: 25, offset: 0 },
      total: 1,
    });
  });
});

describe('mapRoleProfileResponse', () => {
  it('counts embedded permissions when explicit counts are unavailable', () => {
    expect(
      mapRoleProfileResponse({ key: 'viewer', displayName: 'Viewer', permissions: [{}, {}] })
        .permissionCount,
    ).toBe(2);
  });
});

describe('mapRolePermissionsResponse', () => {
  it('maps role permission arrays through the permissions mapper', () => {
    expect(mapRolePermissionsResponse([{ id: 'perm-1', key: 'roles.read' }])).toEqual([
      {
        id: 'perm-1',
        key: 'roles.read',
        displayName: 'roles.read',
        category: 'General',
        status: 'disabled',
        sortOrder: 0,
      },
    ]);
  });
});

describe('toRolesListState', () => {
  it.each([
    [400, 'bad-request', 'Invalid role filters.'],
    [401, 'unauthorized', 'Your session expired or is invalid.'],
    [403, 'forbidden', 'You do not have permission to view roles.'],
    [500, 'error', 'Unable to load roles right now.'],
  ] as const)('maps API status %i to %s list state', (status, expectedStatus, expectedMessage) => {
    expect(toRolesListState(new AdminApiError({ message: 'backend detail', status }))).toEqual({
      status: expectedStatus,
      message: expectedMessage,
    });
  });
});

describe('rolesApi contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('lists roles through GET /roles', async () => {
    mockJson({ items: [], pagination: { total: 0 } });

    await rolesApi.listRoles({ search: 'admin', limit: 25, offset: 50 }, 'access-token');

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/roles?search=admin&limit=25&offset=50',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('creates roles with the required POST payload', async () => {
    mockJson({ id: 'role-1', key: 'finance.viewer', displayName: 'Finance viewer' });

    await rolesApi.createRole(
      { key: 'finance.viewer', displayName: 'Finance viewer', description: 'Read finance data' },
      'access-token',
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/roles',
      expect.objectContaining({
        body: JSON.stringify({
          key: 'finance.viewer',
          displayName: 'Finance viewer',
          description: 'Read finance data',
        }),
        method: 'POST',
      }),
    );
  });

  it('updates roles through PATCH /roles/{id}', async () => {
    mockJson({ id: 'role-1', key: 'admin', displayName: 'Admin', status: 'disabled' });

    await rolesApi.updateRole(
      'role-1',
      { displayName: 'Admin', description: '', status: 'disabled' },
      'access-token',
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/roles/role-1',
      expect.objectContaining({
        body: JSON.stringify({ displayName: 'Admin', description: '', status: 'disabled' }),
        method: 'PATCH',
      }),
    );
  });

  it('mutates role permissions with bulk JSON POST and DELETE endpoints', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await rolesApi.assignPermissions('role-1', ['perm-1', 'perm-2'], 'access-token');
    await rolesApi.removePermissions('role-1', ['perm-3'], 'access-token');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://admin-api.test/roles/role-1/permissions',
      expect.objectContaining({
        body: JSON.stringify({ permissionIds: ['perm-1', 'perm-2'] }),
        method: 'POST',
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://admin-api.test/roles/role-1/permissions',
      expect.objectContaining({
        body: JSON.stringify({ permissionIds: ['perm-3'] }),
        method: 'DELETE',
      }),
    );
  });
});

function mockJson(data: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ success: true, data, status: 200 }), { status: 200 }),
  );
}
