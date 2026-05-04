import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Select from '@adanft/ui/select';

import type { UsersListQuery } from '@/lib/api/users';

export default function UsersFilterForm({ query }: { query: UsersListQuery }) {
  return (
    <Box padding="default">
      <form className="grid gap-4 md:grid-cols-6 md:items-center" method="get">
        <Field className="md:col-span-2">
          <Field.Label htmlFor="users-search">Search</Field.Label>
          <Input
            defaultValue={query.search ?? ''}
            id="users-search"
            name="search"
            placeholder="Search by name, username and email"
          />
        </Field>

        <Field className="md:col-span-2">
          <Field.Label htmlFor="users-status">Status</Field.Label>
          <Select
            className="data-placeholder:text-foreground"
            defaultValue={query.status ?? ''}
            id="users-status"
            name="status"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="locked">Locked</option>
            <option value="pending_password_change">Pending password change</option>
          </Select>
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
