import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DashboardPage from './page';

const adminPath = (...segments: string[]) =>
  join(process.cwd(), 'src', 'app', '(admin)', ...segments);

const featureRouteWrappers = [
  {
    importPath: '@/features/account/components/account-page',
    route: ['account', 'page.tsx'],
    title: 'My Account',
  },
  {
    importPath: '@/features/account/components/account-sessions-page',
    route: ['account', 'sessions', 'page.tsx'],
    title: 'Sessions',
  },
] as const;

const serverRouteStateModules = [
  {
    feature: 'permissions',
    routeState: ['src', 'features', 'permissions', 'route-state.ts'],
    routeMessage: ['src', 'features', 'permissions', 'route-message.tsx'],
  },
  {
    feature: 'roles',
    routeState: ['src', 'features', 'roles', 'route-state.ts'],
    routeMessage: ['src', 'features', 'roles', 'route-message.tsx'],
  },
  {
    feature: 'users',
    routeState: ['src', 'features', 'users', 'route-state.ts'],
    routeMessage: ['src', 'features', 'users', 'route-message.tsx'],
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
    ({ importPath, route }) => {
      const source = readRouteSource(route);

      const localName = getDefaultImportName(source, importPath);

      expect(localName).toBeTruthy();
      expect(source).toContain(`<${localName}`);
      expect(source).not.toContain('<main');
    },
  );

  it.each(dataRoutes)('keeps $title route wired to its feature page', ({ importPath, route }) => {
    const source = readRouteSource(route);

    expect(source).toContain(importPath);
    expect(source).not.toContain('<main');
  });

  it.each(serverRouteStateModules)(
    'keeps $feature route-state server-only and moves message UI into route-message',
    ({ routeMessage, routeState }) => {
      const routeStateSource = readProjectSource(routeState);
      const routeMessageSource = readProjectSource(routeMessage);

      expect(routeStateSource).not.toContain('@adanft/ui/box');
      expect(routeStateSource).not.toMatch(/export\s+function\s+\w*RouteMessage/);
      expect(routeStateSource).not.toContain('<Box');
      expect(routeMessageSource).toContain('@adanft/ui/box');
      expect(routeMessageSource).toContain('import type {');
      expect(routeMessageSource).toContain("from './route-state'");
    },
  );
});

function readRouteSource(route: readonly string[]) {
  return readFileSync(adminPath(...route), 'utf8');
}

function readProjectSource(segments: readonly string[]) {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

function getDefaultImportName(source: string, importPath: string) {
  const escapedImportPath = escapeRegExp(importPath);
  const match = source.match(
    new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${escapedImportPath}['"]`),
  );

  return match?.[1] ?? null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
