import { cookies } from 'next/headers';

import type { AdminSession } from '@/server/auth/session-cookie';
import DashboardProfileAction from './dashboard-profile-action';
import DashboardThemeSwitch from './dashboard-theme-switch';

type DashboardNavbarActionsProps = {
  session: AdminSession;
};

export default async function DashboardNavbarActions({ session }: DashboardNavbarActionsProps) {
  const isDark = (await cookies()).get('theme')?.value === 'dark';

  return (
    <div className="ml-auto flex items-center gap-4">
      <DashboardThemeSwitch initialDark={isDark} />
      {session.user ? <DashboardProfileAction user={session.user} /> : null}
    </div>
  );
}
