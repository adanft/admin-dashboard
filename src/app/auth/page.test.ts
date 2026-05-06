import { describe, expect, it, vi } from 'vitest';

import AuthPage from './page';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('AuthPage', () => {
  it('redirects the default auth entry to sign-in', () => {
    expect(() => AuthPage()).toThrow('NEXT_REDIRECT:/auth/sign-in');
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });
});
