import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import AccountPage from './account/page';
import AccountSessionsPage from './account/sessions/page';
import AuditLogsPage from './audit-logs/page';
import DashboardPage from './page';
import PermissionsPage from './permissions/page';
import SystemStatusPage from './system/status/page';

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
  })),
}));

const pages = [
  { title: 'Dashboard', Page: DashboardPage },
  { title: 'My Account', Page: AccountPage },
  { title: 'Sessions', Page: AccountSessionsPage },
  { title: 'Permissions', Page: PermissionsPage },
  { title: 'Audit Logs', Page: AuditLogsPage },
  { title: 'System Status', Page: SystemStatusPage },
] as const;

describe('dashboard placeholder pages', () => {
  it.each(pages)(
    'renders the $title title without adding a nested main landmark',
    async ({ Page, title }) => {
      const markup = renderToStaticMarkup(await Page());

      expect(markup).toContain(title);
      expect(markup.match(/<main\b/g)).toBeNull();
    },
  );

  it('links from My Account to account sessions', async () => {
    const markup = renderToStaticMarkup(await AccountPage());

    expect(markup).toContain('href="/account/sessions"');
    expect(markup).toContain('Sessions');
  });
});
