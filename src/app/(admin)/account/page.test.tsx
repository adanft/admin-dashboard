import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CurrentAccountState } from '@/lib/api/auth';
import { getSession } from '@/lib/auth/session';
import AccountPage from './page';

const getCurrentAccountMock = vi.hoisted(() => vi.fn<() => Promise<CurrentAccountState>>());

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/account/action', false]),
  };
});

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/auth')>('@/lib/api/auth');

  return {
    ...actual,
    authApi: {
      getCurrentAccount: getCurrentAccountMock,
    },
  };
});

const getSessionMock = vi.mocked(getSession);

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 60_000,
    });
    getCurrentAccountMock.mockResolvedValue(successState());
  });

  it('renders essential current account details and assigned roles', async () => {
    const markup = await renderAccountPage();

    expect(markup).toContain('<h1');
    expect(markup).toContain('My Account');
    expect(markup).toContain('Review your account details.');
    expect(markup).toMatch(/<h2[^>]*>Ada Lovelace<\/h2>/);
    expect(markup).toContain('First name');
    expect(markup).toContain('Ada');
    expect(markup).toContain('Last name');
    expect(markup).toContain('Lovelace');
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('Username');
    expect(markup).toContain('@ada');
    expect(markup).toContain('Email');
    expect(markup).toContain('ada@example.com');
    expect(markup).not.toContain('Status');
    expect(markup).toContain('active');
    expect(markup).not.toContain('Actor ID');
    expect(markup).not.toContain('user-1');
    expect(markup).not.toContain('Full name');
    expect(markup).toContain('Roles');
    expect(markup).toContain('Owner');
    expect(markup).toContain('System');
    expect(markup).not.toContain('System role');
    expect(markup).not.toContain('Effective permissions');
    expect(markup).not.toContain('users.read');
    expect(markup).not.toContain('roles.read');
    expect(markup).toContain('href="/account/sessions"');
    expect(markup).toContain('Manage my sessions');
    expect(getCurrentAccountMock).toHaveBeenCalledWith('access-token');
  });

  it('renders alternate profile summary values with field labels', async () => {
    getCurrentAccountMock.mockResolvedValue(
      successState({
        actor: {
          id: 'user-2',
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
          status: 'disabled',
        },
      }),
    );

    const markup = await renderAccountPage();

    expect(markup).toMatch(/<h2[^>]*>Grace Hopper<\/h2>/);
    expect(markup).toContain('@grace');
    expect(markup).toContain('grace@example.com');
    expect(markup).toContain('disabled');
    expect(markup).toContain('First name');
    expect(markup).toContain('Last name');
    expect(markup).toContain('Username');
    expect(markup).toContain('Email');
    expect(markup).not.toContain('Status');
  });

  it('renders an empty roles state without effective permissions', async () => {
    getCurrentAccountMock.mockResolvedValue(successState({ roles: [] }));

    const markup = await renderAccountPage();

    expect(markup).toContain('Roles');
    expect(markup).toContain('No roles assigned.');
    expect(markup).not.toContain('Effective permissions');
    expect(markup).not.toContain('users.read');
    expect(markup).not.toContain('roles.read');
  });

  it('renders the change password and logout-all forms without claiming immediate token revocation', async () => {
    const markup = await renderAccountPage();

    expect(markup).toContain('Change password');
    expect(markup).toContain('name="currentPassword"');
    expect(markup).toContain('name="newPassword"');
    expect(markup).toContain('Log out all sessions');
    expect(markup).toContain('already-issued access tokens expire naturally');
    expect(markup).not.toContain('access tokens are revoked immediately');
  });

  it('renders distinct expired-session state when no session token is available', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderAccountPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your session expired or is invalid.');
    expect(markup).toContain('Sign in again to continue.');
    expect(getCurrentAccountMock).not.toHaveBeenCalled();
  });

  it('renders backend account load errors without account forms', async () => {
    getCurrentAccountMock.mockResolvedValue({
      status: 'forbidden',
      message: 'You do not have permission to view this account.',
    });

    const markup = await renderAccountPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('You do not have permission to view this account.');
    expect(markup).not.toContain('name="currentPassword"');
  });
});

async function renderAccountPage() {
  return renderToStaticMarkup(await AccountPage());
}

function successState(
  overrides: Partial<Extract<CurrentAccountState, { status: 'success' }>['data']> = {},
): CurrentAccountState {
  return {
    status: 'success',
    data: {
      actor: {
        id: 'user-1',
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        status: 'active',
      },
      roles: [
        {
          id: 'role-1',
          key: 'owner',
          displayName: 'Owner',
          status: 'active',
          isSystem: true,
        },
      ],
      ...overrides,
    },
  };
}
