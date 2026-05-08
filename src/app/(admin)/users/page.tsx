import UsersListPage from '@/features/users/components/users-list-page';
import {
  normalizeUsersListQuery,
  type UsersListSearchParams,
  type UsersListState,
  usersApi,
} from '@/server/api/users';
import { getSession } from '@/server/auth/session';

type UsersPageProps = {
  searchParams?: Promise<UsersListSearchParams>;
};

export default async function UsersPage({ searchParams }: UsersPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizeUsersListQuery(params);
  const session = await getSession();
  const state: UsersListState = session?.accessToken
    ? await usersApi.listUsers(query, session.accessToken)
    : { status: 'unauthorized', message: 'Your session expired or is invalid.' };

  return <UsersListPage query={query} state={state} />;
}
