import Breadcrumbs from '@adanft/ui/breadcrumbs';
import Link from 'next/link';
import { Fragment } from 'react';

type DashboardRoleBreadcrumbsProps =
  | {
      currentPage: 'Edit' | 'Permissions';
      roleHref: string;
      roleLabel: string;
    }
  | {
      currentPage?: never;
      roleHref?: never;
      roleLabel: string;
    };

export default function DashboardRoleBreadcrumbs({
  currentPage,
  roleHref,
  roleLabel,
}: DashboardRoleBreadcrumbsProps) {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { href: '/roles', label: 'Roles' },
    { href: currentPage ? roleHref : undefined, label: roleLabel },
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
