import DashboardBreadcrumbTrail from './dashboard-breadcrumb-trail';

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

  return <DashboardBreadcrumbTrail breadcrumbs={breadcrumbs} />;
}
