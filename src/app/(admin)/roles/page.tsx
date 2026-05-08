import RolesListPage from '@/features/roles/components/roles-list-page';
import { normalizeRolesListQuery, type RolesListSearchParams, rolesApi } from '@/server/api/roles';
import { getSession } from '@/server/auth/session';

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

  return <RolesListPage query={query} state={state} />;
}
