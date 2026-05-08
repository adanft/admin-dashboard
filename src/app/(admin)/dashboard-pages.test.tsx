import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DashboardPage from './page';

const adminPath = (...segments: string[]) =>
  join(process.cwd(), 'src', 'app', '(admin)', ...segments);

const featureRouteWrappers = [
  {
    importName: 'AccountPage',
    importPath: '@/features/account/components/account-page',
    route: ['account', 'page.tsx'],
    title: 'My Account',
  },
  {
    importName: 'AccountSessionsPage',
    importPath: '@/features/account/components/account-sessions-page',
    route: ['account', 'sessions', 'page.tsx'],
    title: 'Sessions',
  },
] as const;

const dataRoutes = [
  {
    importPath: '@/features/permissions/components/permissions-list-page',
    route: ['permissions', 'page.tsx'],
    title: 'Permissions',
  },
  {
    importPath: '@/features/audit-logs/components/audit-logs-list-page',
    route: ['audit-logs', 'page.tsx'],
    title: 'Audit Logs',
  },
] as const;

describe('dashboard pages', () => {
  it('renders the root dashboard title without adding a nested main landmark', () => {
    const markup = renderToStaticMarkup(<DashboardPage />);

    expect(markup).toContain('Dashboard');
    expect(markup.match(/<main\b/g)).toBeNull();
  });

  it.each(featureRouteWrappers)(
    'keeps $title owned by its feature page wrapper',
    ({ importName, importPath, route }) => {
      const source = readRouteSource(route);

      expect(source).toContain(`import ${importName} from '${importPath}';`);
      expect(source).toContain(`return <${importName} />;`);
      expect(source).not.toContain('<main');
    },
  );

  it.each(dataRoutes)('keeps $title route wired to its feature page', ({ importPath, route }) => {
    const source = readRouteSource(route);

    expect(source).toContain(importPath);
    expect(source).not.toContain('<main');
  });
});

function readRouteSource(route: readonly string[]) {
  return readFileSync(adminPath(...route), 'utf8');
}
