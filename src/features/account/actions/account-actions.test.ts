import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changePasswordAction, logoutAllSessionsAction } from './account-actions';

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  clearRefreshCookie: vi.fn(),
  clearSession: vi.fn(),
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'refresh-token' })),
  })),
  getSession: vi.fn(),
  logoutAll: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

class MockAdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message = 'backend error') {
    super(message);
    this.status = status;
  }
}

vi.mock('@/server/api/account', () => ({
  accountApi: {
    changePassword: mocks.changePassword,
    logoutAll: mocks.logoutAll,
  },
  isAdminApiError: (error: unknown) => error instanceof MockAdminApiError,
}));

vi.mock('@/server/auth/session', () => ({
  clearRefreshCookie: mocks.clearRefreshCookie,
  clearSession: mocks.clearSession,
  getSession: mocks.getSession,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('changePasswordAction', () => {
  it('validates required password fields before calling the backend', async () => {
    const result = await changePasswordAction({}, new FormData());

    expect(result).toEqual({
      status: 'error',
      message: 'Review the highlighted fields and try again.',
      fieldErrors: {
        currentPassword: 'Current password is required.',
        newPassword: 'New password is required.',
      },
    });
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('submits a personal password change with the current access token', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    const formData = new FormData();
    formData.set('currentPassword', 'current-secret');
    formData.set('newPassword', 'new-secret');

    await expect(changePasswordAction({}, formData)).resolves.toEqual({
      status: 'success',
      message: 'Password updated. Already-issued access tokens expire naturally.',
    });
    expect(mocks.changePassword).toHaveBeenCalledWith(
      { currentPassword: 'current-secret', newPassword: 'new-secret' },
      'access-token',
    );
  });

  it('maps unauthorized password changes to a reauthentication message', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    mocks.changePassword.mockRejectedValueOnce(new MockAdminApiError(401));
    const formData = new FormData();
    formData.set('currentPassword', 'current-secret');
    formData.set('newPassword', 'new-secret');

    await expect(changePasswordAction({}, formData)).resolves.toEqual({
      status: 'error',
      message: 'Your session expired. Please sign in again.',
    });
  });

  it('maps backend bad request password details to a safe fixed message', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    mocks.changePassword.mockRejectedValueOnce(
      new MockAdminApiError(400, 'new password does not meet policy'),
    );
    const formData = new FormData();
    formData.set('currentPassword', 'current-secret');
    formData.set('newPassword', 'weak-secret');

    await expect(changePasswordAction({}, formData)).resolves.toEqual({
      status: 'error',
      message:
        'We could not update your password. Check that your current password is correct and that the new password meets the password policy.',
    });
  });

  it('uses a user-friendly bad request fallback when the backend provides no message', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    mocks.changePassword.mockRejectedValueOnce(new MockAdminApiError(400, ''));
    const formData = new FormData();
    formData.set('currentPassword', 'current-secret');
    formData.set('newPassword', 'new-secret');

    await expect(changePasswordAction({}, formData)).resolves.toEqual({
      status: 'error',
      message:
        'We could not update your password. Check that your current password is correct and that the new password meets the password policy.',
    });
  });
});

describe('logoutAllSessionsAction', () => {
  it('revokes all refresh sessions, clears local auth cookies, and redirects to sign in', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });

    await expect(logoutAllSessionsAction({})).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.logoutAll).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('clears local auth cookies and redirects when no access token remains', async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    await expect(logoutAllSessionsAction({})).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.logoutAll).not.toHaveBeenCalled();
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
  });

  it('returns an error without clearing local auth cookies when logout-all fails', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    mocks.logoutAll.mockRejectedValueOnce(new Error('backend unavailable'));

    await expect(logoutAllSessionsAction({})).resolves.toEqual({
      status: 'error',
      message: 'Unable to log out all sessions right now. Try again later.',
    });
    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).not.toHaveBeenCalled();
  });
});
