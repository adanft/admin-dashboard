import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';

import type { RolesListQuery } from '@/server/api/roles';

export default function RolesFilterForm({ query }: { query: RolesListQuery }) {
  return (
    <Box padding="default">
      <form className="grid gap-4 md:grid-cols-6 md:items-center" method="get">
        <Field className="md:col-span-4">
          <Field.Label htmlFor="roles-search">Search</Field.Label>
          <Input
            defaultValue={query.search ?? ''}
            id="roles-search"
            name="search"
            placeholder="Search by key or display name"
          />
        </Field>

        <div className="md:col-span-2 md:justify-self-end">
          <Button
            className="border border-brand bg-transparent text-brand hover:bg-brand/10"
            type="submit"
          >
            Apply
          </Button>
        </div>
      </form>
    </Box>
  );
}
