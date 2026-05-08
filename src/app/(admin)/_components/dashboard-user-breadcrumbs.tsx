import DashboardBreadcrumbTrail from './dashboard-breadcrumb-trail';

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

  return <DashboardBreadcrumbTrail breadcrumbs={breadcrumbs} />;
}
