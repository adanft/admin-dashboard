import { cookies } from 'next/headers';

import DashboardProfileAction from './dashboard-profile-action';
import DashboardThemeSwitch from './dashboard-theme-switch';

export default async function DashboardNavbarActions() {
  const isDark = (await cookies()).get('theme')?.value === 'dark';

  return (
    <div className="ml-auto flex items-center gap-4">
      <DashboardThemeSwitch initialDark={isDark} />
      <DashboardProfileAction />
    </div>
  );
}
