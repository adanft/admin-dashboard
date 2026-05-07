import {
  normalizePermissionsListQuery,
  type PermissionsListSearchParams,
  permissionsApi,
} from '@/lib/api/permissions';
import { getSession } from '@/lib/auth/session';
import PermissionsFilterForm from './_components/permissions-filter-form';
import PermissionsStateView from './_components/permissions-state-view';

type PermissionsPageProps = {
  searchParams?: Promise<PermissionsListSearchParams>;
};

export default async function PermissionsPage({ searchParams }: PermissionsPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizePermissionsListQuery(params);
  const session = await getSession();
  const state = session?.accessToken
    ? await permissionsApi.listPermissions(session.accessToken, query)
    : { status: 'unauthorized' as const, message: 'Your session expired or is invalid.' };

  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">Permissions</h1>
        <p className="max-w-prose text-foreground">
          Inspect system-defined permissions and edit their display metadata.
        </p>
      </header>

      <PermissionsFilterForm query={query} />
      <PermissionsStateView state={state} />
    </section>
  );
}
