// biome-ignore-all lint/nursery/noSecrets: Permissions UI tests assert public copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { PermissionProfile } from '@/lib/api/permissions';
import { getSession } from '@/server/auth/session';
import PermissionDetailPage from './page';

const getPermissionMock = vi.hoisted(() => vi.fn<() => Promise<PermissionProfile>>());

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/permissions', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/permissions')>('@/lib/api/permissions');

  return {
    ...actual,
    permissionsApi: {
      getPermission: getPermissionMock,
    },
  };
});

const getSessionMock = vi.mocked(getSession);

describe('PermissionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getPermissionMock.mockResolvedValue(permissionProfile());
  });

  it('loads and renders permission details with metadata edit affordance', async () => {
    const markup = await renderDetailPage('perm-1');

    expect(getPermissionMock).toHaveBeenCalledWith('perm-1', 'admin-token');
    expect(markup).toContain('Permission details');
    expect(markup).toContain('Read permissions');
    expect(markup).toContain('permissions.read');
    expect(markup).toContain('System');
    expect(markup).toContain('Permissions');
    expect(markup).toContain('Sort order');
    expect(markup).toContain('href="/permissions/perm-1/edit"');
    expect(markup).toContain('Edit');
    expect(markup).not.toContain('Delete');
  });

  it('renders not-found without edit link when the permission cannot be loaded', async () => {
    getPermissionMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderDetailPage('missing-permission');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Permission not found');
    expect(markup).not.toContain('Edit');
  });
});

async function renderDetailPage(id: string) {
  return renderToStaticMarkup(await PermissionDetailPage({ params: Promise.resolve({ id }) }));
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
