import PermissionDetailPageContent from '@/features/permissions/components/permission-detail-page';
import { loadPermissionRouteState } from '@/features/permissions/route-state';
import DashboardPermissionBreadcrumbs from '../../_components/dashboard-permission-breadcrumbs';

type PermissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PermissionDetailPage({ params }: PermissionDetailPageProps) {
  const { id } = await params;
  const state = await loadPermissionRouteState(id);
  const permissionLabel = state.status === 'success' ? state.permission.displayName : null;

  return (
    <>
      {permissionLabel ? (
        <DashboardPermissionBreadcrumbs permissionLabel={permissionLabel} />
      ) : null}
      <PermissionDetailPageContent state={state} />
    </>
  );
}
