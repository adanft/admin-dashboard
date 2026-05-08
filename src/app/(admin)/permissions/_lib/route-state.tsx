import Box from '@adanft/ui/box';

import { isAdminApiError } from '@/lib/api/client';
import { type PermissionProfile, permissionsApi } from '@/lib/api/permissions';
import { getSession } from '@/server/auth/session';

export type PermissionRouteState =
  | { status: 'success'; permission: PermissionProfile }
  | {
      status: 'not-found' | 'unauthorized' | 'forbidden' | 'error';
      guidance: string;
      title: string;
    };

const EXPIRED_SESSION_TITLE = 'Your session expired. Please sign in again.';

export async function loadPermissionRouteState(id: string): Promise<PermissionRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return permissionRouteMessage('unauthorized');
  }

  try {
    return {
      status: 'success',
      permission: await permissionsApi.getPermission(id, session.accessToken),
    };
  } catch (error) {
    return mapPermissionRouteError(error);
  }
}

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

function mapPermissionRouteError(
  error: unknown,
): Exclude<PermissionRouteState, { status: 'success' }> {
  if (!isAdminApiError(error)) return permissionRouteMessage('error');
  if (error.status === 401) return permissionRouteMessage('unauthorized');
  if (error.status === 403) return permissionRouteMessage('forbidden');
  if (error.status === 404) return permissionRouteMessage('not-found');
  return permissionRouteMessage('error');
}

function permissionRouteMessage(
  status: Exclude<PermissionRouteState, { status: 'success' }>['status'],
): Exclude<PermissionRouteState, { status: 'success' }> {
  if (status === 'not-found') {
    return { status, title: 'Permission not found', guidance: 'This permission no longer exists.' };
  }

  if (status === 'unauthorized') {
    return { status, title: EXPIRED_SESSION_TITLE, guidance: 'Sign in again to continue.' };
  }

  if (status === 'forbidden') {
    return {
      status,
      title: 'You do not have permission to view this permission.',
      guidance: 'Ask an administrator for permissions.read access.',
    };
  }

  return {
    status,
    title: 'Unable to load this permission right now.',
    guidance: 'Refresh the page or try again later.',
  };
}
