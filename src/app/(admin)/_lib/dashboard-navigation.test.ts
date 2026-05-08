import { IdCard, UserRound } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { dashboardNavigation, isDashboardNavigationItemActive } from './dashboard-navigation';

describe('dashboardNavigation', () => {
  it('defines the future admin destinations separated by requirement section', () => {
    expect(
      dashboardNavigation.map((section) => ({
        label: section.label,
        items: section.items.map((item) => [item.label, item.href]),
      })),
    ).toEqual([
      {
        label: 'Account',
        items: [['My Account', '/account']],
      },
      {
        label: 'Administration',
        items: [
          ['Users', '/users'],
          ['Roles', '/roles'],
          ['Permissions', '/permissions'],
          ['Audit Logs', '/audit-logs'],
        ],
      },
    ]);
  });

  it('keeps public auth destinations out of authenticated navigation', () => {
    const hrefs = dashboardNavigation.flatMap((section) => section.items.map((item) => item.href));

    expect(hrefs).not.toContain('/');
    expect(hrefs).not.toContain('/system/status');
    expect(hrefs).not.toContain('/auth/sign-in');
    expect(hrefs).not.toContain('/auth/sign-up');
  });

  it('uses lucide icons instead of local SVG icon modules', () => {
    expect(dashboardNavigation[0].icon).toBe(UserRound);
    expect(dashboardNavigation[0].items[0]?.icon).toBe(IdCard);
  });
});

describe('isDashboardNavigationItemActive', () => {
  it('matches non-root items at exact and descendant pathnames only', () => {
    expect(isDashboardNavigationItemActive('/users', '/users')).toBe(true);
    expect(isDashboardNavigationItemActive('/users/123', '/users')).toBe(true);
    expect(isDashboardNavigationItemActive('/users-and-roles', '/users')).toBe(false);
  });

  it('treats account subsection routes as active for My Account', () => {
    expect(isDashboardNavigationItemActive('/account/sessions', '/account')).toBe(true);
  });
});
