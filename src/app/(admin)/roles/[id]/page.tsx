import RoleDetailPageContent from '@/features/roles/components/role-detail-page';
import { loadRoleDetailRouteState } from '@/features/roles/route-state';
import DashboardRoleBreadcrumbs from '../../_components/dashboard-role-breadcrumbs';

type RoleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params;
  const state = await loadRoleDetailRouteState(id);
  const roleLabel = state.status === 'success' ? state.role.displayName : null;

  return (
    <>
      {roleLabel ? <DashboardRoleBreadcrumbs roleLabel={roleLabel} /> : null}
      <RoleDetailPageContent state={state} />
    </>
  );
}
