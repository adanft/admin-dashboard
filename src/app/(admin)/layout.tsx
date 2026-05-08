import { redirect } from 'next/navigation';

import { getSession } from '@/server/auth/session';
import DashboardBreadcrumbs from './_components/dashboard-breadcrumbs';
import DashboardNavbar from './_components/dashboard-navbar';
import DashboardSidebar from './_components/dashboard-sidebar';

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
      <DashboardNavbar session={session} />
      <DashboardSidebar />
      <main className="min-h-dvh bg-background pt-16 pl-16.25 text-foreground">
        <DashboardBreadcrumbs />
        {children}
      </main>
    </>
  );
}
