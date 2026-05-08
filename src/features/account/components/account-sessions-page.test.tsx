import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSessionsState } from '@/server/api/account';
import { getSession } from '@/server/auth/session';
import AccountSessionsPage from './account-sessions-page';

const getSessionsMock = vi.hoisted(() => vi.fn<() => Promise<AuthSessionsState>>());
const cookieGetMock = vi.hoisted(() => vi.fn(() => ({ value: 'refresh-token' })));

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: cookieGetMock })),
}));

vi.mock('@/server/api/account', async () => {
  const actual =
    await vi.importActual<typeof import('@/server/api/account')>('@/server/api/account');

  return {
    ...actual,
    accountApi: {
      getSessions: getSessionsMock,
    },
  };
});

vi.mock('../actions/session-actions', () => ({
  revokeSessionAction: '/account/sessions/revoke',
}));

const getSessionMock = vi.mocked(getSession);

describe('AccountSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGetMock.mockReturnValue({ value: 'refresh-token' });
    getSessionMock.mockResolvedValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 60_000,
    });
    getSessionsMock.mockResolvedValue(successState());
  });

  it('renders active sessions with current marker and revoke actions', async () => {
    const markup = await renderSessionsPage();

    expect(markup).toContain('Sessions');
    expect(markup).not.toContain('My Sessions');
    expect(markup).not.toContain('Back to My Account');
    expect(markup).toContain('session-1');
    expect(markup).toContain('family-1');
    expect(markup).toContain('session');
    expect(markup).toContain('family');
    expect(markup).toContain('Current');
    expect(markup).toContain('true');
    expect(markup).not.toContain('IP:');
    expect(markup).not.toContain('User agent:');
    expect(markup).toContain('name="sessionId"');
    expect(markup).toContain('value="session-1"');
    expect(markup).toContain('aria-label="Revoke current session and sign out"');
    expect(markup).toContain('title="Revoke current session and sign out"');
    expect(markup).not.toContain('Revoke and sign out');
    expect(markup).not.toContain('access tokens are revoked immediately');
    expect(getSessionsMock).toHaveBeenCalledWith('access-token', 'refresh-token');
  });

  it('renders the empty state', async () => {
    getSessionsMock.mockResolvedValue({ status: 'success', data: [] });

    const markup = await renderSessionsPage();

    expect(markup).toContain('No active sessions found');
    expect(markup).toContain('Sign in again if you expected to see an active session.');
  });

  it('renders unauthorized state when no session token is available', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderSessionsPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your session expired or is invalid.');
    expect(markup).toContain('Sign in again to continue.');
    expect(getSessionsMock).not.toHaveBeenCalled();
  });

  it('renders backend load errors without revoke forms', async () => {
    getSessionsMock.mockResolvedValue({
      status: 'error',
      message: 'Unable to load your sessions right now.',
    });

    const markup = await renderSessionsPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Unable to load your sessions right now.');
    expect(markup).toContain('Refresh the page or try again later.');
    expect(markup).not.toContain('name="sessionId"');
  });
});

async function renderSessionsPage() {
  return renderToStaticMarkup(await AccountSessionsPage());
}

function successState(): AuthSessionsState {
  return {
    status: 'success',
    data: [
      {
        id: 'session-1',
        familyId: 'family-1',
        createdAt: '2026-05-08T10:00:00.000Z',
        expiresAt: '2026-05-09T10:00:00.000Z',
        isCurrent: true,
      },
    ],
  };
}
