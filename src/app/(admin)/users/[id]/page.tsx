import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import type { UserProfile, UserStatus } from '@/lib/api/users';
import UserRowDeleteAction from '../_components/user-row-delete-action';
import { loadUserRouteState, UserRouteMessage } from '../_lib/route-state';

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
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

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const state = await loadUserRouteState(id);

  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">User profile</h1>
      </header>

      {state.status === 'success' ? (
        <UserProfileView user={state.user} />
      ) : (
        <UserRouteMessage state={state} />
      )}
    </section>
  );
}

function UserProfileView({ user }: { user: UserProfile }) {
  const userLabel = `${user.name} ${user.lastName}`.trim() || user.username;

  return (
    <Box className="space-y-5" padding="default">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-heading">{userLabel}</h2>
          <p className="text-foreground">@{user.username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="flex gap-2 rounded-full border border-heading bg-transparent text-heading hover:bg-heading/10"
          >
            <Link aria-label={`Edit ${userLabel}`} href={`/users/${user.id}/edit`}>
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Link>
          </Button>
          <UserRowDeleteAction presentation="text" userId={user.id} userLabel={userLabel} />
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <ProfileFact label="Email" value={user.email} />
        <div className="space-y-1">
          <dt className="text-sm font-medium text-heading">Status</dt>
          <dd>
            <Badge variant={STATUS_BADGE_VARIANTS[user.status]}>{STATUS_LABELS[user.status]}</Badge>
          </dd>
        </div>
        <ProfileFact label="Created" value={formatDisplayDate(user.createdAt)} />
        <ProfileFact label="Last updated" value={formatDisplayDate(user.updatedAt)} />
        {user.avatar ? <ProfileFact label="Avatar URL" value={user.avatar} /> : null}
      </dl>
    </Box>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-heading">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
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
