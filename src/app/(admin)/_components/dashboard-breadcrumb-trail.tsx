import Breadcrumbs from '@adanft/ui/breadcrumbs';
import Link from 'next/link';
import { Fragment } from 'react';

export type DashboardBreadcrumbItem = {
  href?: string;
  label: string;
};

type DashboardBreadcrumbTrailProps = {
  breadcrumbs: DashboardBreadcrumbItem[];
};

export default function DashboardBreadcrumbTrail({ breadcrumbs }: DashboardBreadcrumbTrailProps) {
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
