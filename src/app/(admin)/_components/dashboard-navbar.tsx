import type { AdminSession } from '@/server/auth/session-cookie';
import DashboardNavbarActions from './dashboard-navbar-actions';

type DashboardNavbarProps = {
  session: AdminSession;
};

export default function DashboardNavbar({ session }: DashboardNavbarProps) {
  return (
    <header className="fixed top-0 right-0 left-16.25 z-20 flex h-16 items-center border-b border-separator bg-surface px-6 shadow-card">
      <DashboardNavbarActions session={session} />
    </header>
  );
}
