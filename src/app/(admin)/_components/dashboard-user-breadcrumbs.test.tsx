import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardUserBreadcrumbs from './dashboard-user-breadcrumbs';

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

describe('DashboardUserBreadcrumbs', () => {
  it('renders the user name as the current detail breadcrumb', () => {
    const markup = renderToStaticMarkup(<DashboardUserBreadcrumbs userLabel="Ada Lovelace" />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain('Dashboard');
    expect(markup).toContain('href="/users"');
    expect(markup).toContain('Users');
    expect(markup).toContain('Ada Lovelace');
  });

  it('links the user detail breadcrumb before the edit page', () => {
    const markup = renderToStaticMarkup(
      <DashboardUserBreadcrumbs
        currentPage="Edit"
        userHref="/users/user-1"
        userLabel="Ada Lovelace"
      />,
    );

    expect(markup).toContain('href="/users/user-1"');
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('Edit');
  });
});
