import type { AuditLogsListQuery, AuditLogsListState } from '@/server/api/audit-logs';
import AuditLogsFilterForm from './audit-logs-filter-form';
import AuditLogsStateView from './audit-logs-state-view';

type AuditLogsListPageProps = {
  query: AuditLogsListQuery;
  state: AuditLogsListState;
};

export default function AuditLogsListPage({ query, state }: AuditLogsListPageProps) {
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
