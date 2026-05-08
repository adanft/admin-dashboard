import Box from '@adanft/ui/box';

import {
  type AuditLogsListQuery,
  type AuditLogsListState,
  filterAuditLogsForCurrentPage,
} from '@/server/api/audit-logs';
import { AuditLogsPaginationFoot, AuditLogsPaginationHead } from './audit-logs-pagination';
import AuditLogsTable from './audit-logs-table';

export default function AuditLogsStateView({
  query,
  state,
}: {
  query: AuditLogsListQuery;
  state: AuditLogsListState;
}) {
  if (state.status !== 'success') {
    return <AuditLogsMessage state={state} />;
  }

  const currentPageEvents = filterAuditLogsForCurrentPage(state.data.events, query);
  const auditLogs = { ...state.data, events: currentPageEvents };

  if (auditLogs.events.length === 0) {
    return (
      <Box className="space-y-2" padding="default">
        <h2 className="text-xl font-semibold text-heading">No audit logs found</h2>
        <p className="text-foreground">Try adjusting the current audit log filters.</p>
      </Box>
    );
  }

  return (
    <div className="space-y-4">
      <AuditLogsPaginationHead pagination={state.data.pagination} total={state.data.total} />
      <AuditLogsTable auditLogs={auditLogs} />
      <AuditLogsPaginationFoot pagination={state.data.pagination} total={state.data.total} />
    </div>
  );
}

function AuditLogsMessage({
  state,
}: {
  state: Exclude<AuditLogsListState, { status: 'success' }>;
}) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<AuditLogsListState, { status: 'success' }>['status']) {
  if (status === 'bad-request') {
    return 'Review the filters and try again.';
  }

  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator for audit_logs.read access.';
  }

  return 'Refresh the page or try again later.';
}
