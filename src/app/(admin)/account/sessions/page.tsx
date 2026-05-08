import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';
import { LogOut } from 'lucide-react';
import { cookies } from 'next/headers';

import { type AuthSession, type AuthSessionsState, authApi } from '@/lib/api/auth';
import { getSession } from '@/server/auth/session';
import { revokeSessionAction } from './_lib/session-actions';

export default async function AccountSessionsPage() {
  const session = await getSession();
  const refreshToken = (await cookies()).get('refresh_token')?.value;
  const state: AuthSessionsState = session?.accessToken
    ? await authApi.getSessions(session.accessToken, refreshToken)
    : { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">Sessions</h1>
          <p className="text-foreground">
            Review active refresh sessions for your account and revoke the ones you no longer need.
          </p>
        </div>
      </header>

      <SessionsStateView state={state} />
    </section>
  );
}

function SessionsStateView({ state }: { state: AuthSessionsState }) {
  if (state.status !== 'success') {
    return <SessionsMessage state={state} />;
  }

  if (state.data.length === 0) {
    return (
      <Box className="space-y-2" padding="default">
        <h2 className="text-xl font-semibold text-heading">No active sessions found</h2>
        <p className="text-foreground">Sign in again if you expected to see an active session.</p>
      </Box>
    );
  }

  return <SessionsTable sessions={state.data} />;
}

function SessionsTable({ sessions }: { sessions: AuthSession[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Session</TableHead>
          <TableHead scope="col">Created</TableHead>
          <TableHead scope="col">Expires</TableHead>
          <TableHead scope="col">Current</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-heading">{session.id}</span>
                  <Badge variant="primary">session</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-heading">{session.familyId}</span>
                  <Badge variant="primary">family</Badge>
                </div>
              </div>
            </TableCell>
            <TableCell>{formatSessionDate(session.createdAt)}</TableCell>
            <TableCell>{formatSessionDate(session.expiresAt)}</TableCell>
            <TableCell>
              <Badge variant={session.isCurrent ? 'success' : 'secondary'}>
                {String(session.isCurrent)}
              </Badge>
            </TableCell>
            <TableCell>
              <form action={revokeSessionAction}>
                <input name="sessionId" type="hidden" value={session.id} />
                <input name="isCurrent" type="hidden" value={String(session.isCurrent)} />
                <Button
                  aria-label={
                    session.isCurrent ? 'Revoke current session and sign out' : 'Revoke session'
                  }
                  className="size-8 rounded-full bg-transparent p-0 text-danger hover:bg-danger/10"
                  title={
                    session.isCurrent ? 'Revoke current session and sign out' : 'Revoke session'
                  }
                  type="submit"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SessionsMessage({ state }: { state: Exclude<AuthSessionsState, { status: 'success' }> }) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<AuthSessionsState, { status: 'success' }>['status']) {
  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator to confirm your account access.';
  }

  return 'Refresh the page or try again later.';
}

function formatSessionDate(value?: string) {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(parsedDate);
}
