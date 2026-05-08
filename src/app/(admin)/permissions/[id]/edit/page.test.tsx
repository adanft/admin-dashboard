// biome-ignore-all lint/nursery/noSecrets: Permissions UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { PermissionProfile } from '@/server/api/permissions';
import { getSession } from '@/server/auth/session';
import EditPermissionPage from './page';

const getPermissionMock = vi.hoisted(() => vi.fn<() => Promise<PermissionProfile>>());

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/permissions/edit', false]),
  };
});

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/server/api/permissions', async () => {
  const actual = await vi.importActual<typeof import('@/server/api/permissions')>(
    '@/server/api/permissions',
  );

  return {
    ...actual,
    permissionsApi: {
      getPermission: getPermissionMock,
    },
  };
});

vi.mock('@/features/permissions/actions/permission-actions', () => ({
  updatePermissionAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('EditPermissionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getPermissionMock.mockResolvedValue(permissionProfile());
  });

  it('loads the permission and renders editable metadata with disabled key', async () => {
    const markup = await renderEditPage('perm-1');

    expect(getPermissionMock).toHaveBeenCalledWith('perm-1', 'admin-token');
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Permissions');
    expect(markup).toContain('href="/permissions/perm-1"');
    expect(markup).toContain('Edit Read permissions');
    expect(markup).toContain('name="id"');
    expect(markup).toContain('value="perm-1"');
    expect(markup).toContain('name="key"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('name="displayName"');
    expect(markup).toContain('name="description"');
    expect(markup).toContain('name="category"');
    expect(markup).toContain('name="sortOrder"');
    expect(markup).not.toContain('name="status"');
    expect(markup).toContain('Update');
  });

  it('renders not-found without a mutation form when the permission cannot be loaded', async () => {
    getPermissionMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderEditPage('missing-permission');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Permission not found');
    expect(markup).not.toContain('type="submit"');
  });
});

async function renderEditPage(id: string) {
  return renderToStaticMarkup(await EditPermissionPage({ params: Promise.resolve({ id }) }));
}

function permissionProfile(): PermissionProfile {
  return {
    id: 'perm-1',
    key: 'permissions.read',
    displayName: 'Read permissions',
    description: 'Inspect permissions',
    category: 'Permissions',
    status: 'active',
    sortOrder: 10,
  };
}
