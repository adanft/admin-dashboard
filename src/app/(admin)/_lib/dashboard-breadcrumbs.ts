import { type DashboardNavigationHref, dashboardNavigation } from './dashboard-navigation';

export type DashboardBreadcrumb = {
  href?: '/' | DashboardNavigationHref;
  label: string;
};

const dashboardBreadcrumb = { href: '/', label: 'Dashboard' } as const;

const navigationBreadcrumbs = new Map(
  dashboardNavigation.flatMap((section) =>
    section.items.map((item) => [item.href, item.label] as const),
  ),
);

const userRouteBreadcrumbs = {
  new: 'New User',
} as const;

export function getDashboardBreadcrumbs(pathname: string): DashboardBreadcrumb[] {
  if (pathname === '/') {
    return [{ label: dashboardBreadcrumb.label }];
  }

  const directLabel = navigationBreadcrumbs.get(pathname as DashboardNavigationHref);

  if (directLabel) {
    return [dashboardBreadcrumb, { label: directLabel }];
  }

  if (pathname === '/account/sessions') {
    return [dashboardBreadcrumb, { href: '/account', label: 'My Account' }, { label: 'Sessions' }];
  }

  if (pathname === '/users/new') {
    return [
      dashboardBreadcrumb,
      { href: '/users', label: 'Users' },
      { label: userRouteBreadcrumbs.new },
    ];
  }

  return [{ label: dashboardBreadcrumb.label }];
}
