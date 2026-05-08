import EditPermissionPageContent from '@/features/permissions/components/edit-permission-page';
import { loadPermissionRouteState } from '@/features/permissions/route-state';
import DashboardPermissionBreadcrumbs from '../../../_components/dashboard-permission-breadcrumbs';

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
      <EditPermissionPageContent permissionLabel={permissionLabel} state={state} />
    </>
  );
}
