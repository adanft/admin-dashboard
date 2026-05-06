import { describe, expect, it, vi } from 'vitest';

import { logoutAction } from './logout-action';

const mocks = vi.hoisted(() => ({
  authLogout: vi.fn(),
  clearSession: vi.fn(),
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'refresh-token' })),
  })),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/lib/api/client', () => ({
  authApi: {
    logout: mocks.authLogout,
  },
}));

vi.mock('@/lib/auth/session', () => ({
  clearSession: mocks.clearSession,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('logoutAction', () => {
  it('logs out the backend refresh session, clears the admin session, and redirects to sign in', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.authLogout).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('still clears the admin session and redirects when backend logout fails', async () => {
    mocks.authLogout.mockRejectedValueOnce(new Error('backend unavailable'));

    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });
});
