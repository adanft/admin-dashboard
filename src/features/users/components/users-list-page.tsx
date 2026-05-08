import Button from '@adanft/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import type { UsersListQuery, UsersListState } from '@/server/api/users';
import UsersFilterForm from './users-filter-form';
import UsersStateView from './users-state-view';

type UsersListPageProps = {
  query: UsersListQuery;
  state: UsersListState;
};

export default function UsersListPage({ query, state }: UsersListPageProps) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">Users</h1>
          <p className="max-w-prose text-foreground">
            Manage the people who can access and work in the admin dashboard.
          </p>
        </div>
        <div className="shrink-0">
          <Button asChild>
            <Link href="/users/new" className="inline-flex gap-2 whitespace-nowrap">
              <Plus aria-hidden="true" className="size-4" />
              New User
            </Link>
          </Button>
        </div>
      </header>

      <UsersFilterForm query={query} />
      <UsersStateView state={state} />
    </section>
  );
}
