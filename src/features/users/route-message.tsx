import Box from '@adanft/ui/box';

import type { UserRouteState } from './route-state';

export function UserRouteMessage({
  state,
}: {
  state: Exclude<UserRouteState, { status: 'success' }>;
}) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.title}</h2>
      <p className="text-foreground">{state.guidance}</p>
    </Box>
  );
}
