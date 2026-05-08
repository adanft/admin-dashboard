import RolePermissionsPageContent from '@/features/roles/components/role-permissions-page';
import { loadRoleRouteState } from '@/features/roles/route-state';
import DashboardRoleBreadcrumbs from '../../../_components/dashboard-role-breadcrumbs';

type RolePermissionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RolePermissionsPage({ params }: RolePermissionsPageProps) {
  const { id } = await params;
  const state = await loadRoleRouteState(id);
  const roleLabel = state.status === 'success' ? state.role.displayName : null;

  return (
    <>
      {roleLabel ? (
        <DashboardRoleBreadcrumbs
          currentPage="Permissions"
          roleHref={`/roles/${id}`}
          roleLabel={roleLabel}
        />
      ) : null}
      <RolePermissionsPageContent roleLabel={roleLabel} state={state} />
    </>
  );
}
