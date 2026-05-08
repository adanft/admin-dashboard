import EditRolePageContent from '@/features/roles/components/edit-role-page';
import { loadRoleProfileRouteState } from '@/features/roles/route-state';
import DashboardRoleBreadcrumbs from '../../../_components/dashboard-role-breadcrumbs';

type EditRolePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id } = await params;
  const state = await loadRoleProfileRouteState(id);
  const roleLabel = state.status === 'success' ? state.role.displayName : null;

  return (
    <>
      {roleLabel ? (
        <DashboardRoleBreadcrumbs
          currentPage="Edit"
          roleHref={`/roles/${id}`}
          roleLabel={roleLabel}
        />
      ) : null}
      <EditRolePageContent roleLabel={roleLabel} state={state} />
    </>
  );
}
