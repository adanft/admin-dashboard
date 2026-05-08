import Box from '@adanft/ui/box';

import type { PermissionRouteState } from './route-state';

export function PermissionRouteMessage({
  state,
}: {
  state: Exclude<PermissionRouteState, { status: 'success' }>;
}) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.title}</h2>
      <p className="text-foreground">{state.guidance}</p>
    </Box>
  );
}
