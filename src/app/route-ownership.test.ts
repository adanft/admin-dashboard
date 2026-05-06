import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appPath = (...segments: string[]) => join(process.cwd(), 'src', 'app', ...segments);

describe('App Router route group ownership', () => {
  it('keeps the root dashboard owned by the admin route group only', () => {
    expect(existsSync(appPath('(admin)', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('page.tsx'))).toBe(false);
  });

  it('keeps account sessions available as an account subsection route', () => {
    expect(existsSync(appPath('(admin)', 'account', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'account', 'sessions', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'audit-logs', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'permissions', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'roles', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'system', 'status', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'users', 'page.tsx'))).toBe(true);
  });

  it('keeps auth pages outside the admin route group', () => {
    expect(existsSync(appPath('auth', 'sign-in', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('auth', 'sign-up', 'page.tsx'))).toBe(true);
    expect(existsSync(appPath('(admin)', 'auth', 'sign-in', 'page.tsx'))).toBe(false);
  });
});
