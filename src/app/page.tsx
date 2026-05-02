import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/session';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <h1 className="text-5xl font-bold text-heading">Dashboard</h1>
    </main>
  );
}
