import {
  type AuditLogsListSearchParams,
  auditLogsApi,
  normalizeAuditLogsListQuery,
} from '@/lib/api/audit-logs';
import { getSession } from '@/lib/auth/session';
import AuditLogsFilterForm from './_components/audit-logs-filter-form';
import AuditLogsStateView from './_components/audit-logs-state-view';

type AuditLogsPageProps = {
  searchParams?: Promise<AuditLogsListSearchParams>;
};

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizeAuditLogsListQuery(params);
  const session = await getSession();
  const state = session?.accessToken
    ? await auditLogsApi.listAuditLogs(session.accessToken, query)
    : { status: 'unauthorized' as const, message: 'Your session expired or is invalid.' };

  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">Audit Logs</h1>
        <p className="max-w-prose text-foreground">
          Inspect append-only operational and security events without exposing mutation controls.
        </p>
      </header>

      <AuditLogsFilterForm query={query} />
      <AuditLogsStateView query={query} state={state} />
    </section>
  );
}
