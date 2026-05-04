import Avatar from '@adanft/ui/avatar';
import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Select from '@adanft/ui/select';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';
import { Info, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';

import {
  normalizeUsersListQuery,
  type UserStatus,
  type UsersList,
  type UsersListQuery,
  type UsersListSearchParams,
  type UsersListState,
  usersApi,
} from '@/lib/api/users';
import { getSession } from '@/lib/auth/session';
import UserRowDeleteAction from './user-row-delete-action';
import { UsersPaginationFoot, UsersPaginationHead } from './users-pagination';

type UsersPageProps = {
  searchParams?: Promise<UsersListSearchParams>;
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
  locked: 'Locked',
  pending_password_change: 'Pending password change',
};

const STATUS_BADGE_VARIANTS: Record<UserStatus, 'success' | 'secondary' | 'danger'> = {
  active: 'success',
  disabled: 'secondary',
  locked: 'danger',
  pending_password_change: 'secondary',
};

export default async function UsersPage({ searchParams }: UsersPageProps = {}) {
  const params = (await searchParams) ?? {};
  const query = normalizeUsersListQuery(params);
  const session = await getSession();
  const state: UsersListState = session?.accessToken
    ? await usersApi.listUsers(query, session.accessToken)
    : { status: 'unauthorized', message: 'Your session expired or is invalid.' };

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

function UsersFilterForm({ query }: { query: UsersListQuery }) {
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

function UsersStateView({ state }: { state: UsersListState }) {
  if (state.status !== 'success') {
    return <UsersMessage state={state} />;
  }

  if (state.data.rows.length === 0) {
    return (
      <Box className="space-y-2" padding="default">
        <h2 className="text-xl font-semibold text-heading">No users found</h2>
        <p className="text-foreground">Try adjusting the current users filters.</p>
      </Box>
    );
  }

  return (
    <div className="space-y-4">
      <UsersPaginationHead pagination={state.data.pagination} total={state.data.total} />
      <UsersTable users={state.data} />
      <UsersPaginationFoot pagination={state.data.pagination} total={state.data.total} />
    </div>
  );
}

function UsersTable({ users }: { users: UsersList }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">User</TableHead>
          <TableHead scope="col">Email</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Role</TableHead>
          <TableHead scope="col">Created</TableHead>
          <TableHead scope="col">Updated</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.rows.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <Avatar
                    alt={`Avatar for ${user.name}`}
                    size="sm"
                    src={user.avatar}
                    type="image"
                  />
                ) : (
                  <Avatar size="sm" text={getUserInitials(user.name, user.username)} type="text" />
                )}
                <div className="space-y-0.5">
                  <div className="font-medium text-heading">{user.name}</div>
                  <div className="text-sm text-foreground">@{user.username}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE_VARIANTS[user.status]}>
                {STATUS_LABELS[user.status]}
              </Badge>
            </TableCell>
            <TableCell>{user.roleSummary}</TableCell>
            <TableCell>{formatDisplayDate(user.createdAt)}</TableCell>
            <TableCell>{formatDisplayDate(user.updatedAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
                >
                  <Link
                    aria-label={`View profile for ${user.name}`}
                    href={`/users/${user.id}`}
                    title={`View profile for ${user.name}`}
                  >
                    <Info aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
                >
                  <Link
                    aria-label={`Edit ${user.name}`}
                    href={`/users/${user.id}/edit`}
                    title={`Edit ${user.name}`}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <UserRowDeleteAction userId={user.id} userLabel={user.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UsersMessage({ state }: { state: Exclude<UsersListState, { status: 'success' }> }) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<UsersListState, { status: 'success' }>['status']) {
  if (status === 'bad-request') {
    return 'Review the filters and try again.';
  }

  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator for users.read access.';
  }

  return 'Refresh the page or try again later.';
}

function formatDisplayDate(value: string) {
  if (value === '—') {
    return value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsedDate);
}

function getUserInitials(name: string, username: string) {
  const source = name.trim() || username.trim();
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0))
    .filter((letter): letter is string => Boolean(letter))
    .join('')
    .toUpperCase();

  return initials || 'U';
}
