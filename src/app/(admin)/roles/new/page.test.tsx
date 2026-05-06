// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public field names and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSession } from '@/lib/auth/session';
import NewRolePage from './page';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/roles/new', false]),
  };
});

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('../_lib/role-actions', () => ({
  createRoleAction: vi.fn(),
  updateRoleAction: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

describe('NewRolePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
  });

  it('renders the create route with role key and display fields', async () => {
    const markup = renderToStaticMarkup(await NewRolePage());

    expect(markup).toContain('Create role');
    expect(markup).toContain('name="key"');
    expect(markup).toContain('Role key');
    expect(markup).toContain('name="displayName"');
    expect(markup).toContain('name="description"');
    expect(markup).not.toContain('name="status"');
    expect(markup).not.toContain('Assign permission');
  });

  it('shows an expired-session state instead of the create form without a session token', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await NewRolePage());

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your session expired. Please sign in again.');
    expect(markup).not.toContain('name="key"');
  });
});
