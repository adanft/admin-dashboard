import { describe, expect, it } from 'vitest';

import { getDashboardBreadcrumbs } from './dashboard-breadcrumbs';

describe('getDashboardBreadcrumbs', () => {
  it('returns only the current dashboard page for the admin root', () => {
    expect(getDashboardBreadcrumbs('/')).toEqual([{ label: 'Dashboard' }]);
  });

  it('uses dashboard navigation labels for top-level admin destinations', () => {
    expect(getDashboardBreadcrumbs('/users')).toEqual([
      { href: '/', label: 'Dashboard' },
      { label: 'Users' },
    ]);

    expect(getDashboardBreadcrumbs('/system/status')).toEqual([
      { href: '/', label: 'Dashboard' },
      { label: 'System Status' },
    ]);
  });

  it('adds stable child labels for account and users subroutes', () => {
    expect(getDashboardBreadcrumbs('/account/sessions')).toEqual([
      { href: '/', label: 'Dashboard' },
      { href: '/account', label: 'My Account' },
      { label: 'Sessions' },
    ]);

    expect(getDashboardBreadcrumbs('/users/new')).toEqual([
      { href: '/', label: 'Dashboard' },
      { href: '/users', label: 'Users' },
      { label: 'New User' },
    ]);
  });
});
