import DashboardNavbarActions from './dashboard-navbar-actions';

export default function DashboardNavbar() {
  return (
    <header className="fixed top-0 right-0 left-16.25 z-20 flex h-16 items-center border-b border-separator bg-surface px-6 shadow-card">
      <DashboardNavbarActions />
    </header>
  );
}
