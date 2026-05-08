'use client';

import Breadcrumbs from '@adanft/ui/breadcrumbs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { getDashboardBreadcrumbs } from '../_shell/dashboard-breadcrumbs';

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

  return (
    <div className="px-6 pt-6">
      <Breadcrumbs>
        <Breadcrumbs.List>
          {breadcrumbs.map((breadcrumb, index) => {
            const isCurrentPage = index === breadcrumbs.length - 1;

            return (
              <Fragment key={`${breadcrumb.label}-${index}`}>
                <Breadcrumbs.Item>
                  {isCurrentPage || !breadcrumb.href ? (
                    <Breadcrumbs.Page>{breadcrumb.label}</Breadcrumbs.Page>
                  ) : (
                    <Breadcrumbs.Link asChild>
                      <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                    </Breadcrumbs.Link>
                  )}
                </Breadcrumbs.Item>
                {!isCurrentPage ? <Breadcrumbs.Separator /> : null}
              </Fragment>
            );
          })}
        </Breadcrumbs.List>
      </Breadcrumbs>
    </div>
  );
}
