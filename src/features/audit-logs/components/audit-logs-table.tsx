import Badge from '@adanft/ui/badge';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';

import type { AuditLogsList } from '@/server/api/audit-logs';
import AuditLogDetailsModal from './audit-log-details-modal';

const RESULT_BADGE_VARIANTS: Record<
  string,
  'danger' | 'outline' | 'primary' | 'secondary' | 'success'
> = {
  success: 'success',
  failure: 'danger',
  denied: 'outline',
  security_reuse_detected: 'primary',
  unknown: 'secondary',
};

export default function AuditLogsTable({ auditLogs }: { auditLogs: AuditLogsList }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Date/time</TableHead>
          <TableHead scope="col">Actor ID</TableHead>
          <TableHead scope="col">Actor Type</TableHead>
          <TableHead scope="col">Action</TableHead>
          <TableHead scope="col">Result</TableHead>
          <TableHead scope="col">Resource</TableHead>
          <TableHead scope="col">IP</TableHead>
          <TableHead scope="col">Reason</TableHead>
          <TableHead scope="col">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>
              <time dateTime={event.createdAt}>{formatDisplayDate(event.createdAt)}</time>
            </TableCell>
            <TableCell>{event.actorId ?? '—'}</TableCell>
            <TableCell>{event.actorType}</TableCell>
            <TableCell>
              <span className="font-medium text-heading">{event.action}</span>
            </TableCell>
            <TableCell>
              <Badge variant={getResultBadgeVariant(event.result)}>{event.result}</Badge>
            </TableCell>
            <TableCell>{event.resource}</TableCell>
            <TableCell>{event.ipAddress ?? '—'}</TableCell>
            <TableCell>{event.reason ?? '—'}</TableCell>
            <TableCell>
              <AuditLogDetailsModal event={event} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getResultBadgeVariant(result: string) {
  return RESULT_BADGE_VARIANTS[result] ?? RESULT_BADGE_VARIANTS.unknown;
}

function formatDisplayDate(value: string) {
  if (value === '—') {
    return value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        hour12: false,
        timeStyle: 'short',
      }).format(parsedDate);
}
