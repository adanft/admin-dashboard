import { describe, expect, it } from 'vitest';

import { summarizeInstrumentationError } from './instrumentation';

describe('summarizeInstrumentationError', () => {
  it('keeps server error logs useful without copying request headers', () => {
    expect(
      summarizeInstrumentationError(
        Object.assign(new Error('Database connection failed'), { digest: 'digest-1' }),
        {
          path: '/users?search=ada',
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
      ),
    ).toEqual({
      digest: 'digest-1',
      message: 'Database connection failed',
      method: 'GET',
      path: '/users?search=ada',
      routePath: '/users',
      routeType: 'render',
      routerKind: 'App Router',
    });
  });

  it('uses a safe fallback when the captured value is not an Error', () => {
    expect(
      summarizeInstrumentationError(
        { digest: 'digest-2' },
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
      message: 'Unhandled server request error',
      method: 'POST',
      path: '/roles',
      routePath: '/roles',
      routeType: 'action',
      routerKind: 'App Router',
    });
  });
});
