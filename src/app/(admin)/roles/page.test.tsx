// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public component copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RolesListQuery, RolesListState } from '@/lib/api/roles';
import { getSession } from '@/lib/auth/session';
import RolesPage from './page';

const listRolesMock = vi.hoisted(() => vi.fn<() => Promise<RolesListState>>());

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/roles', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/roles')>('@/lib/api/roles');

  return {
    ...actual,
    rolesApi: {
      listRoles: listRolesMock,
    },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/roles',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const getSessionMock = vi.mocked(getSession);

describe('RolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    listRolesMock.mockResolvedValue(successState());
  });

  it('renders roles in table columns and protects system role actions', async () => {
    const markup = await renderRolesPage();

    expect(markup).toContain('<h1');
    expect(markup).toContain('Roles');
    expect(markup).toContain('Manage admin roles and the permissions assigned to each role.');
    expect(markup).toContain('<table');
    expect(markup).toContain('Role');
    expect(markup).toContain('Status');
    expect(markup).toContain('Protected');
    expect(markup).toContain('Actions');
    expect(markup).toContain('Administrator');
    expect(markup).toContain('admin');
    expect(markup).toContain('System');
    expect(markup).toContain('True');
    expect(markup).toContain('New Role');
    expect(markup).toContain('href="/roles/new"');
    expect(markup).toContain('href="/roles/role-1"');
    expect(markup).toContain('aria-label="View role Administrator"');
    expect(markup).not.toContain('Protected system role');
    expect(markup).not.toContain('href="/roles/role-1/edit"');
    expect(markup).not.toContain('aria-label="Delete Administrator"');
  });

  it('forwards normalized URL query params and renders the search filter only', async () => {
    const markup = await renderRolesPage({ search: '  admin  ', limit: '25', offset: '50' });

    expect(listRolesMock).toHaveBeenCalledWith(
      { search: 'admin', limit: 25, offset: 50 } satisfies RolesListQuery,
      'admin-token',
    );
    expect(markup).toContain('name="search"');
    expect(markup).toContain('Search by key or display name');
    expect(markup).toContain('value="admin"');
    expect(markup).not.toContain('name="status"');
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Apply<\/button>/);
  });

  it('renders pagination around the table', async () => {
    const markup = await renderRolesPage();

    expect(markup).toContain('roles per page:');
    expect(markup).toContain('Showing 1–1 of 1 roles');
  });

  it('renders empty and error states distinctly', async () => {
    listRolesMock.mockResolvedValue({
      status: 'success',
      data: { rows: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    });

    expect(await renderRolesPage({ search: 'nobody' })).toContain('No roles found');

    listRolesMock.mockResolvedValue({
      status: 'forbidden',
      message: 'You do not have permission to view roles.',
    });

    const markup = await renderRolesPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Ask an administrator for roles.read access.');
  });

  it('renders expired session state without calling the API', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderRolesPage();

    expect(markup).toContain('Your session expired or is invalid.');
    expect(listRolesMock).not.toHaveBeenCalled();
  });
});

async function renderRolesPage(params: Record<string, string> = {}) {
  return renderToStaticMarkup(await RolesPage({ searchParams: Promise.resolve(params) }));
}

function successState(): RolesListState {
  return {
    status: 'success',
    data: {
      rows: [
        {
          id: 'role-1',
          key: 'admin',
          displayName: 'Administrator',
          description: 'Full access',
          status: 'active',
          isSystem: true,
          permissionCount: 3,
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
      total: 1,
    },
  };
}
