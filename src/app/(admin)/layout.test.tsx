import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardLayout from './layout';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  pathname: vi.fn(() => '/'),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: mocks.getSession,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: mocks.pathname,
}));

// biome-ignore lint/nursery/noSecrets: Test subject name is not a secret.
describe('DashboardLayout', () => {
  it('redirects missing sessions before rendering private dashboard content', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(DashboardLayout({ children: <h1>Private dashboard</h1> })).rejects.toThrow(
      'NEXT_REDIRECT:/auth/sign-in',
    );
    expect(mocks.redirect).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('wraps authenticated private content with admin navigation and one main landmark', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 60_000 });

    const markup = renderToStaticMarkup(
      await DashboardLayout({ children: <h1>Private dashboard</h1> }),
    );

    // biome-ignore lint/nursery/noSecrets: Static accessibility label assertion, not a secret.
    expect(markup).toContain('aria-label="Dashboard navigation"');
    expect(markup).toContain('Admin dashboard logo');
    expect(markup).toContain('Private dashboard');
    expect(markup.match(/<main\b/g)).toHaveLength(1);
    expect(markup).toContain('data-dashboard-sidebar-offset="compact"');
  });

  it('separates the future admin sections in the authenticated dashboard layout', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 60_000 });

    const markup = renderToStaticMarkup(await DashboardLayout({ children: <h1>Dashboard</h1> }));

    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Account');
    // biome-ignore lint/nursery/noSecrets: Static navigation label assertion, not a secret.
    expect(markup).toContain('Administration');
    expect(markup).toContain('Operations');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Register');
  });
});
