import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';

import type { PermissionsListQuery } from '@/lib/api/permissions';

export default function PermissionsFilterForm({ query }: { query: PermissionsListQuery }) {
  return (
    <Box padding="default">
      <form className="grid gap-4 md:grid-cols-6 md:items-center" method="get">
        <Field className="md:col-span-4">
          <Field.Label htmlFor="permissions-search">Search</Field.Label>
          <Input
            defaultValue={query.search ?? ''}
            id="permissions-search"
            name="search"
            placeholder="Search by key, display name, or category"
          />
        </Field>

        <div className="md:col-span-2 md:justify-self-end">
          <Button outline type="submit">
            Apply
          </Button>
        </div>
      </form>
    </Box>
  );
}
