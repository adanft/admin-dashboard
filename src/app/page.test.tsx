import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import Home from './page';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: mocks.getSession,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

describe('Home page', () => {
  it('renders only the centered Dashboard heading for authenticated users', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 60_000 });

    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Dashboard');
    expect(markup).toContain('place-items-center');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Create the first admin');
  });
});
