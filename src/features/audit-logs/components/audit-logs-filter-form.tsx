import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';

import type { AuditLogsListQuery } from '@/server/api/audit-logs';

export default function AuditLogsFilterForm({ query }: { query: AuditLogsListQuery }) {
  return (
    <Box padding="default">
      <form className="grid gap-4 md:grid-cols-4 md:items-center" method="get">
        <Field>
          <Field.Label htmlFor="audit-logs-search">Search</Field.Label>
          <Input
            defaultValue={query.search ?? ''}
            id="audit-logs-search"
            name="search"
            placeholder="Search actor ID, action, result, resource, or reason"
          />
        </Field>

        <Field>
          <Field.Label htmlFor="audit-logs-from">From</Field.Label>
          <Input
            defaultValue={query.from ?? ''}
            id="audit-logs-from"
            name="from"
            placeholder="2026-05-01T00:00:00Z"
          />
        </Field>

        <Field>
          <Field.Label htmlFor="audit-logs-to">To</Field.Label>
          <Input
            defaultValue={query.to ?? ''}
            id="audit-logs-to"
            name="to"
            placeholder="2026-05-07T23:59:59Z"
          />
        </Field>

        <input name="limit" type="hidden" value={query.limit} />

        <div className="md:justify-self-end">
          <Button outline type="submit">
            Apply
          </Button>
        </div>
      </form>
    </Box>
  );
}
