import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/session';
import DashboardSidebar from './dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  return (
    <>
      <DashboardSidebar />
      <main
        className="min-h-dvh bg-background pl-16.25 text-foreground"
        data-dashboard-sidebar-offset="compact"
      >
        {children}
      </main>
    </>
  );
}
