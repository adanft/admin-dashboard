import Box from '@adanft/ui/box';

import SignUpForm from '@/features/auth/components/sign-up-form';

export default function SignUpPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground">
      <Box className="w-full max-w-lg" padding="default" shadow="default" surface="default">
        <section className="flex flex-col gap-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-heading">Setup</h1>
            <p className="text-sm text-muted">Configure the initial dashboard account.</p>
          </div>
          <SignUpForm />
        </section>
      </Box>
    </main>
  );
}
