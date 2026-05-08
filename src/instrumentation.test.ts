import { describe, expect, it } from 'vitest';

import { summarizeInstrumentationError } from './instrumentation';

describe('summarizeInstrumentationError', () => {
  it('keeps safe context without logging raw error messages, query strings, or headers', () => {
    const summary = summarizeInstrumentationError(
      Object.assign(new Error('Database connection failed for token secret-token'), {
        code: 'DB_DOWN',
        digest: 'digest-1',
        status: 503,
      }),
      {
        path: '/users?search=ada&token=secret-token',
        method: 'GET',
        headers: { authorization: 'Bearer secret-token', cookie: 'admin_session=secret' },
      },
      {
        routerKind: 'App Router',
        routePath: '/users',
        routeType: 'render',
        renderSource: 'server-rendering',
        revalidateReason: undefined,
      },
    );

    expect(summary).toEqual({
      code: 'DB_DOWN',
      digest: 'digest-1',
      method: 'GET',
      path: '/users',
      routePath: '/users',
      routeType: 'render',
      routerKind: 'App Router',
      status: 503,
    });
    expect(JSON.stringify(summary)).not.toContain('Database connection failed');
    expect(JSON.stringify(summary)).not.toContain('search=ada');
    expect(JSON.stringify(summary)).not.toContain('secret-token');
    expect(JSON.stringify(summary)).not.toContain('admin_session');
  });

  it('omits unsafe error codes when the captured value is not an Error', () => {
    expect(
      summarizeInstrumentationError(
        { code: 'token=secret-token', digest: 'digest-2' },
        { path: '/roles', method: 'POST', headers: {} },
        {
          routerKind: 'App Router',
          routePath: '/roles',
          routeType: 'action',
          renderSource: 'server-rendering',
          revalidateReason: 'on-demand',
        },
      ),
    ).toEqual({
      digest: 'digest-2',
      method: 'POST',
      path: '/roles',
      routePath: '/roles',
      routeType: 'action',
      routerKind: 'App Router',
    });
  });
});
