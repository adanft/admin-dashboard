// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import type { UserProfile } from '@/lib/api/users';
import { getSession } from '@/lib/auth/session';
import EditUserPage from './page';

const getUserMock = vi.hoisted(() => vi.fn<() => Promise<UserProfile>>());

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/users/edit', false]),
  };
});

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

vi.mock('../../actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('EditUserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    getUserMock.mockResolvedValue(profile());
  });

  it('loads the user and renders edit-only profile fields', async () => {
    const markup = await renderEditPage('user-2');

    expect(getUserMock).toHaveBeenCalledWith('user-2', 'admin-token');
    expect(markup).toContain('Edit Grace Hopper');
    expect(markup).toContain('name="id"');
    expect(markup).toContain('value="user-2"');
    expect(markup).toContain('Update');
    expect(markup).not.toContain('temporaryPassword');
    expect(markup).not.toContain('Assign role');
    expect(markup).not.toContain('Change status');
    expect(markup).not.toContain('Revoke sessions');
  });

  it('renders not-found without a mutation form when the profile cannot be loaded', async () => {
    getUserMock.mockRejectedValue(new AdminApiError({ message: 'not found', status: 404 }));

    const markup = await renderEditPage('missing-user');

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('User not found');
    expect(markup).not.toContain('type="submit"');
  });
});

async function renderEditPage(id: string) {
  return renderToStaticMarkup(await EditUserPage({ params: Promise.resolve({ id }) }));
}

function profile(): UserProfile {
  return {
    id: 'user-2',
    name: 'Grace',
    lastName: 'Hopper',
    username: 'grace',
    email: 'grace@example.com',
    status: 'active',
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-02-03T04:05:06.000Z',
  };
}
