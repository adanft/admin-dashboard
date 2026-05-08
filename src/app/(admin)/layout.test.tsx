import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardLayout from './layout';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  pathname: vi.fn(() => '/'),
  push: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/server/auth/session', () => ({
  getSession: mocks.getSession,
}));

vi.mock('./_components/dashboard-navbar-actions', () => ({
  default: () => (
    <div className="ml-auto flex items-center gap-4">
      <span>Toggle theme</span>
      <span>AD</span>
    </div>
  ),
}));

vi.mock('./_components/dashboard-breadcrumbs', () => ({
  default: () => <nav aria-label="Breadcrumb">Dashboard breadcrumbs</nav>,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

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

    expect(markup).toContain('aria-label="Dashboard navigation"');
    expect(markup).toContain('Dashboard logo');
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('Dashboard breadcrumbs');
    expect(markup).toContain('Private dashboard');
    expect(markup.match(/<main\b/g)).toHaveLength(1);
    expect(markup).toContain('h-16');
    expect(markup).toContain('border-b');
    expect(markup).toContain('shadow-card');
    expect(markup).toContain('Toggle theme');
    expect(markup).toContain('AD');
  });

  it('separates the active admin sections in the authenticated dashboard layout', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 60_000 });

    const markup = renderToStaticMarkup(await DashboardLayout({ children: <h1>Dashboard</h1> }));

    expect(markup).toContain('Dashboard');
    expect(markup).toContain('Account');
    expect(markup).toContain('Administration');
    expect(markup).not.toContain('Operations');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Register');
  });
});
