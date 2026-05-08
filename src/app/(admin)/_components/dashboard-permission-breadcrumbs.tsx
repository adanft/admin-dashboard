import DashboardBreadcrumbTrail from './dashboard-breadcrumb-trail';

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

  return <DashboardBreadcrumbTrail breadcrumbs={breadcrumbs} />;
}
