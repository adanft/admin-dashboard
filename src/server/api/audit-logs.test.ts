// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type AuditLogsListState,
  auditLogsApi,
  filterAuditLogsForCurrentPage,
  mapAuditLogEvent,
  mapAuditLogsListResponse,
  normalizeAuditLogsListQuery,
  toAuditLogsListBackendQuery,
} from './audit-logs';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('mapAuditLogEvent', () => {
  it('maps backend contract fields into an audit log event', () => {
    expect(
      mapAuditLogEvent({
        id: 'audit-1',
        actorType: 'user',
        actorId: 'actor-1',
        action: 'login_success',
        category: 'auth',
        resource: 'auth',
        result: 'success',
        createdAt: '2026-05-07T10:00:00.000Z',
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest',
        reason: 'authenticated',
        metadata: { method: 'password' },
      }),
    ).toEqual({
      id: 'audit-1',
      actorType: 'user',
      actorId: 'actor-1',
      action: 'login_success',
      category: 'auth',
      resource: 'auth',
      result: 'success',
      createdAt: '2026-05-07T10:00:00.000Z',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      reason: 'authenticated',
      metadata: { method: 'password' },
    });
  });

  it('preserves new backend enum values as raw audit log event values', () => {
    expect(
      mapAuditLogEvent({
        id: 'audit-new-contract',
        action: 'policy_override_granted',
        category: 'policy_engine',
        resource: 'policy_rule',
        result: 'queued_for_review',
      }),
    ).toMatchObject({
      action: 'policy_override_granted',
      category: 'policy_engine',
      resource: 'policy_rule',
      result: 'queued_for_review',
    });
  });

  it('supports snake_case audit log aliases without changing raw values', () => {
    expect(
      mapAuditLogEvent({
        id: 'audit-snake',
        actor_type: 'service_account',
        actor_id: 'actor-2',
        action: 'role_permission_added',
        category: 'rbac_admin',
        resource: 'role',
        resource_id: 'role-1',
        result: 'success',
        created_at: '2026-05-07T11:00:00.000Z',
        ip_address: '10.0.0.1',
        user_agent: 'BackendWorker/1.0',
      }),
    ).toEqual({
      id: 'audit-snake',
      actorType: 'service_account',
      actorId: 'actor-2',
      action: 'role_permission_added',
      category: 'rbac_admin',
      resource: 'role',
      resourceId: 'role-1',
      result: 'success',
      createdAt: '2026-05-07T11:00:00.000Z',
      ipAddress: '10.0.0.1',
      userAgent: 'BackendWorker/1.0',
    });
  });

  it('keeps metadata keys and values faithful to the backend contract', () => {
    expect(
      mapAuditLogEvent({
        id: 'audit-2',
        action: 'user_update',
        category: 'user_admin',
        resource: 'user',
        result: 'success',
        metadata: {
          password: 'plain-text',
          refreshToken: 'token-value',
          nested: { credential_hash: 'hash-value', body: { email: 'hidden@example.com' } },
          safe: 'visible',
        },
      }).metadata,
    ).toEqual({
      password: 'plain-text',
      refreshToken: 'token-value',
      nested: { credential_hash: 'hash-value', body: { email: 'hidden@example.com' } },
      safe: 'visible',
    });
  });
});

describe('mapAuditLogsListResponse', () => {
  it('maps a paginated audit logs response from data.items and data.pagination', () => {
    expect(
      mapAuditLogsListResponse({
        items: [{ id: 'audit-1', action: 'logout', category: 'auth', resource: 'auth' }],
        pagination: { total: 1, limit: 25, offset: 0 },
      }),
    ).toEqual({
      events: [
        {
          id: 'audit-1',
          actorType: 'unknown',
          action: 'logout',
          category: 'auth',
          resource: 'auth',
          result: 'unknown',
          createdAt: '—',
        },
      ],
      pagination: { total: 1, limit: 25, offset: 0 },
      total: 1,
    });
  });
});

describe('normalizeAuditLogsListQuery', () => {
  it('normalizes UI-supported filters and ignores backend-only values', () => {
    expect(
      normalizeAuditLogsListQuery({
        actor_id: ' actor-1 ',
        action: 'login_failure',
        category: 'auth',
        resource: 'auth',
        result: 'failure',
        search: ' admin@example.com ',
        from: ' 2026-05-01T00:00:00.000Z ',
        to: '2026-05-07T00:00:00.000Z',
        limit: '25',
        offset: '50',
        unknown: 'rejected-by-backend-if-sent',
      }),
    ).toEqual({
      search: 'admin@example.com',
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-07T00:00:00.000Z',
      limit: 25,
      offset: 50,
    });
  });

  it('falls back on unsupported limit and offset values', () => {
    expect(normalizeAuditLogsListQuery({ limit: '5', offset: '-1' })).toEqual({
      limit: 50,
      offset: 0,
    });
  });
});

describe('filterAuditLogsForCurrentPage', () => {
  const events = [
    mapAuditLogEvent({
      id: 'audit-1',
      actorId: 'actor-1',
      action: 'login_failure',
      category: 'auth',
      resource: 'auth',
      result: 'failure',
      reason: 'invalid_credentials',
      createdAt: '2026-05-07T10:00:00.000Z',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      resourceId: 'session-1',
      metadata: { policy_rule_key: 'metadata-only' },
    }),
    mapAuditLogEvent({
      id: 'audit-2',
      actorId: 'actor-2',
      action: 'logout',
      category: 'auth',
      resource: 'auth',
      result: 'success',
    }),
  ];

  it('filters only the already loaded page by supported raw fields', () => {
    expect(filterAuditLogsForCurrentPage(events, { search: 'actor-1' })).toEqual([events[0]]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'login_failure' })).toEqual([events[0]]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'failure' })).toEqual([events[0]]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'auth' })).toEqual(events);
    expect(filterAuditLogsForCurrentPage(events, { search: 'invalid_credentials' })).toEqual([
      events[0],
    ]);
  });

  it('does not search audit event metadata or non-search raw fields', () => {
    expect(filterAuditLogsForCurrentPage(events, { search: 'audit-1' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'user' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'session-1' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'metadata-only' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: '127.0.0.1' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'Vitest' })).toEqual([]);
    expect(filterAuditLogsForCurrentPage(events, { search: '2026-05-07' })).toEqual([]);
  });

  it('does not expose failed or denied local filtering as a query behavior', () => {
    expect(normalizeAuditLogsListQuery({ only_problematic: '1' })).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it('searches raw audit action values without friendly action labels', () => {
    expect(filterAuditLogsForCurrentPage(events, { search: 'login_failure' })).toEqual([events[0]]);
    expect(filterAuditLogsForCurrentPage(events, { search: 'Login failed' })).toEqual([]);
  });
});

describe('toAuditLogsListBackendQuery', () => {
  it('sends only active backend query keys exposed by the UI', () => {
    expect(
      toAuditLogsListBackendQuery({
        search: 'do-not-send',
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-07T00:00:00.000Z',
        limit: 100,
        offset: 100,
      }),
    ).toEqual({
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-07T00:00:00.000Z',
      limit: 100,
      offset: 100,
    });
  });
});

describe('auditLogsApi.listAuditLogs contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('requests audit logs with backend pagination defaults', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0, limit: 50, offset: 0 } },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(auditLogsApi.listAuditLogs('access-token')).resolves.toEqual({
      status: 'success',
      data: { events: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    } satisfies AuditLogsListState);

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/audit-logs?limit=50',
      expect.objectContaining({
        headers: { Accept: 'application/json', Authorization: 'Bearer access-token' },
        method: 'GET',
      }),
    );
  });
});
