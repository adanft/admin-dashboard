import Box from '@adanft/ui/box';

import { isAdminApiError } from '@/server/api/client';
import { type PermissionSummary, permissionsApi } from '@/server/api/permissions';
import { type RoleProfile, rolesApi } from '@/server/api/roles';
import { getSession } from '@/server/auth/session';

export type RoleRouteState =
  | {
      status: 'success';
      role: RoleProfile;
      assignedPermissions: PermissionSummary[];
      availablePermissions: PermissionSummary[];
      permissionsError?: string;
    }
  | {
      status: 'not-found' | 'unauthorized' | 'forbidden' | 'error';
      guidance: string;
      title: string;
    };

export type RoleDetailRouteState =
  | {
      status: 'success';
      role: RoleProfile;
      assignedPermissions: PermissionSummary[];
      permissionsError?: string;
    }
  | Exclude<RoleRouteState, { status: 'success' }>;

const EXPIRED_SESSION_TITLE = 'Your session expired. Please sign in again.';

export async function loadRoleRouteState(id: string): Promise<RoleRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return roleRouteMessage('unauthorized');
  }

  try {
    const role = await rolesApi.getRole(id, session.accessToken);
    const [assignedResult, availableResult] = await Promise.allSettled([
      rolesApi.listRolePermissions(id, session.accessToken),
      permissionsApi.listPermissionsData(session.accessToken, { limit: 100, offset: 0 }),
    ]);

    const assignedPermissions = assignedResult.status === 'fulfilled' ? assignedResult.value : [];
    const availablePermissions =
      availableResult.status === 'fulfilled' ? availableResult.value.permissions : [];

    return {
      status: 'success',
      role,
      assignedPermissions,
      availablePermissions,
      ...(assignedResult.status === 'rejected' || availableResult.status === 'rejected'
        ? { permissionsError: 'Unable to load role permissions right now.' }
        : {}),
    };
  } catch (error) {
    return mapRoleRouteError(error);
  }
}

export async function loadRoleDetailRouteState(id: string): Promise<RoleDetailRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return roleRouteMessage('unauthorized');
  }

  try {
    const role = await rolesApi.getRole(id, session.accessToken);
    const assignedResult = await rolesApi
      .listRolePermissions(id, session.accessToken)
      .then((permissions) => ({ permissions, status: 'success' as const }))
      .catch(() => ({ permissions: [], status: 'error' as const }));

    return {
      status: 'success',
      role,
      assignedPermissions: assignedResult.permissions,
      ...(assignedResult.status === 'error'
        ? { permissionsError: 'Unable to load role permissions right now.' }
        : {}),
    };
  } catch (error) {
    return mapRoleRouteError(error);
  }
}

export async function loadRoleProfileRouteState(id: string): Promise<RoleRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return roleRouteMessage('unauthorized');
  }

  try {
    return {
      status: 'success',
      role: await rolesApi.getRole(id, session.accessToken),
      assignedPermissions: [],
      availablePermissions: [],
    };
  } catch (error) {
    return mapRoleRouteError(error);
  }
}

export async function hasCreateRoleSession() {
  const session = await getSession();
  return Boolean(session?.accessToken);
}

export function RoleRouteMessage({
  state,
}: {
  state: Exclude<RoleRouteState, { status: 'success' }>;
}) {
  return (
    <Box className="space-y-2" padding="default" role="alert">
      <h2 className="text-xl font-semibold text-heading">{state.title}</h2>
      <p className="text-foreground">{state.guidance}</p>
    </Box>
  );
}

function mapRoleRouteError(error: unknown): Exclude<RoleRouteState, { status: 'success' }> {
  if (!isAdminApiError(error)) return roleRouteMessage('error');
  if (error.status === 401) return roleRouteMessage('unauthorized');
  if (error.status === 403) return roleRouteMessage('forbidden');
  if (error.status === 404) return roleRouteMessage('not-found');
  return roleRouteMessage('error');
}

function roleRouteMessage(
  status: Exclude<RoleRouteState, { status: 'success' }>['status'],
): Exclude<RoleRouteState, { status: 'success' }> {
  if (status === 'not-found') {
    return { status, title: 'Role not found', guidance: 'This role no longer exists.' };
  }

  if (status === 'unauthorized') {
    return { status, title: EXPIRED_SESSION_TITLE, guidance: 'Sign in again to continue.' };
  }

  if (status === 'forbidden') {
    return {
      status,
      title: 'You do not have permission to view this role.',
      guidance: 'Ask an administrator for roles.read access.',
    };
  }

  return {
    status,
    title: 'Unable to load this role right now.',
    guidance: 'Refresh the page or try again later.',
  };
}
