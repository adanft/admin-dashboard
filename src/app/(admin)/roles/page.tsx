import Button from '@adanft/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { normalizeRolesListQuery, type RolesListSearchParams, rolesApi } from '@/lib/api/roles';
import { getSession } from '@/lib/auth/session';
import RolesFilterForm from './_components/roles-filter-form';
import RolesStateView from './_components/roles-state-view';

type RolesPageProps = {
  searchParams?: Promise<RolesListSearchParams>;
};

export default async function RolesPage({ searchParams }: RolesPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizeRolesListQuery(params);
  const session = await getSession();
  const state = session?.accessToken
    ? await rolesApi.listRoles(query, session.accessToken)
    : { status: 'unauthorized' as const, message: 'Your session expired or is invalid.' };

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
