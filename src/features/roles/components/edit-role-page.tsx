import Box from '@adanft/ui/box';

import type { RoleRouteState } from '../route-state';
import { RoleRouteMessage } from '../route-state';
import RoleForm from './role-form';

type EditRolePageContentProps = {
  roleLabel: string | null;
  state: RoleRouteState;
};

export default function EditRolePageContent({ roleLabel, state }: EditRolePageContentProps) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">
          {roleLabel ? `Edit ${roleLabel}` : 'Edit role'}
        </h1>
        <p className="max-w-prose text-foreground">
          Update role display details and status. The role key stays stable after creation.
        </p>
      </header>

      {state.status === 'success' && state.role.isSystem ? (
        <Box className="space-y-2" padding="default" role="alert">
          <h2 className="text-xl font-semibold text-heading">System role protected</h2>
          <p className="text-foreground">
            System roles are managed by the backend and cannot be edited in this dashboard.
          </p>
        </Box>
      ) : state.status === 'success' ? (
        <Box padding="default">
          <RoleForm mode="edit" role={state.role} />
        </Box>
      ) : (
        <RoleRouteMessage state={state} />
      )}
    </section>
  );
}
