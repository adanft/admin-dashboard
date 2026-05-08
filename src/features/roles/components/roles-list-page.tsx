import Button from '@adanft/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import type { RolesListQuery, RolesListState } from '@/server/api/roles';
import RolesFilterForm from './roles-filter-form';
import RolesStateView from './roles-state-view';

type RolesListPageProps = {
  query: RolesListQuery;
  state: RolesListState;
};

export default function RolesListPage({ query, state }: RolesListPageProps) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">Roles</h1>
          <p className="max-w-prose text-foreground">
            Manage admin roles and the permissions assigned to each role.
          </p>
        </div>
        <div className="shrink-0">
          <Button asChild>
            <Link href="/roles/new" className="inline-flex gap-2 whitespace-nowrap">
              <Plus aria-hidden="true" className="size-4" />
              New Role
            </Link>
          </Button>
        </div>
      </header>

      <RolesFilterForm query={query} />
      <RolesStateView state={state} />
    </section>
  );
}
