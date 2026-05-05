// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public component copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { UserProfile } from '@/lib/api/users';
import { getSession } from '@/lib/auth/session';
import UserDetailPage from './page';

const getUserMock = vi.hoisted(() => vi.fn<() => Promise<UserProfile>>());

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/users', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/users')>('@/lib/api/users');

  return {
    ...actual,
    usersApi: {
      getUser: getUserMock,
    },
  };
});

const getSessionMock = vi.mocked(getSession);

describe('UserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue(profile());
  });

  it('renders profile details with edit and delete actions without excluded controls', async () => {
    const markup = await renderDetailPage('user-1');

    expect(getUserMock).toHaveBeenCalledWith('user-1', 'admin-token');
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Users');
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('ada@example.com');
    expect(markup).toContain('href="/users/user-1/edit"');
    expect(markup).toContain('aria-label="Edit Ada Lovelace"');
    expect(markup).toContain('border-heading');
    expect(markup).toContain('text-heading');
    expect(markup).toContain('aria-label="Delete Ada Lovelace"');
    expect(markup).toContain('border-danger');
    expect(markup).toContain('text-danger');
    expect(markup).toContain('rounded-full');
    expect(markup).not.toContain('Type DELETE to confirm');
    expect(markup).not.toContain('Assign role');
    expect(markup).not.toContain('Change status');
    expect(markup).not.toContain('Revoke sessions');
  });

  it.each([
    [404, 'User not found', 'This user profile no longer exists.'],
    [401, 'Your session expired. Please sign in again.', 'Sign in again to continue.'],
    [
      403,
      'You do not have permission to view this user.',
      'Ask an administrator for users.read access.',
    ],
    [500, 'Unable to load this user right now.', 'Refresh the page or try again later.'],
  ] as const)('renders the distinct detail error state for %i', async (status, title, guidance) => {
    getUserMock.mockRejectedValue(new AdminApiError({ message: 'backend detail', status }));

    const markup = await renderDetailPage('missing-user');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain(title);
    expect(markup).toContain(guidance);
    expect(markup).not.toContain('Type DELETE to confirm');
    expect(markup).not.toContain('aria-label="Edit');
  });
});

async function renderDetailPage(id: string) {
  return renderToStaticMarkup(await UserDetailPage({ params: Promise.resolve({ id }) }));
}

function profile(): UserProfile {
  return {
    id: 'user-1',
    name: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    status: 'active',
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}
