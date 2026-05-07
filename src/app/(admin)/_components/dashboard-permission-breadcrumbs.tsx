import Breadcrumbs from '@adanft/ui/breadcrumbs';
import Link from 'next/link';
import { Fragment } from 'react';

type DashboardPermissionBreadcrumbsProps =
  | {
      currentPage: 'Edit';
      permissionHref: string;
      permissionLabel: string;
    }
  | {
      currentPage?: never;
      permissionHref?: never;
      permissionLabel: string;
    };

export default function DashboardPermissionBreadcrumbs({
  currentPage,
  permissionHref,
  permissionLabel,
}: DashboardPermissionBreadcrumbsProps) {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { href: '/permissions', label: 'Permissions' },
    { href: currentPage ? permissionHref : undefined, label: permissionLabel },
    ...(currentPage ? [{ label: currentPage }] : []),
  ];

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
