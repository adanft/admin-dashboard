import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AccountPage from './account/page';
import AccountSessionsPage from './account/sessions/page';
import AuditLogsPage from './audit-logs/page';
import DashboardPage from './page';
import PermissionsPage from './permissions/page';
import RolesPage from './roles/page';
import SystemStatusPage from './system/status/page';

const pages = [
  { title: 'Dashboard', Page: DashboardPage },
  { title: 'My Account', Page: AccountPage },
  { title: 'My sessions', Page: AccountSessionsPage },
  { title: 'Roles', Page: RolesPage },
  { title: 'Permissions', Page: PermissionsPage },
  { title: 'Audit Logs', Page: AuditLogsPage },
  { title: 'System Status', Page: SystemStatusPage },
] as const;

describe('dashboard placeholder pages', () => {
  it.each(pages)(
    'renders the $title title without adding a nested main landmark',
    ({ Page, title }) => {
      const markup = renderToStaticMarkup(<Page />);

      expect(markup).toContain(title);
      expect(markup.match(/<main\b/g)).toBeNull();
    },
  );

  it('links from My Account to account sessions', () => {
    const markup = renderToStaticMarkup(<AccountPage />);

    expect(markup).toContain('href="/account/sessions"');
    expect(markup).toContain('Manage my sessions');
  });
});
