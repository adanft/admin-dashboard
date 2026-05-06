import Breadcrumbs from '@adanft/ui/breadcrumbs';
import Link from 'next/link';
import { Fragment } from 'react';

type DashboardUserBreadcrumbsProps =
  | {
      currentPage: 'Edit' | 'Roles';
      userHref: string;
      userLabel: string;
    }
  | {
      currentPage?: never;
      userHref?: never;
      userLabel: string;
    };

export default function DashboardUserBreadcrumbs({
  currentPage,
  userHref,
  userLabel,
}: DashboardUserBreadcrumbsProps) {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { href: '/users', label: 'Users' },
    { href: currentPage ? userHref : undefined, label: userLabel },
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
