import Box from '@adanft/ui/box';

import { RoleRouteMessage } from '../route-message';
import type { RoleRouteState } from '../route-state';
import RolePermissionsManager from './role-permissions-manager';

type RolePermissionsPageContentProps = {
  roleLabel: string | null;
  state: RoleRouteState;
};

export default function RolePermissionsPageContent({
  roleLabel,
  state,
}: RolePermissionsPageContentProps) {
  return (
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
          permissionsWarning={state.permissionsWarning}
          roleId={state.role.id}
        />
      ) : (
        <RoleRouteMessage state={state} />
      )}
    </section>
  );
}
