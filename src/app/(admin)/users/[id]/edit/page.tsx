import Box from '@adanft/ui/box';

import DashboardUserBreadcrumbs from '../../../_components/dashboard-user-breadcrumbs';
import UserProfileForm from '../../_components/user-profile-form';
import { loadUserRouteState, UserRouteMessage } from '../../_lib/route-state';

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const state = await loadUserRouteState(id);

  const userLabel = state.status === 'success' ? profileLabel(state.user) : null;

  return (
    <>
      {userLabel ? (
        <DashboardUserBreadcrumbs
          currentPage="Edit"
          userHref={`/users/${id}`}
          userLabel={userLabel}
        />
      ) : null}
      <section className="space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">
            {userLabel ? `Edit ${userLabel}` : 'Edit user'}
          </h1>
          <p className="max-w-prose text-foreground">
            Update profile details only. Role, status, and sessions are managed outside this flow.
          </p>
        </header>

        {state.status === 'success' ? (
          <Box padding="default">
            <UserProfileForm mode="edit" user={state.user} />
          </Box>
        ) : (
          <UserRouteMessage state={state} />
        )}
      </section>
    </>
  );
}

function profileLabel(user: { lastName: string; name: string; username: string }) {
  return `${user.name} ${user.lastName}`.trim() || user.username;
}
