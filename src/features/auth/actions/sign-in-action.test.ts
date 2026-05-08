import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInAction } from './sign-in-action';

const mocks = vi.hoisted(() => {
  class MockAdminApiError extends Error {
    readonly status: number;

    constructor(status: number) {
      super('api error');
      this.status = status;
    }
  }

  return {
    authApi: {
      login: vi.fn(),
    },
    clearRefreshCookie: vi.fn(),
    clearRequiredPasswordChangeSession: vi.fn(),
    clearSession: vi.fn(),
    MockAdminApiError,
    redirect: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    persistRefreshCookie: vi.fn(),
    setRequiredPasswordChangeSessionFromAuthData: vi.fn(),
    setSessionFromAuthData: vi.fn(),
  };
});

vi.mock('@/lib/api/client', () => ({
  authApi: mocks.authApi,
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/server/auth/session', () => ({
  clearRefreshCookie: mocks.clearRefreshCookie,
  clearRequiredPasswordChangeSession: mocks.clearRequiredPasswordChangeSession,
  clearSession: mocks.clearSession,
  persistRefreshCookie: mocks.persistRefreshCookie,
  setRequiredPasswordChangeSessionFromAuthData: mocks.setRequiredPasswordChangeSessionFromAuthData,
  setSessionFromAuthData: mocks.setSessionFromAuthData,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('sign in action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists a usable login session and redirects to the dashboard', async () => {
    const sessionData = { accessToken: 'token', expiresIn: 3600 };
    mocks.authApi.login.mockResolvedValue({ data: sessionData });
    mocks.setSessionFromAuthData.mockResolvedValue(true);

    await expect(signInAction({}, createSignInFormData())).rejects.toThrow('NEXT_REDIRECT:/');

    expect(mocks.authApi.login).toHaveBeenCalledWith({ identity: 'ada', password: 'secret' });
    expect(mocks.setSessionFromAuthData).toHaveBeenCalledWith(sessionData);
    expect(mocks.redirect).toHaveBeenCalledWith('/');
  });

  it('copies the backend refresh cookie when login provides one', async () => {
    const sessionData = { accessToken: 'token', expiresIn: 3600 };
    const refreshCookie = { maxAge: 604_800, value: 'refresh-token' };
    mocks.authApi.login.mockResolvedValue({ data: sessionData, refreshCookie });
    mocks.setSessionFromAuthData.mockResolvedValue(true);

    await expect(signInAction({}, createSignInFormData())).rejects.toThrow('NEXT_REDIRECT:/');

    expect(mocks.persistRefreshCookie).toHaveBeenCalledWith(refreshCookie);
  });

  it('routes required password change logins without creating a full dashboard session', async () => {
    const sessionData = {
      accessToken: 'temporary-token',
      expiresIn: 900,
      requiredAction: 'change_password',
    };
    mocks.authApi.login.mockResolvedValue({ data: sessionData });
    mocks.setRequiredPasswordChangeSessionFromAuthData.mockResolvedValue(true);

    await expect(signInAction({}, createSignInFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/auth/change-password',
    );

    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
    expect(mocks.setRequiredPasswordChangeSessionFromAuthData).toHaveBeenCalledWith(sessionData);
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/change-password');
    expect(mocks.setSessionFromAuthData).not.toHaveBeenCalled();
    expect(mocks.persistRefreshCookie).not.toHaveBeenCalled();
  });

  it('returns an error when required password change lacks a usable temporary token', async () => {
    mocks.authApi.login.mockResolvedValue({
      data: { requiredAction: 'change_password' },
    });
    mocks.setRequiredPasswordChangeSessionFromAuthData.mockResolvedValue(false);

    await expect(signInAction({}, createSignInFormData())).resolves.toEqual({
      error: 'We couldn’t start password change. Please try again.',
    });

    expect(mocks.clearRequiredPasswordChangeSession).toHaveBeenCalled();
    expect(mocks.setSessionFromAuthData).not.toHaveBeenCalled();
    expect(mocks.persistRefreshCookie).not.toHaveBeenCalled();
  });

  it.each([400, 401])(
    'returns the generic invalid sign-in message for status %i',
    async (status) => {
      mocks.authApi.login.mockRejectedValue(new mocks.MockAdminApiError(status));

      await expect(signInAction({}, createSignInFormData())).resolves.toEqual({
        error: 'Invalid username or password.',
      });
      expect(mocks.clearSession).toHaveBeenCalled();
    },
  );
});

function createSignInFormData() {
  const formData = new FormData();
  formData.set('identity', 'ada');
  formData.set('password', 'secret');
  return formData;
}
