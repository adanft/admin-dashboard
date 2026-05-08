'use client';

import { usePathname } from 'next/navigation';

import { getDashboardBreadcrumbs } from '../_shell/dashboard-breadcrumbs';
import DashboardBreadcrumbTrail from './dashboard-breadcrumb-trail';

export default function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  if (
    pathname === '/' ||
    (pathname !== '/users/new' && pathname.match(/^\/users\/[^/]+/)) ||
    (pathname !== '/roles/new' && pathname.match(/^\/roles\/[^/]+/)) ||
    pathname.match(/^\/permissions\/[^/]+/)
  ) {
    return null;
  }

  return <DashboardBreadcrumbTrail breadcrumbs={breadcrumbs} />;
}
