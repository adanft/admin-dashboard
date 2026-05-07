import Box from '@adanft/ui/box';

import DashboardPermissionBreadcrumbs from '../../../_components/dashboard-permission-breadcrumbs';
import PermissionForm from '../../_components/permission-form';
import { loadPermissionRouteState, PermissionRouteMessage } from '../../_lib/route-state';

type EditPermissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPermissionPage({ params }: EditPermissionPageProps) {
  const { id } = await params;
  const state = await loadPermissionRouteState(id);
  const permissionLabel = state.status === 'success' ? state.permission.displayName : null;

  return (
    <>
      {permissionLabel ? (
        <DashboardPermissionBreadcrumbs
          currentPage="Edit"
          permissionHref={`/permissions/${id}`}
          permissionLabel={permissionLabel}
        />
      ) : null}
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
    </>
  );
}
