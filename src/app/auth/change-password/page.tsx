import Box from '@adanft/ui/box';
import { redirect } from 'next/navigation';

import { getRequiredPasswordChangeSession } from '@/lib/auth/session';
import RequiredPasswordChangeForm from './change-password-form';

export default async function RequiredPasswordChangePage() {
  const session = await getRequiredPasswordChangeSession();

  if (!session?.accessToken) {
    redirect('/auth/sign-in');
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground">
      <Box className="w-full max-w-sm" padding="default" shadow="default" surface="default">
        <section className="flex flex-col gap-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-heading">Change Password</h1>
            <p className="text-sm text-muted">
              Set a new password before signing in to the dashboard.
            </p>
          </div>
          <RequiredPasswordChangeForm />
        </section>
      </Box>
    </main>
  );
}
