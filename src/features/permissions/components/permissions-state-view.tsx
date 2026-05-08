import Box from '@adanft/ui/box';

import type { PermissionsListState } from '@/server/api/permissions';
import { PermissionsPaginationFoot, PermissionsPaginationHead } from './permissions-pagination';
import PermissionsTable from './permissions-table';

export default function PermissionsStateView({ state }: { state: PermissionsListState }) {
  if (state.status !== 'success') {
    return <PermissionsMessage state={state} />;
  }

  if (state.data.permissions.length === 0) {
    return (
      <Box className="space-y-2" padding="default">
        <h2 className="text-xl font-semibold text-heading">No permissions found</h2>
        <p className="text-foreground">Try adjusting the current permissions filters.</p>
      </Box>
    );
  }

  return (
    <div className="space-y-4">
      <PermissionsPaginationHead pagination={state.data.pagination} total={state.data.total} />
      <PermissionsTable permissions={state.data} />
      <PermissionsPaginationFoot pagination={state.data.pagination} total={state.data.total} />
    </div>
  );
}

function PermissionsMessage({
  state,
}: {
  state: Exclude<PermissionsListState, { status: 'success' }>;
}) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.message}</h2>
      <p className="text-foreground">{messageGuidance(state.status)}</p>
    </Box>
  );
}

function messageGuidance(status: Exclude<PermissionsListState, { status: 'success' }>['status']) {
  if (status === 'bad-request') {
    return 'Review the filters and try again.';
  }

  if (status === 'unauthorized') {
    return 'Sign in again to continue.';
  }

  if (status === 'forbidden') {
    return 'Ask an administrator for permissions.read access.';
  }

  return 'Refresh the page or try again later.';
}
