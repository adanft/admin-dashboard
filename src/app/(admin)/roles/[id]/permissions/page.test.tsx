// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { PermissionSummary } from '@/lib/api/permissions';
import type { RoleProfile } from '@/lib/api/roles';
import { getSession } from '@/lib/auth/session';
import RolePermissionsPage from './page';

const getRoleMock = vi.hoisted(() => vi.fn<() => Promise<RoleProfile>>());
const listRolePermissionsMock = vi.hoisted(() => vi.fn<() => Promise<PermissionSummary[]>>());
const listPermissionsMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ permissions: PermissionSummary[] }>>(),
);

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/roles/permission', false]),
  };
});

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/roles', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/roles')>('@/lib/api/roles');

  return {
    ...actual,
    rolesApi: {
      getRole: getRoleMock,
      listRolePermissions: listRolePermissionsMock,
    },
  };
});

vi.mock('@/lib/api/permissions', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/permissions')>('@/lib/api/permissions');

  return {
    ...actual,
    permissionsApi: {
      listPermissions: listPermissionsMock,
    },
  };
});

vi.mock('../../_lib/role-actions', () => ({
  updateRolePermissionsAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('RolePermissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getRoleMock.mockResolvedValue(roleProfile());
    listRolePermissionsMock.mockResolvedValue([permission('perm-1', 'roles.read', 'Read roles')]);
    listPermissionsMock.mockResolvedValue({
      permissions: [
        permission('perm-1', 'roles.read', 'Read roles'),
        permission('perm-2', 'roles.write', 'Write roles'),
      ],
    });
  });

  it('renders a dedicated checkbox form for custom role permissions', async () => {
    const markup = await renderPermissionsPage('role-1');

    expect(getRoleMock).toHaveBeenCalledWith('role-1', 'admin-token');
    expect(listRolePermissionsMock).toHaveBeenCalledWith('role-1', 'admin-token');
    expect(listPermissionsMock).toHaveBeenCalledWith('admin-token', { limit: 100, offset: 0 });
    expect(markup).toContain('Modify Administrator permissions');
    expect(markup).toContain('href="/roles/role-1"');
    expect(markup).toContain('name="permissionIds"');
    expect(markup).toContain('roles.read');
    expect(markup).toContain('Read roles');
    expect(markup).toContain('roles.write');
    expect(markup).toContain('Write roles');
    expect(markup).toContain('Save changes');
    expect(markup).toContain('Cancel');
  });

  it('blocks permission mutation for system roles', async () => {
    getRoleMock.mockResolvedValue({ ...roleProfile(), isSystem: true });

    const markup = await renderPermissionsPage('role-1');

    expect(markup).toContain('System role protected');
    expect(markup).not.toContain('name="permissionIds"');
    expect(markup).not.toContain('Save changes');
  });

  it('renders not-found without the permission form', async () => {
    getRoleMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderPermissionsPage('missing-role');

    expect(markup).toContain('Role not found');
    expect(markup).not.toContain('name="permissionIds"');
  });
});

async function renderPermissionsPage(id: string) {
  return renderToStaticMarkup(await RolePermissionsPage({ params: Promise.resolve({ id }) }));
}

function roleProfile(): RoleProfile {
  return {
    id: 'role-1',
    key: 'admin',
    displayName: 'Administrator',
    status: 'active',
    isSystem: false,
    permissionCount: 1,
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}

function permission(id: string, key: string, displayName: string): PermissionSummary {
  return { id, key, displayName, category: 'Roles', status: 'active', sortOrder: 0 };
}
