import DashboardUserBreadcrumbs from '../../../_components/dashboard-user-breadcrumbs';
import UserRolesManager from '../../_components/user-roles-manager';
import { loadUserRolesRouteState, UserRouteMessage } from '../../_lib/route-state';

type UserRolesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserRolesPage({ params }: UserRolesPageProps) {
  const { id } = await params;
  const state = await loadUserRolesRouteState(id);
  const userLabel = state.status === 'success' ? profileLabel(state.user) : null;

  return (
    <>
      {userLabel ? (
        <DashboardUserBreadcrumbs
          currentPage="Roles"
          userHref={`/users/${id}`}
          userLabel={userLabel}
        />
      ) : null}
      <section className="space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">
            {userLabel ? `Modify ${userLabel} roles` : 'Modify user roles'}
          </h1>
          <p className="max-w-prose text-foreground">
            Choose the access profiles assigned to this user. Changes are saved as one role set.
          </p>
        </header>

        {state.status === 'success' ? (
          <UserRolesManager
            assignedRoles={state.user.roles}
            availableRoles={state.availableRoles}
            rolesError={state.rolesError}
            userId={state.user.id}
          />
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
