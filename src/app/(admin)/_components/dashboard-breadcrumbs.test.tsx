import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardBreadcrumbs from './dashboard-breadcrumbs';

const mocks = vi.hoisted(() => ({
  pathname: vi.fn(() => '/'),
}));

vi.mock('next/navigation', () => ({
  usePathname: mocks.pathname,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@adanft/ui/breadcrumbs', () => {
  function Root({ children }: { children: React.ReactNode }) {
    return <nav aria-label="Breadcrumb">{children}</nav>;
  }

  Root.List = ({ children }: { children: React.ReactNode }) => <ol>{children}</ol>;
  Root.Item = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;
  Root.Link = ({ children }: { children: React.ReactNode }) => children;
  Root.Page = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
  Root.Separator = () => <span>/</span>;

  return { default: Root };
});

describe('DashboardBreadcrumbs', () => {
  it('renders linked parent breadcrumbs and the current page', () => {
    mocks.pathname.mockReturnValue('/users/new');

    const markup = renderToStaticMarkup(<DashboardBreadcrumbs />);

    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('href="/users"');
    expect(markup).toContain('Users');
    expect(markup).toContain('New User');
  });

  it('does not render generic breadcrumbs for user detail routes', () => {
    mocks.pathname.mockReturnValue('/users/user-1/edit');

    const markup = renderToStaticMarkup(<DashboardBreadcrumbs />);

    expect(markup).toBe('');
  });

  it('does not render breadcrumbs for the admin root', () => {
    mocks.pathname.mockReturnValue('/');

    const markup = renderToStaticMarkup(<DashboardBreadcrumbs />);

    expect(markup).toBe('');
  });
});
