import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requiredPasswordChangeAction } from './change-password-action';

const mocks = vi.hoisted(() => {
  class MockAdminApiError extends Error {
    readonly status: number;

    constructor(status: number, message = 'api error') {
      super(message);
      this.status = status;
    }
  }

  return {
    authApi: {
      changePassword: vi.fn(),
    },
    clearRefreshCookie: vi.fn(),
    clearRequiredPasswordChangeSession: vi.fn(),
    clearSession: vi.fn(),
    getRequiredPasswordChangeSession: vi.fn(),
    MockAdminApiError,
    redirect: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
  };
});

vi.mock('@/lib/api/auth', () => ({
  authApi: mocks.authApi,
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/server/auth/session', () => ({
  clearRefreshCookie: mocks.clearRefreshCookie,
  clearRequiredPasswordChangeSession: mocks.clearRequiredPasswordChangeSession,
  clearSession: mocks.clearSession,
  getRequiredPasswordChangeSession: mocks.getRequiredPasswordChangeSession,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('required password change action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes the password with the temporary token, clears local auth cookies, and returns to sign-in', async () => {
    mocks.getRequiredPasswordChangeSession.mockResolvedValue({ accessToken: 'temporary-token' });
    mocks.authApi.changePassword.mockResolvedValue({ id: 'user-1' });

    await expect(requiredPasswordChangeAction({}, createPasswordFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/auth/sign-in?passwordChanged=1',
    );

    expect(mocks.authApi.changePassword).toHaveBeenCalledWith(
      { currentPassword: 'temporary-secret', newPassword: 'new-secret' },
      'temporary-token',
    );
    expect(mocks.clearRequiredPasswordChangeSession).toHaveBeenCalled();
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in?passwordChanged=1');
  });

  it('returns field errors without calling the backend for incomplete form data', async () => {
    const formData = new FormData();
    formData.set('currentPassword', 'temporary-secret');

    await expect(requiredPasswordChangeAction({}, formData)).resolves.toEqual({
      status: 'error',
      message: 'Review the highlighted fields and try again.',
      fieldErrors: { newPassword: 'New password is required.' },
    });

    expect(mocks.authApi.changePassword).not.toHaveBeenCalled();
  });

  it('returns an expired-session error when the temporary token is unavailable', async () => {
    mocks.getRequiredPasswordChangeSession.mockResolvedValue(null);

    await expect(requiredPasswordChangeAction({}, createPasswordFormData())).resolves.toEqual({
      status: 'error',
      message: 'Your password change session expired. Sign in again to continue.',
    });

    expect(mocks.clearRequiredPasswordChangeSession).toHaveBeenCalled();
    expect(mocks.authApi.changePassword).not.toHaveBeenCalled();
  });

  it('maps backend validation failures to a password policy error message', async () => {
    mocks.getRequiredPasswordChangeSession.mockResolvedValue({ accessToken: 'temporary-token' });
    mocks.authApi.changePassword.mockRejectedValue(
      new mocks.MockAdminApiError(400, 'password is too weak'),
    );

    await expect(requiredPasswordChangeAction({}, createPasswordFormData())).resolves.toEqual({
      status: 'error',
      message:
        'We could not update your password. Check that your current password is correct and that the new password meets the password policy. Details: password is too weak',
    });
  });
});

function createPasswordFormData() {
  const formData = new FormData();
  formData.set('currentPassword', 'temporary-secret');
  formData.set('newPassword', 'new-secret');
  return formData;
}
