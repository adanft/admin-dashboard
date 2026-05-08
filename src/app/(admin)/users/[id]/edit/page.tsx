import EditUserPageContent from '@/features/users/components/edit-user-page';
import { getUserProfileLabel } from '@/features/users/components/user-label';
import { loadUserRouteState } from '@/features/users/route-state';
import DashboardUserBreadcrumbs from '../../../_components/dashboard-user-breadcrumbs';

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const state = await loadUserRouteState(id);

  const userLabel = state.status === 'success' ? getUserProfileLabel(state.user) : null;

  return (
    <>
      {userLabel ? (
        <DashboardUserBreadcrumbs
          currentPage="Edit"
          userHref={`/users/${id}`}
          userLabel={userLabel}
        />
      ) : null}
      <EditUserPageContent state={state} />
    </>
  );
}
