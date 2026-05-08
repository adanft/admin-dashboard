import PermissionsListPage from '@/features/permissions/components/permissions-list-page';
import {
  normalizePermissionsListQuery,
  type PermissionsListSearchParams,
  permissionsApi,
} from '@/server/api/permissions';
import { getSession } from '@/server/auth/session';

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

  return <PermissionsListPage query={query} state={state} />;
}
