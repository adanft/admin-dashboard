import Box from '@adanft/ui/box';
import Image from 'next/image';

import SignInForm from '@/features/auth/components/sign-in-form';

type SignInPageProps = {
  searchParams?: Promise<{ passwordChanged?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const passwordChanged = params.passwordChanged === '1';

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground">
      <Box className="w-full max-w-sm" padding="default" shadow="default" surface="default">
        <section className="flex flex-col gap-6">
          <div className="space-y-4 text-center">
            <Image
              src="/logo.png"
              alt="Admin dashboard logo"
              width={72}
              height={72}
              priority
              className="mx-auto"
            />
            <h1 className="text-3xl font-bold text-heading">Sign In</h1>
            <p className="text-sm text-muted">
              Enter your username and password to access the dashboard.
            </p>
          </div>
          {passwordChanged ? (
            <p aria-live="polite" className="text-sm text-success">
              Password updated. Sign in with your new password.
            </p>
          ) : null}
          <SignInForm />
        </section>
      </Box>
    </main>
  );
}
