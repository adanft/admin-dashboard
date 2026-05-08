import Box from '@adanft/ui/box';

import UserProfileForm from '@/features/users/components/user-profile-form';
import { UserRouteMessage } from '@/features/users/route-message';
import type { UserRouteState } from '@/features/users/route-state';
import { getUserProfileLabel } from './user-label';

type EditUserPageContentProps = {
  state: UserRouteState;
};

export default function EditUserPageContent({ state }: EditUserPageContentProps) {
  const userLabel = state.status === 'success' ? getUserProfileLabel(state.user) : null;

  return (
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
  );
}
