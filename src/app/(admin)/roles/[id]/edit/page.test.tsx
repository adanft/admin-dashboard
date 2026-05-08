// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { RoleProfile } from '@/lib/api/roles';
import { getSession } from '@/server/auth/session';
import EditRolePage from './page';

const getRoleMock = vi.hoisted(() => vi.fn<() => Promise<RoleProfile>>());
const listRolePermissionsMock = vi.hoisted(() => vi.fn());
const listPermissionsMock = vi.hoisted(() => vi.fn());

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/roles/edit', false]),
  };
});

vi.mock('@/server/auth/session', () => ({
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

vi.mock('@/lib/api/permissions', () => ({
  permissionsApi: { listPermissions: listPermissionsMock },
}));

vi.mock('../../_lib/role-actions', () => ({
  createRoleAction: vi.fn(),
  updateRoleAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('EditRolePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getRoleMock.mockResolvedValue(roleProfile());
  });

  it('loads the role and renders editable display fields with a disabled key', async () => {
    const markup = await renderEditPage('role-2');

    expect(getRoleMock).toHaveBeenCalledWith('role-2', 'admin-token');
    expect(listRolePermissionsMock).not.toHaveBeenCalled();
    expect(listPermissionsMock).not.toHaveBeenCalled();
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Roles');
    expect(markup).toContain('href="/roles/role-2"');
    expect(markup).toContain('Edit Operator');
    expect(markup).toContain('name="id"');
    expect(markup).toContain('value="role-2"');
    expect(markup).toContain('name="key"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('name="status"');
    expect(markup).toContain('Update');
    expect(markup).not.toContain('Assign permission');
  });

  it('explains that system roles cannot be edited', async () => {
    getRoleMock.mockResolvedValue({ ...roleProfile(), isSystem: true });

    const markup = await renderEditPage('role-2');

    expect(markup).toContain('System role protected');
    expect(markup).toContain('cannot be edited in this dashboard');
    expect(markup).not.toContain('name="displayName"');
  });

  it('renders not-found without a mutation form when the role cannot be loaded', async () => {
    getRoleMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderEditPage('missing-role');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Role not found');
    expect(markup).not.toContain('type="submit"');
  });
});

async function renderEditPage(id: string) {
  return renderToStaticMarkup(await EditRolePage({ params: Promise.resolve({ id }) }));
}

function roleProfile(): RoleProfile {
  return {
    id: 'role-2',
    key: 'operator',
    displayName: 'Operator',
    status: 'disabled',
    isSystem: false,
    permissionCount: 0,
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}
