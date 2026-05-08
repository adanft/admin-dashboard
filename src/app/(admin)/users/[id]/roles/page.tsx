import { getUserProfileLabel } from '@/features/users/components/user-label';
import UserRolesPageContent from '@/features/users/components/user-roles-page';
import { loadUserRolesRouteState } from '@/features/users/route-state';
import DashboardUserBreadcrumbs from '../../../_components/dashboard-user-breadcrumbs';

type UserRolesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserRolesPage({ params }: UserRolesPageProps) {
  const { id } = await params;
  const state = await loadUserRolesRouteState(id);
  const userLabel = state.status === 'success' ? getUserProfileLabel(state.user) : null;

  return (
    <>
      {userLabel ? (
        <DashboardUserBreadcrumbs
          currentPage="Roles"
          userHref={`/users/${id}`}
          userLabel={userLabel}
        />
      ) : null}
      <UserRolesPageContent state={state} />
    </>
  );
}
