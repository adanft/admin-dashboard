import UserDetailPageContent from '@/features/users/components/user-detail-page';
import { getUserProfileLabel } from '@/features/users/components/user-label';
import { loadUserRouteState } from '@/features/users/route-state';
import DashboardUserBreadcrumbs from '../../_components/dashboard-user-breadcrumbs';

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const state = await loadUserRouteState(id);

  const userLabel = state.status === 'success' ? getUserProfileLabel(state.user) : null;

  return (
    <>
      {userLabel ? <DashboardUserBreadcrumbs userLabel={userLabel} /> : null}
      <UserDetailPageContent state={state} />
    </>
  );
}
