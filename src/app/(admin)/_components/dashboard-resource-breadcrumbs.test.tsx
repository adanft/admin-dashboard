import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardPermissionBreadcrumbs from './dashboard-permission-breadcrumbs';
import DashboardRoleBreadcrumbs from './dashboard-role-breadcrumbs';

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

describe('dashboard resource breadcrumbs', () => {
  it('links the role detail breadcrumb before the permissions page', () => {
    const markup = renderToStaticMarkup(
      <DashboardRoleBreadcrumbs
        currentPage="Permissions"
        roleHref="/roles/role-1"
        roleLabel="Finance viewer"
      />,
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/roles"');
    expect(markup).toContain('href="/roles/role-1"');
    expect(markup).toContain('Finance viewer');
    expect(markup).toContain('Permissions');
  });

  it('links the permission detail breadcrumb before the edit page', () => {
    const markup = renderToStaticMarkup(
      <DashboardPermissionBreadcrumbs
        currentPage="Edit"
        permissionHref="/permissions/permission-1"
        permissionLabel="Read reports"
      />,
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/permissions"');
    expect(markup).toContain('href="/permissions/permission-1"');
    expect(markup).toContain('Read reports');
    expect(markup).toContain('Edit');
  });
});
