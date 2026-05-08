import type { PermissionsListQuery, PermissionsListState } from '@/server/api/permissions';
import PermissionsFilterForm from './permissions-filter-form';
import PermissionsStateView from './permissions-state-view';

type PermissionsListPageProps = {
  query: PermissionsListQuery;
  state: PermissionsListState;
};

export default function PermissionsListPage({ query, state }: PermissionsListPageProps) {
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
