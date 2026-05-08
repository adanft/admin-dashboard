import Box from '@adanft/ui/box';

import type { PermissionRouteState } from '../route-state';
import { PermissionRouteMessage } from '../route-state';
import PermissionForm from './permission-form';

type EditPermissionPageContentProps = {
  permissionLabel: string | null;
  state: PermissionRouteState;
};

export default function EditPermissionPageContent({
  permissionLabel,
  state,
}: EditPermissionPageContentProps) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">
          {permissionLabel ? `Edit ${permissionLabel}` : 'Edit permission'}
        </h1>
        <p className="max-w-prose text-foreground">
          Update display metadata only. Permission keys and status stay controlled by the backend.
        </p>
      </header>

      {state.status === 'success' ? (
        <Box padding="default">
          <PermissionForm permission={state.permission} />
        </Box>
      ) : (
        <PermissionRouteMessage state={state} />
      )}
    </section>
  );
}
