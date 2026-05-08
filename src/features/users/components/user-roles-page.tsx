import UserRolesManager from '@/features/users/components/user-roles-manager';
import { UserRouteMessage } from '@/features/users/route-message';
import type { UserRolesRouteState } from '@/features/users/route-state';
import { getUserProfileLabel } from './user-label';

type UserRolesPageContentProps = {
  state: UserRolesRouteState;
};

export default function UserRolesPageContent({ state }: UserRolesPageContentProps) {
  const userLabel = state.status === 'success' ? getUserProfileLabel(state.user) : null;

  return (
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
  );
}
