import AuditLogsListPage from '@/features/audit-logs/components/audit-logs-list-page';
import {
  type AuditLogsListSearchParams,
  auditLogsApi,
  normalizeAuditLogsListQuery,
} from '@/server/api/audit-logs';
import { getSession } from '@/server/auth/session';

type AuditLogsPageProps = {
  searchParams?: Promise<AuditLogsListSearchParams>;
};

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizeAuditLogsListQuery(params);
  const session = await getSession();
  const state = query.filterError
    ? { status: 'bad-request' as const, message: query.filterError }
    : session?.accessToken
      ? await auditLogsApi.listAuditLogs(session.accessToken, query)
      : { status: 'unauthorized' as const, message: 'Your session expired or is invalid.' };

  return <AuditLogsListPage query={query} state={state} />;
}
