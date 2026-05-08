import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RequiredPasswordChangePage from './page';

const mocks = vi.hoisted(() => ({
  getRequiredPasswordChangeSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getRequiredPasswordChangeSession: mocks.getRequiredPasswordChangeSession,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('./change-password-form', () => ({
  default: () => <form aria-label="Required password change form" />,
}));

describe('RequiredPasswordChangePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the required password change form when temporary auth context exists', async () => {
    mocks.getRequiredPasswordChangeSession.mockResolvedValue({ accessToken: 'temporary-token' });

    const markup = renderToStaticMarkup(await RequiredPasswordChangePage());

    expect(markup).toContain('Change Password');
    expect(markup).toContain('Set a new password before signing in to the dashboard.');
    expect(markup).toContain('Required password change form');
  });

  it('redirects to sign-in when temporary auth context is missing', async () => {
    mocks.getRequiredPasswordChangeSession.mockResolvedValue(null);

    await expect(RequiredPasswordChangePage()).rejects.toThrow('NEXT_REDIRECT:/auth/sign-in');
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });
});
