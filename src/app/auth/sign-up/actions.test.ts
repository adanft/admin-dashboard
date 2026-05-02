import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signUpAction } from './actions';

const mocks = vi.hoisted(() => ({
  authApi: {
    register: vi.fn(),
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  setSessionFromAuthData: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  authApi: mocks.authApi,
}));

vi.mock('@/lib/auth/session', () => ({
  setSessionFromAuthData: mocks.setSessionFromAuthData,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('sign up action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to sign-in after setup succeeds without usable session data', async () => {
    const responseData = { accessToken: undefined };
    mocks.authApi.register.mockResolvedValue(responseData);
    mocks.setSessionFromAuthData.mockResolvedValue(false);

    await expect(signUpAction({}, createSignUpFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/auth/sign-in',
    );

    expect(mocks.authApi.register).toHaveBeenCalledWith({
      name: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      password: 'secret',
    });
    expect(mocks.setSessionFromAuthData).toHaveBeenCalledWith(responseData);
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('persists returned setup session data and redirects to the dashboard', async () => {
    const responseData = { accessToken: 'token', expiresIn: 3600 };
    mocks.authApi.register.mockResolvedValue(responseData);
    mocks.setSessionFromAuthData.mockResolvedValue(true);

    await expect(signUpAction({}, createSignUpFormData())).rejects.toThrow('NEXT_REDIRECT:/');

    expect(mocks.setSessionFromAuthData).toHaveBeenCalledWith(responseData);
    expect(mocks.redirect).toHaveBeenCalledWith('/');
  });
});

function createSignUpFormData() {
  const formData = new FormData();
  formData.set('name', 'Ada');
  formData.set('lastName', 'Lovelace');
  formData.set('username', 'ada');
  formData.set('email', 'ada@example.com');
  formData.set('password', 'secret');
  return formData;
}
