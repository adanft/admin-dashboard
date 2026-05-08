import { beforeEach, describe, expect, it, vi } from 'vitest';

import { revokeSessionAction } from './session-actions';

const mocks = vi.hoisted(() => ({
  clearRefreshCookie: vi.fn(),
  clearSession: vi.fn(),
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'refresh-token' })),
  })),
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    revokeSession: mocks.revokeSession,
  },
}));

vi.mock('@/server/auth/session', () => ({
  clearRefreshCookie: mocks.clearRefreshCookie,
  clearSession: mocks.clearSession,
  getSession: mocks.getSession,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
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

describe('revokeSessionAction', () => {
  it('rejects empty session ids before calling the backend', async () => {
    const formData = new FormData();

    await expect(revokeSessionAction(formData)).resolves.toBeUndefined();
    expect(mocks.revokeSession).not.toHaveBeenCalled();
  });

  it('revokes a session with the current access token and refresh cookie', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    const formData = new FormData();
    formData.set('sessionId', 'session-1');

    await expect(revokeSessionAction(formData)).resolves.toBeUndefined();

    expect(mocks.revokeSession).toHaveBeenCalledWith('session-1', 'access-token', 'refresh-token');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/account/sessions');
    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).not.toHaveBeenCalled();
  });

  it('clears local auth cookies and redirects after revoking the current session', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    const formData = new FormData();
    formData.set('sessionId', 'session-1');
    formData.set('isCurrent', 'true');

    await expect(revokeSessionAction(formData)).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.revokeSession).toHaveBeenCalledWith('session-1', 'access-token', 'refresh-token');
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('clears local auth cookies and redirects when no access token remains', async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.set('sessionId', 'session-1');

    await expect(revokeSessionAction(formData)).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');

    expect(mocks.revokeSession).not.toHaveBeenCalled();
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).toHaveBeenCalled();
  });

  it('returns an error when revoke fails', async () => {
    mocks.getSession.mockResolvedValueOnce({ accessToken: 'access-token' });
    mocks.revokeSession.mockRejectedValueOnce(new Error('backend unavailable'));
    const formData = new FormData();
    formData.set('sessionId', 'session-1');

    await expect(revokeSessionAction(formData)).resolves.toBeUndefined();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.clearRefreshCookie).not.toHaveBeenCalled();
  });
});
