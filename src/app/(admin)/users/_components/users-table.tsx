import Avatar from '@adanft/ui/avatar';
import Badge from '@adanft/ui/badge';
import Button from '@adanft/ui/button';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';
import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';

import type { UserStatus, UsersList } from '@/lib/api/users';
import UserRowDeleteAction from './user-row-delete-action';

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

export default function UsersTable({ users }: { users: UsersList }) {
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
