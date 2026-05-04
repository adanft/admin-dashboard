import Box from '@adanft/ui/box';

import type { UsersListState } from '@/lib/api/users';
import { UsersPaginationFoot, UsersPaginationHead } from './users-pagination';
import UsersTable from './users-table';

export default function UsersStateView({ state }: { state: UsersListState }) {
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
