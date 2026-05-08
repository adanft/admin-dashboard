// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public component copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/server/api/client';
import type { PermissionSummary } from '@/server/api/permissions';
import type { RoleProfile } from '@/server/api/roles';
import { getSession } from '@/server/auth/session';
import RoleDetailPage from './page';

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

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/server/api/roles', async () => {
  const actual = await vi.importActual<typeof import('@/server/api/roles')>('@/server/api/roles');

  return {
    ...actual,
    rolesApi: {
      getRole: getRoleMock,
      listRolePermissions: listRolePermissionsMock,
    },
  };
});

vi.mock('@/server/api/permissions', async () => {
  const actual = await vi.importActual<typeof import('@/server/api/permissions')>(
    '@/server/api/permissions',
  );

  return {
    ...actual,
    permissionsApi: {
      listPermissionsData: listPermissionsMock,
    },
  };
});

vi.mock('@/features/roles/actions/role-actions', () => ({
  deleteRoleAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('RoleDetailPage', () => {
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

  it('renders protected system role metadata without destructive controls', async () => {
    const markup = await renderDetailPage('role-1');

    expect(getRoleMock).toHaveBeenCalledWith('role-1', 'admin-token');
    expect(listRolePermissionsMock).toHaveBeenCalledWith('role-1', 'admin-token');
    expect(listPermissionsMock).not.toHaveBeenCalled();
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Roles');
    expect(markup).toContain('Administrator');
    expect(markup).toContain('admin');
    expect(markup).toContain('System');
    expect(markup).toContain('1 permission');
    expect(markup).toContain('System roles are protected and cannot be edited or deleted');
    expect(markup).not.toContain('href="/roles/role-1/edit"');
    expect(markup).not.toContain('aria-label="Delete Administrator"');
    expect(markup).toContain('Permissions');
    expect(markup).toContain('Granted access and capabilities');
    expect(markup).not.toContain('Modify');
    expect(markup).toContain('Read roles');
    expect(markup).not.toContain('Write roles (roles.write)');
    expect(markup).not.toContain('Remove');
  });

  it('renders edit/delete and a dedicated permission modification link for custom roles', async () => {
    getRoleMock.mockResolvedValue({ ...roleProfile(), isSystem: false });

    const markup = await renderDetailPage('role-1');

    expect(markup).toContain('href="/roles/role-1/edit"');
    expect(markup).toContain('aria-label="Edit Administrator"');
    expect(markup).toContain('aria-label="Delete Administrator"');
    expect(markup).toContain('href="/roles/role-1/permissions"');
    expect(markup).toContain('Modify');
    expect(markup).not.toContain('name="permissionIds"');
    expect(markup).not.toContain('Write roles (roles.write)');
    expect(markup).not.toContain('Remove');
  });

  it('renders a permissions loading warning while keeping role details visible', async () => {
    listRolePermissionsMock.mockRejectedValue(new Error('permissions unavailable'));

    const markup = await renderDetailPage('role-1');

    expect(markup).toContain('Administrator');
    expect(markup).toContain('Unable to load role permissions right now.');
    expect(markup).not.toContain('Modify');
  });

  it.each([
    [404, 'Role not found', 'This role no longer exists.'],
    [401, 'Your session expired. Please sign in again.', 'Sign in again to continue.'],
    [
      403,
      'You do not have permission to view this role.',
      'Ask an administrator for roles.read access.',
    ],
    [500, 'Unable to load this role right now.', 'Refresh the page or try again later.'],
  ] as const)('renders the distinct detail error state for %i', async (status, title, guidance) => {
    getRoleMock.mockRejectedValue(new AdminApiError({ message: 'backend detail', status }));

    const markup = await renderDetailPage('missing-role');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain(title);
    expect(markup).toContain(guidance);
    expect(markup).not.toContain('Modify');
  });
});

async function renderDetailPage(id: string) {
  return renderToStaticMarkup(await RoleDetailPage({ params: Promise.resolve({ id }) }));
}

function roleProfile(): RoleProfile {
  return {
    id: 'role-1',
    key: 'admin',
    displayName: 'Administrator',
    description: 'Full access',
    status: 'active',
    isSystem: true,
    permissionCount: 1,
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}

function permission(id: string, key: string, displayName: string): PermissionSummary {
  return { id, key, displayName, category: 'Roles', status: 'active', sortOrder: 0 };
}
