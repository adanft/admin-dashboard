// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public component copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/server/api/client';
import type { RoleSummary, RolesListState } from '@/server/api/roles';
import type { UserProfile } from '@/server/api/users';
import { getSession } from '@/server/auth/session';
import UserRolesPage from './page';

const getUserMock = vi.hoisted(() => vi.fn<() => Promise<UserProfile>>());
const listRolesMock = vi.hoisted(() => vi.fn<() => Promise<RolesListState>>());

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/users/roles', false]),
  };
});

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/server/api/users', async () => {
  const actual = await vi.importActual<typeof import('@/server/api/users')>('@/server/api/users');

  return {
    ...actual,
    usersApi: {
      getUser: getUserMock,
    },
  };
});

vi.mock('@/server/api/roles', async () => {
  const actual = await vi.importActual<typeof import('@/server/api/roles')>('@/server/api/roles');

  return {
    ...actual,
    rolesApi: {
      listRoles: listRolesMock,
    },
  };
});

vi.mock('@/features/users/actions/user-actions', () => ({
  updateUserRolesAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('UserRolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue(profile());
    listRolesMock.mockResolvedValue({
      status: 'success',
      data: {
        rows: [role('role-1', 'admin', 'Administrator'), role('role-2', 'viewer', 'Viewer')],
        pagination: { total: 2, limit: 100, offset: 0 },
        total: 2,
      },
    });
  });

  it('renders a dedicated checkbox form for user roles', async () => {
    const markup = await renderRolesPage('user-1');

    expect(getUserMock).toHaveBeenCalledWith('user-1', 'admin-token');
    expect(listRolesMock).toHaveBeenCalledWith({ limit: 100, offset: 0 }, 'admin-token');
    expect(markup).toContain('Modify Ada Lovelace roles');
    expect(markup).toContain('href="/users/user-1"');
    expect(markup).toContain('name="roleIds"');
    expect(markup).toContain('admin');
    expect(markup).toContain('Administrator');
    expect(markup).toContain('viewer');
    expect(markup).toContain('Viewer');
    expect(markup).toContain('Save changes');
    expect(markup).toContain('Cancel');
  });

  it('warns when the available roles selector is truncated by the backend page size', async () => {
    listRolesMock.mockResolvedValue({
      status: 'success',
      data: {
        rows: [role('role-1', 'admin', 'Administrator')],
        pagination: { total: 125, limit: 100, offset: 0 },
        total: 125,
      },
    });

    const markup = await renderRolesPage('user-1');

    expect(markup).toContain(
      'Only the first 1 of 125 roles are available here. Some roles may be missing from this selector.',
    );
  });

  it('renders not-found without the role form', async () => {
    getUserMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderRolesPage('missing-user');

    expect(markup).toContain('User not found');
    expect(markup).not.toContain('name="roleIds"');
  });
});

async function renderRolesPage(id: string) {
  return renderToStaticMarkup(await UserRolesPage({ params: Promise.resolve({ id }) }));
}

function profile(): UserProfile {
  return {
    id: 'user-1',
    name: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    roles: [
      {
        id: 'role-1',
        key: 'admin',
        displayName: 'Administrator',
        status: 'active',
        isSystem: true,
      },
    ],
    status: 'active',
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}

function role(id: string, key: string, displayName: string): RoleSummary {
  return {
    id,
    key,
    displayName,
    status: 'active',
    isSystem: key === 'admin',
    permissionCount: 0,
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}
