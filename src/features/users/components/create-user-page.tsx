import Box from '@adanft/ui/box';

import { UserRouteMessage } from '@/features/users/route-state';
import UserProfileForm from './user-profile-form';

export default function CreateUserPage({ hasSession }: { hasSession: boolean }) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">Create user</h1>
        <p className="max-w-prose text-foreground">
          Add profile details and a temporary password for the new admin user.
        </p>
      </header>

      {hasSession ? (
        <Box padding="default">
          <UserProfileForm mode="create" />
        </Box>
      ) : (
        <UserRouteMessage
          state={{
            status: 'unauthorized',
            title: 'Your session expired. Please sign in again.',
            guidance: 'Sign in again to continue.',
          }}
        />
      )}
    </section>
  );
}
