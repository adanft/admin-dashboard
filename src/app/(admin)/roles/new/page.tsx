import Box from '@adanft/ui/box';

import RoleForm from '../_components/role-form';
import { hasCreateRoleSession, RoleRouteMessage } from '../_lib/route-state';

export default async function NewRolePage() {
  const hasSession = await hasCreateRoleSession();

  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">Create role</h1>
        <p className="max-w-prose text-foreground">
          Add a stable key and display details for the new admin role.
        </p>
      </header>

      {hasSession ? (
        <Box padding="default">
          <RoleForm mode="create" />
        </Box>
      ) : (
        <RoleRouteMessage
          state={{
            status: 'unauthorized',
            title: 'Your session expired. Please sign in again.',
            guidance: 'Sign in again to continue.',
          }}
        />
      )}
    </section>
  );
}
