// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSession } from '@/lib/auth/session';
import NewUserPage from './page';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/users/new', false]),
  };
});

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('../actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('NewUserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
  });

  it('renders the create route with a temporary password form and no excluded controls', async () => {
    const markup = renderToStaticMarkup(await NewUserPage());

    expect(markup).toContain('<h1');
    expect(markup).toContain('Create user');
    expect(markup).toContain('name="temporaryPassword"');
    expect(markup).toContain('Temporary password');
    expect(markup).not.toContain('Back to users');
    expect(markup).not.toContain('Assign role');
    expect(markup).not.toContain('Change status');
    expect(markup).not.toContain('Revoke sessions');
  });

  it('shows an expired-session state instead of the create form without a session token', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await NewUserPage());

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your session expired. Please sign in again.');
    expect(markup).not.toContain('name="temporaryPassword"');
  });
});
