import Box from '@adanft/ui/box';

import { RoleRouteMessage } from '../route-message';
import RoleForm from './role-form';

type CreateRolePageContentProps = {
  hasSession: boolean;
};

export default function CreateRolePageContent({ hasSession }: CreateRolePageContentProps) {
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
