import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardSidebar from './dashboard-sidebar';

const mocks = vi.hoisted(() => ({
  pathname: vi.fn(() => '/'),
}));

vi.mock('next/navigation', () => ({
  usePathname: mocks.pathname,
}));

// biome-ignore lint/nursery/noSecrets: Test subject name is not a secret.
describe('DashboardSidebar', () => {
  it('renders branded semantic navigation without account subsections as top-level links', () => {
    mocks.pathname.mockReturnValue('/');

    const markup = renderToStaticMarkup(<DashboardSidebar />);

    // biome-ignore lint/nursery/noSecrets: Static accessibility label assertion, not a secret.
    expect(markup).toContain('aria-label="Dashboard navigation"');
    expect(markup).toContain('Admin dashboard logo');
    expect(markup).toContain('href="/account"');
    expect(markup).toContain('My Account');
    expect(markup).not.toContain('href="/account/sessions"');
    expect(markup).not.toContain('My sessions');
    expect(markup).toContain('href="/users"');
    expect(markup).toContain('href="/roles"');
    expect(markup).toContain('href="/permissions"');
    expect(markup).toContain('href="/audit-logs"');
    expect(markup).toContain('href="/system/status"');
    expect(markup).not.toContain('/auth/sign-in');
    expect(markup).not.toContain('/auth/sign-up');
  });

  it('marks an exact or descendant matching navigation item as the current page', () => {
    mocks.pathname.mockReturnValue('/users/123');

    const markup = renderToStaticMarkup(<DashboardSidebar />);

    expect(markup).toContain('href="/users"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain('href="/" aria-current="page"');
  });

  it('keeps only My Account current for account subsection routes', () => {
    mocks.pathname.mockReturnValue('/account/sessions');

    const markup = renderToStaticMarkup(<DashboardSidebar />);

    expect(markup).toContain('aria-current="page" href="/account"');
    expect(markup).not.toContain('href="/account/sessions" aria-current="page"');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it('keeps the authenticated root route out of sidebar navigation items', () => {
    mocks.pathname.mockReturnValue('/');

    const markup = renderToStaticMarkup(<DashboardSidebar />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('href="/" aria-current="page"');
    expect(markup).not.toContain('>Dashboard</span>');
  });

  it('does not mark any navigation item current for unknown future routes', () => {
    mocks.pathname.mockReturnValue('/future-unlisted-route');

    const markup = renderToStaticMarkup(<DashboardSidebar />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('aria-current="page"');
  });
});
