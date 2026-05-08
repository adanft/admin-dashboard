// biome-ignore-all lint/nursery/noSecrets: Audit log UI tests assert public copy and fake tokens.
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogDetailsContent } from '@/features/audit-logs/components/audit-log-details-modal';
import type { AuditLogsListQuery, AuditLogsListState } from '@/server/api/audit-logs';
import { getSession } from '@/server/auth/session';
import AuditLogsPage from './page';

const listAuditLogsMock = vi.hoisted(() => vi.fn<() => Promise<AuditLogsListState>>());

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/server/api/audit-logs', async () => {
  const actual =
    await vi.importActual<typeof import('@/server/api/audit-logs')>('@/server/api/audit-logs');

  return {
    ...actual,
    auditLogsApi: {
      listAuditLogs: listAuditLogsMock,
    },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/audit-logs',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const getSessionMock = vi.mocked(getSession);

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    listAuditLogsMock.mockResolvedValue(successState());
  });

  it('renders audit events with prioritized columns and no mutation affordances', async () => {
    const markup = await renderAuditLogsPage();

    expect(markup).toContain('<h1');
    expect(markup).toContain('Audit Logs');
    expect(markup).toContain('Inspect append-only operational and security events');
    expect(markup).toContain('<table');
    expect(markup).toContain('Date/time');
    expect(markup).toContain('Actor ID');
    expect(markup).toContain('Actor Type');
    expect(markup).toContain('Action');
    expect(markup).toContain('Result');
    expect(markup).toContain('Resource');
    expect(markup).not.toContain('Target');
    expect(markup).toContain('IP');
    expect(markup).toContain('Reason');
    expect(markup).toContain('login_failure');
    expect(markup).not.toContain('Login failed');
    expect(markup).toContain('actor-1');
    expect(markup).toContain('user');
    expect(markup).not.toContain('admin@example.com');
    expect(markup).not.toContain('resource-1');
    expect(markup).toContain('invalid_credentials');
    expect(markup).toContain('aria-label="View details for audit log audit-1"');
    expect(markup).toContain('title="View details for audit log audit-1"');
    expect(markup).not.toContain('>View details</button>');
    expect(markup).not.toContain('AM');
    expect(markup).not.toContain('PM');
    expect(markup).not.toContain('<details');
    expect(markup).toContain('127.0.0.1');
    expect(markup).not.toContain('New Audit Log');
    expect(markup).not.toContain('href="/audit-logs/audit-1/edit"');
    expect(markup).not.toContain('aria-label="Delete audit log audit-1"');
  });

  it('renders modal detail content with raw action and full payload', () => {
    const markup = renderToStaticMarkup(
      <AuditLogDetailsContent event={successState().data.events[0]} titleId="audit-modal-title" />,
    );

    expect(markup).toContain('Audit log details');
    expect(markup).toContain('Audit Log ID');
    expect(markup).toContain('Action');
    expect(markup).toContain('login_failure');
    expect(markup).toContain('Category');
    expect(markup).not.toContain('Friendly description');
    expect(markup).not.toContain('Login failed');
    expect(markup).toContain('Result');
    expect(markup).toContain('Actor ID');
    expect(markup).not.toContain('Label:');
    expect(markup).not.toContain('admin@example.com');
    expect(markup).toContain('Actor Type');
    expect(markup).toContain('Resource ID');
    expect(markup).toContain('resource-1');
    expect(markup).toContain('IP');
    expect(markup).toContain('User Agent');
    expect(markup).toContain('Created At');
    expect(markup).toContain('Metadata');
    expect(markup).toContain('reason');
    expect(markup).toContain('invalid_credentials');
  });

  it('keeps unknown and new backend values raw in table and modal output', async () => {
    listAuditLogsMock.mockResolvedValue({
      status: 'success',
      data: {
        events: [
          {
            id: 'audit-new-contract',
            actorType: 'service_account',
            action: 'policy_override_granted',
            category: 'policy_engine',
            resource: 'policy_rule',
            result: 'queued_for_review',
            createdAt: '2026-05-07T13:00:00.000Z',
            metadata: { policy_rule_key: 'rule-1' },
          },
        ],
        pagination: { total: 1, limit: 50, offset: 0 },
        total: 1,
      },
    });

    const markup = await renderAuditLogsPage();
    const modalMarkup = renderToStaticMarkup(
      <AuditLogDetailsContent
        event={successStateWithNewBackendValues().data.events[0]}
        titleId="audit-modal-title"
      />,
    );

    expect(markup).toContain('policy_override_granted');
    expect(markup).toContain('policy_rule');
    expect(markup).toContain('queued_for_review');
    expect(markup).toContain('service_account');
    expect(markup).not.toContain('Policy override granted');
    expect(modalMarkup).toContain('policy_override_granted');
    expect(modalMarkup).toContain('policy_rule_key');
    expect(modalMarkup).not.toContain('Friendly description');
  });

  it('renders icon-only modal close control with accessible labels', () => {
    const markup = renderToStaticMarkup(
      <AuditLogDetailsContent
        event={successState().data.events[0]}
        onClose={() => undefined}
        titleId="audit-modal-title"
      />,
    );

    expect(markup).toContain('aria-label="Close audit log details"');
    expect(markup).toContain('title="Close audit log details"');
    expect(markup).not.toContain('>Close</button>');
  });

  it('keeps table reason bound to contract fields without rendering target metadata', async () => {
    listAuditLogsMock.mockResolvedValue({
      status: 'success',
      data: {
        events: [
          {
            id: 'audit-2',
            actorType: 'user',
            actorId: 'owner-1',
            action: 'user_delete',
            category: 'user_admin',
            resource: 'user',
            resourceId: 'user-2',
            result: 'success',
            createdAt: '2026-05-07T11:00:00.000Z',
            metadata: {
              target_username: 'deleted-user',
              target_status: 'disabled',
              target_role_keys: ['member', 'support'],
            },
          },
          {
            id: 'audit-3',
            actorType: 'system',
            action: 'logout',
            category: 'auth',
            resource: 'auth',
            result: 'success',
            createdAt: '2026-05-07T12:00:00.000Z',
            metadata: {},
          },
        ],
        pagination: { total: 2, limit: 50, offset: 0 },
        total: 2,
      },
    });

    const markup = await renderAuditLogsPage();

    expect(markup).not.toContain('user-2');
    expect(markup).not.toContain('deleted-user');
    expect(markup).not.toContain('target_role_keys');
    expect(markup).toContain('user_delete');
    expect(markup).toContain('logout');
    expect(markup).not.toContain('No extra context');
  });

  it('renders raw metadata JSON and no extra context for empty metadata in detail content', () => {
    const metadataMarkup = renderToStaticMarkup(
      <AuditLogDetailsContent
        event={{
          id: 'audit-2',
          actorType: 'user',
          action: 'user_delete',
          category: 'user_admin',
          resource: 'user',
          resourceId: 'user-2',
          result: 'success',
          createdAt: '2026-05-07T11:00:00.000Z',
          metadata: {
            target_username: 'deleted-user',
            target_status: 'disabled',
            target_role_keys: ['member', 'support'],
          },
        }}
        titleId="audit-modal-title"
      />,
    );
    const emptyMetadataMarkup = renderToStaticMarkup(
      <AuditLogDetailsContent
        event={{
          id: 'audit-3',
          actorType: 'system',
          action: 'logout',
          category: 'auth',
          resource: 'auth',
          result: 'success',
          createdAt: '2026-05-07T12:00:00.000Z',
          metadata: {},
        }}
        titleId="audit-modal-title"
      />,
    );

    expect(metadataMarkup).toContain('Metadata');
    expect(metadataMarkup).toContain('target_username');
    expect(metadataMarkup).toContain('deleted-user');
    expect(metadataMarkup).toContain('target_role_keys');
    expect(emptyMetadataMarkup).toContain('No extra context');
  });

  it('forwards only active UI query params while rendering search and date filters', async () => {
    const markup = await renderAuditLogsPage({
      actor_id: ' actor-1 ',
      action: 'login_failure',
      resource: 'auth',
      result: 'failure',
      search: 'admin',
      from: ' 2026-05-01T00:00:00Z ',
      to: '2026-05-07T00:00:00Z',
      limit: '25',
      offset: '50',
      unsupported: 'do-not-send',
    });

    expect(listAuditLogsMock).toHaveBeenCalledWith('admin-token', {
      search: 'admin',
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-07T00:00:00.000Z',
      limit: 25,
      offset: 50,
    } satisfies AuditLogsListQuery);
    expect(markup).not.toContain('name="actor_id"');
    expect(markup).not.toContain('name="action"');
    expect(markup).not.toContain('name="resource"');
    expect(markup).not.toContain('name="result"');
    expect(markup).toContain('name="search"');
    expect(markup).not.toContain('name="only_problematic"');
    expect(markup).toContain('name="from"');
    expect(markup).toContain('name="to"');
    expect(markup).not.toContain('aria-label="Audit log quick filters"');
    expect(markup).not.toContain('RBAC');
    expect(markup).not.toContain('Sessions');
    expect(markup).toContain('From');
    expect(markup).toContain('To');
    expect(markup).toContain('Search');
    expect(markup.indexOf('audit-logs-search')).toBeLessThan(markup.indexOf('audit-logs-from'));
    expect(markup.indexOf('audit-logs-from')).toBeLessThan(markup.indexOf('audit-logs-to'));
    expect(markup).not.toContain('General search');
    expect(markup).toContain('Search actor ID, action, result, resource, or reason');
    expect(markup).not.toContain('Failed/denied only');
    expect(markup).not.toContain('filter the loaded page');
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Apply<\/button>/);
  });

  it('applies local current-page search without sending backend search params', async () => {
    const markup = await renderAuditLogsPage({ search: 'missing' });

    expect(markup).toContain('No audit logs found');
    expect(listAuditLogsMock).toHaveBeenCalledWith('admin-token', {
      search: 'missing',
      limit: 50,
      offset: 0,
    } satisfies AuditLogsListQuery);
  });

  it('renders pagination around the table', async () => {
    const markup = await renderAuditLogsPage();

    expect(markup).toContain('audit logs per page:');
    expect(markup).toContain('Showing 1–1 of 1 audit logs');
  });

  it('renders empty and forbidden states distinctly', async () => {
    listAuditLogsMock.mockResolvedValue({
      status: 'success',
      data: { events: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    });

    expect(await renderAuditLogsPage({ actor_id: 'nobody' })).toContain('No audit logs found');

    listAuditLogsMock.mockResolvedValue({
      status: 'forbidden',
      message: 'You do not have permission to view audit logs.',
    });

    const markup = await renderAuditLogsPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Ask an administrator for audit_logs.read access.');
  });

  it('renders expired session state without calling the API', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderAuditLogsPage();

    expect(markup).toContain('Your session expired or is invalid.');
    expect(listAuditLogsMock).not.toHaveBeenCalled();
  });

  it('renders invalid date filter feedback without calling the API', async () => {
    const markup = await renderAuditLogsPage({ from: 'not-a-date', to: '2026-05-07' });

    expect(markup).toContain('Enter valid from and to dates before applying filters.');
    expect(markup).toContain('role="alert"');
    expect(listAuditLogsMock).not.toHaveBeenCalled();
  });
});

async function renderAuditLogsPage(params: Record<string, string> = {}) {
  return renderToStaticMarkup(await AuditLogsPage({ searchParams: Promise.resolve(params) }));
}

function successState(): Extract<AuditLogsListState, { status: 'success' }> {
  return {
    status: 'success',
    data: {
      events: [
        {
          id: 'audit-1',
          actorType: 'user',
          actorId: 'actor-1',
          action: 'login_failure',
          category: 'auth',
          resource: 'auth',
          resourceId: 'resource-1',
          result: 'failure',
          createdAt: '2026-05-07T10:00:00.000Z',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
          reason: 'invalid_credentials',
          metadata: { reason: 'invalid_credentials' },
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
      total: 1,
    },
  };
}

function successStateWithNewBackendValues(): Extract<AuditLogsListState, { status: 'success' }> {
  return {
    status: 'success',
    data: {
      events: [
        {
          id: 'audit-new-contract',
          actorType: 'service_account',
          action: 'policy_override_granted',
          category: 'policy_engine',
          resource: 'policy_rule',
          result: 'queued_for_review',
          createdAt: '2026-05-07T13:00:00.000Z',
          metadata: { policy_rule_key: 'rule-1' },
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
      total: 1,
    },
  };
}
