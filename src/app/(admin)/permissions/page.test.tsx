// biome-ignore-all lint/nursery/noSecrets: Permissions UI tests assert public copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PermissionsListQuery, PermissionsListState } from '@/lib/api/permissions';
import { getSession } from '@/lib/auth/session';
import PermissionsPage from './page';

const listPermissionsMock = vi.hoisted(() => vi.fn<() => Promise<PermissionsListState>>());

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/permissions',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const getSessionMock = vi.mocked(getSession);

describe('PermissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    listPermissionsMock.mockResolvedValue(successState());
  });

  it('renders system permissions in table columns with metadata edit actions only', async () => {
    const markup = await renderPermissionsPage();

    expect(markup).toContain('<h1');
    expect(markup).toContain('Permissions');
    expect(markup).toContain('Inspect system-defined permissions and edit their display metadata.');
    expect(markup).toContain('<table');
    expect(markup).toContain('Permission');
    expect(markup).toContain('Category');
    expect(markup).toContain('Status');
    expect(markup).toContain('Sort order');
    expect(markup).toContain('Read permissions');
    expect(markup).toContain('permissions.read');
    expect(markup).toContain('href="/permissions/perm-1"');
    expect(markup).toContain('href="/permissions/perm-1/edit"');
    expect(markup).toContain('aria-label="View permission Read permissions"');
    expect(markup).not.toContain('New Permission');
    expect(markup).not.toContain('Delete Read permissions');
  });

  it('forwards normalized URL query params and renders the search filter', async () => {
    const markup = await renderPermissionsPage({ search: '  read  ', limit: '25', offset: '50' });

    expect(listPermissionsMock).toHaveBeenCalledWith('admin-token', {
      search: 'read',
      limit: 25,
      offset: 50,
    } satisfies PermissionsListQuery);
    expect(markup).toContain('name="search"');
    expect(markup).toContain('Search by key, display name, or category');
    expect(markup).toContain('value="read"');
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Apply<\/button>/);
  });

  it('renders pagination around the table', async () => {
    const markup = await renderPermissionsPage();

    expect(markup).toContain('permissions per page:');
    expect(markup).toContain('Showing 1–1 of 1 permissions');
  });

  it('renders empty and forbidden states distinctly', async () => {
    listPermissionsMock.mockResolvedValue({
      status: 'success',
      data: { permissions: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    });

    expect(await renderPermissionsPage({ search: 'nobody' })).toContain('No permissions found');

    listPermissionsMock.mockResolvedValue({
      status: 'forbidden',
      message: 'You do not have permission to view permissions.',
    });

    const markup = await renderPermissionsPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Ask an administrator for permissions.read access.');
  });

  it('renders expired session state without calling the API', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderPermissionsPage();

    expect(markup).toContain('Your session expired or is invalid.');
    expect(listPermissionsMock).not.toHaveBeenCalled();
  });
});

async function renderPermissionsPage(params: Record<string, string> = {}) {
  return renderToStaticMarkup(await PermissionsPage({ searchParams: Promise.resolve(params) }));
}

function successState(): PermissionsListState {
  return {
    status: 'success',
    data: {
      permissions: [
        {
          id: 'perm-1',
          key: 'permissions.read',
          displayName: 'Read permissions',
          description: 'Inspect permissions',
          category: 'Permissions',
          status: 'active',
          sortOrder: 10,
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
      total: 1,
    },
  };
}
