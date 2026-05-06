import Box from '@adanft/ui/box';

import DashboardRoleBreadcrumbs from '../../../_components/dashboard-role-breadcrumbs';
import RolePermissionsManager from '../../_components/role-permissions-manager';
import { loadRoleRouteState, RoleRouteMessage } from '../../_lib/route-state';

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
      <section className="space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">
            {roleLabel ? `Modify ${roleLabel} permissions` : 'Modify role permissions'}
          </h1>
          <p className="max-w-prose text-foreground">
            Choose the access capabilities granted to this role. Changes are saved as one permission
            set.
          </p>
        </header>

        {state.status === 'success' && state.role.isSystem ? (
          <Box className="space-y-2" padding="default" role="alert">
            <h2 className="text-xl font-semibold text-heading">System role protected</h2>
            <p className="text-foreground">
              System role permissions are managed by the backend and cannot be changed here.
            </p>
          </Box>
        ) : state.status === 'success' ? (
          <RolePermissionsManager
            assignedPermissions={state.assignedPermissions}
            availablePermissions={state.availablePermissions}
            permissionsError={state.permissionsError}
            roleId={state.role.id}
          />
        ) : (
          <RoleRouteMessage state={state} />
        )}
      </section>
    </>
  );
}
