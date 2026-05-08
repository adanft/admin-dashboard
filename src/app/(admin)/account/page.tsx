import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Link from 'next/link';

import {
  type AccountRole,
  authApi,
  type CurrentAccountState,
  type CurrentActor,
} from '@/lib/api/auth';
import { getSession } from '@/lib/auth/session';
import ChangePasswordForm from './_components/change-password-form';
import LogoutAllSessionsForm from './_components/logout-all-sessions-form';

export default async function AccountPage() {
  const session = await getSession();
  const state: CurrentAccountState = session?.accessToken
    ? await authApi.getCurrentAccount(session.accessToken)
    : { status: 'unauthorized', message: 'Your session expired or is invalid.' };

  return (
    <section className="space-y-6 px-6 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">My Account</h1>
          <p className="max-w-prose text-foreground">Review your account details.</p>
        </div>
        <Button asChild outline variant="theme">
          <Link href="/account/sessions">Sessions</Link>
        </Button>
      </header>

      {state.status === 'success' ? (
        <AccountContent actor={state.data.actor} roles={state.data.roles} />
      ) : (
        <AccountMessage state={state} />
      )}
    </section>
  );
}

function AccountContent({ actor, roles }: { actor: CurrentActor; roles: AccountRole[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
      <div className="space-y-6">
        <AccountProfile actor={actor} />
        <AccountRoles roles={roles} />
      </div>
      <div className="space-y-6">
        <Box className="space-y-4" padding="default">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-heading">Change password</h2>
            <p className="text-foreground">Update the password for your own account.</p>
          </div>
          <ChangePasswordForm />
        </Box>

        <Box className="space-y-4" padding="default">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-heading">Log out everywhere</h2>
            <p className="text-foreground">
              Revoke all refresh sessions for your account and clear this dashboard session. Any
              already-issued access tokens expire naturally.
            </p>
          </div>
          <LogoutAllSessionsForm />
        </Box>
      </div>
    </div>
  );
}

function AccountRoles({ roles }: { roles: AccountRole[] }) {
  return (
    <Box className="space-y-4" padding="default">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-heading">Roles</h2>
        <p className="text-foreground">Roles assigned to your account.</p>
      </div>

      {roles.length > 0 ? (
        <ul className="space-y-3">
          {roles.map((role) => (
            <li
              className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              key={role.id}
            >
              <div className="space-y-1">
                <p className="font-medium text-heading">{role.displayName}</p>
                <p className="text-sm text-foreground">{role.key}</p>
              </div>
              {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground">No roles assigned.</p>
      )}
    </Box>
  );
}

function AccountProfile({ actor }: { actor: CurrentActor }) {
  const firstName = actor.name || '—';
  const lastName = actor.lastName || '—';
  const displayName =
    [actor.name, actor.lastName].filter(Boolean).join(' ') || actor.username || '—';
  const username = actor.username ? `@${actor.username}` : '—';
  const email = actor.email || '—';

  return (
    <Box className="space-y-4" padding="default">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="break-words text-2xl font-semibold text-heading">{displayName}</h2>
          <p className="break-words text-foreground">{username}</p>
        </div>
        {actor.status ? (
          <Badge variant={actor.status === 'active' ? 'success' : 'secondary'}>
            {actor.status}
          </Badge>
        ) : null}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileFact label="First name" value={firstName} />
        <ProfileFact label="Last name" value={lastName} />
        <ProfileFact label="Username" value={username} />
        <ProfileFact label="Email" value={email} />
      </dl>
    </Box>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-heading">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}

function AccountMessage({ state }: { state: Exclude<CurrentAccountState, { status: 'success' }> }) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<CurrentAccountState, { status: 'success' }>['status']) {
  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator to confirm your account access.';
  }

  return 'Refresh the page or try again later.';
}
