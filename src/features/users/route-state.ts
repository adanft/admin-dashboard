import { isAdminApiError } from '@/server/api/client';
import { type RoleSummary, rolesApi } from '@/server/api/roles';
import type { UserProfile } from '@/server/api/users';
import { usersApi } from '@/server/api/users';
import { getSession } from '@/server/auth/session';

export type UserRouteState =
  | { status: 'success'; user: UserProfile }
  | {
      status: 'not-found' | 'unauthorized' | 'forbidden' | 'error';
      guidance: string;
      title: string;
    };

export type UserRolesRouteState =
  | {
      status: 'success';
      availableRoles: RoleSummary[];
      rolesError?: string;
      rolesWarning?: string;
      user: UserProfile;
    }
  | Exclude<UserRouteState, { status: 'success' }>;

const EXPIRED_SESSION_TITLE = 'Your session expired. Please sign in again.';

export async function loadUserRouteState(id: string): Promise<UserRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return userRouteMessage('unauthorized');
  }

  try {
    return { status: 'success', user: await usersApi.getUser(id, session.accessToken) };
  } catch (error) {
    return mapUserRouteError(error);
  }
}

export async function loadUserRolesRouteState(id: string): Promise<UserRolesRouteState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return userRouteMessage('unauthorized');
  }

  try {
    const user = await usersApi.getUser(id, session.accessToken);
    const rolesResult = await rolesApi.listRoles({ limit: 100, offset: 0 }, session.accessToken);

    const rolesWarning =
      rolesResult.status === 'success'
        ? buildAvailableRolesWarning(rolesResult.data.total, rolesResult.data.rows.length)
        : undefined;

    return {
      status: 'success',
      user,
      availableRoles: rolesResult.status === 'success' ? rolesResult.data.rows : [],
      ...(rolesWarning ? { rolesWarning } : {}),
      ...(rolesResult.status === 'success'
        ? {}
        : { rolesError: 'Unable to load available roles right now.' }),
    };
  } catch (error) {
    return mapUserRouteError(error);
  }
}

function buildAvailableRolesWarning(total: number, loaded: number) {
  return total > loaded
    ? `Only the first ${loaded} of ${total} roles are available here. Some roles may be missing from this selector.`
    : undefined;
}

export async function hasCreateUserSession() {
  const session = await getSession();
  return Boolean(session?.accessToken);
}

function mapUserRouteError(error: unknown): Exclude<UserRouteState, { status: 'success' }> {
  if (!isAdminApiError(error)) {
    return userRouteMessage('error');
  }

  if (error.status === 401) {
    return userRouteMessage('unauthorized');
  }

  if (error.status === 403) {
    return userRouteMessage('forbidden');
  }

  if (error.status === 404) {
    return userRouteMessage('not-found');
  }

  return userRouteMessage('error');
}

function userRouteMessage(
  status: Exclude<UserRouteState, { status: 'success' }>['status'],
): Exclude<UserRouteState, { status: 'success' }> {
  if (status === 'not-found') {
    return {
      status,
      title: 'User not found',
      guidance: 'This user profile no longer exists.',
    };
  }

  if (status === 'unauthorized') {
    return { status, title: EXPIRED_SESSION_TITLE, guidance: 'Sign in again to continue.' };
  }

  if (status === 'forbidden') {
    return {
      status,
      title: 'You do not have permission to view this user.',
      guidance: 'Ask an administrator for users.read access.',
    };
  }

  return {
    status,
    title: 'Unable to load this user right now.',
    guidance: 'Refresh the page or try again later.',
  };
}
