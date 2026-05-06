import Box from '@adanft/ui/box';

import type { RolesListState } from '@/lib/api/roles';
import { RolesPaginationFoot, RolesPaginationHead } from './roles-pagination';
import RolesTable from './roles-table';

export default function RolesStateView({ state }: { state: RolesListState }) {
  if (state.status !== 'success') {
    return <RolesMessage state={state} />;
  }

  if (state.data.rows.length === 0) {
    return (
      <Box className="space-y-2" padding="default">
        <h2 className="text-xl font-semibold text-heading">No roles found</h2>
        <p className="text-foreground">Try adjusting the current roles filters.</p>
      </Box>
    );
  }

  return (
    <div className="space-y-4">
      <RolesPaginationHead pagination={state.data.pagination} total={state.data.total} />
      <RolesTable roles={state.data} />
      <RolesPaginationFoot pagination={state.data.pagination} total={state.data.total} />
    </div>
  );
}

function RolesMessage({ state }: { state: Exclude<RolesListState, { status: 'success' }> }) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<RolesListState, { status: 'success' }>['status']) {
  if (status === 'bad-request') {
    return 'Review the filters and try again.';
  }

  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator for roles.read access.';
  }

  return 'Refresh the page or try again later.';
}
