import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signInAction } from './actions';

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
    clearSession: vi.fn(),
    MockAdminApiError,
    redirect: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    setSessionFromAuthData: vi.fn(),
  };
});

vi.mock('@/lib/api/client', () => ({
  authApi: mocks.authApi,
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/lib/auth/session', () => ({
  clearSession: mocks.clearSession,
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
    mocks.authApi.login.mockResolvedValue(sessionData);
    mocks.setSessionFromAuthData.mockResolvedValue(true);

    await expect(signInAction({}, createSignInFormData())).rejects.toThrow('NEXT_REDIRECT:/');

    expect(mocks.authApi.login).toHaveBeenCalledWith({ identity: 'ada', password: 'secret' });
    expect(mocks.setSessionFromAuthData).toHaveBeenCalledWith(sessionData);
    expect(mocks.redirect).toHaveBeenCalledWith('/');
  });

  it.each([400, 401])(
    'returns the generic invalid sign-in message for status %i',
    async (status) => {
      mocks.authApi.login.mockRejectedValue(new mocks.MockAdminApiError(status));

      await expect(signInAction({}, createSignInFormData())).resolves.toEqual({
        error: 'Invalid identity or password.',
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
