import 'server-only';

import {
  AdminApiError,
  isAdminApiError,
  requestAuthenticatedCookiePost,
  requestAuthenticatedDelete,
  requestAuthenticatedGet,
  requestAuthenticatedJson,
} from '@/server/api/client';
import type { UserStatus } from '@/server/api/users';

export type AccountRole = {
  id: string;
  key: string;
  displayName: string;
  status: 'active' | 'disabled';
  isSystem: boolean;
};

export type CurrentActor = {
  id: string;
  name: string;
  lastName: string;
  username: string;
  email: string;
  status?: UserStatus;
  avatar?: string;
};

export type CurrentAccount = {
  actor: CurrentActor;
  roles: AccountRole[];
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type AuthSession = {
  id: string;
  familyId: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type CurrentAccountState =
  | { status: 'success'; data: CurrentAccount }
  | { status: 'unauthorized' | 'forbidden' | 'error'; message: string };

export type AuthSessionsState =
  | { status: 'success'; data: AuthSession[] }
  | { status: 'unauthorized' | 'forbidden' | 'error'; message: string };

const USER_STATUSES = ['active', 'disabled', 'locked', 'pending_password_change'] as const;
const ROLE_STATUSES = ['active', 'disabled'] as const;

export function mapCurrentAccountResponse(response: unknown): CurrentAccount {
  const body = isRecord(response) ? response : {};
  const actor = mapCurrentActor(isRecord(body.actor) ? body.actor : body);

  return {
    actor,
    roles: mapRoles(body.roles),
  };
}

export function mapAuthSessionsResponse(response: unknown): AuthSession[] {
  const sessions = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.sessions)
      ? response.sessions
      : [];

  return sessions.flatMap((session) => {
    if (!isRecord(session)) return [];

    const id = readString(session.id);
    const familyId = readString(session.familyId) ?? readString(session.family_id);
    const createdAt = readString(session.createdAt) ?? readString(session.created_at);
    const expiresAt = readString(session.expiresAt) ?? readString(session.expires_at);

    if (!id || !familyId || !createdAt || !expiresAt) return [];

    return [
      {
        id,
        familyId,
        createdAt,
        expiresAt,
        isCurrent: readBoolean(session.isCurrent) ?? readBoolean(session.is_current) ?? false,
      },
    ];
  });
}

export function toCurrentAccountState(
  error: unknown,
): Exclude<CurrentAccountState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 401) {
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  }

  if (status === 403) {
    return { status: 'forbidden', message: 'You do not have permission to view this account.' };
  }

  return { status: 'error', message: 'Unable to load your account right now.' };
}

export function toAuthSessionsState(
  error: unknown,
): Exclude<AuthSessionsState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 401) {
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  }

  if (status === 403) {
    return { status: 'forbidden', message: 'You do not have permission to view sessions.' };
  }

  return { status: 'error', message: 'Unable to load your sessions right now.' };
}

export const accountApi = {
  async getCurrentAccount(token: string): Promise<CurrentAccountState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({ path: '/auth/me', token });
      return { status: 'success', data: mapCurrentAccountResponse(response) };
    } catch (error) {
      return toCurrentAccountState(error);
    }
  },
  async getSessions(token: string, refreshToken?: string): Promise<AuthSessionsState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({
        path: '/auth/sessions',
        refreshToken,
        token,
      });
      return { status: 'success', data: mapAuthSessionsResponse(response) };
    } catch (error) {
      return toAuthSessionsState(error);
    }
  },
  async changePassword(payload: ChangePasswordPayload, token: string): Promise<CurrentActor> {
    const response = await requestAuthenticatedJson<ChangePasswordPayload, unknown>({
      method: 'POST',
      path: '/auth/change-password',
      payload,
      token,
    });

    return mapCurrentActor(response);
  },
  logoutAll(token: string, refreshToken?: string): Promise<void> {
    return requestAuthenticatedCookiePost({ path: '/auth/logout-all', refreshToken, token });
  },
  async revokeSession(sessionId: string, token: string, refreshToken?: string): Promise<void> {
    const trimmedSessionId = sessionId.trim();

    if (!trimmedSessionId) {
      throw new Error('Session id is required.');
    }

    return await requestAuthenticatedDelete({
      path: `/auth/sessions/${encodeURIComponent(trimmedSessionId)}`,
      refreshToken,
      token,
    });
  },
};

function mapCurrentActor(value: unknown): CurrentActor {
  const actor = isRecord(value) ? value : {};
  const status = parseOption(readString(actor.status), USER_STATUSES);
  const avatar = readString(actor.avatar);

  return {
    id: readString(actor.id) ?? 'unknown-actor',
    name: readString(actor.name) ?? '',
    lastName: readString(actor.lastName) ?? readString(actor.last_name) ?? '',
    username: readString(actor.username) ?? '',
    email: readString(actor.email) ?? '',
    ...(status ? { status } : {}),
    ...(avatar ? { avatar } : {}),
  };
}

function mapRoles(value: unknown): AccountRole[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((role) => {
    if (!isRecord(role)) return [];

    const key = readString(role.key);
    const id = readString(role.id) ?? key;

    if (!id || !key) return [];

    return [
      {
        id,
        key,
        displayName: readString(role.displayName) ?? readString(role.display_name) ?? key,
        status: parseOption(readString(role.status), ROLE_STATUSES) ?? 'disabled',
        isSystem: readBoolean(role.isSystem) ?? readBoolean(role.is_system) ?? false,
      },
    ];
  });
}

function parseOption<const TOption extends string>(
  value: string | undefined,
  options: readonly TOption[],
) {
  return options.find((option) => option === value);
}

function readString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export { AdminApiError, isAdminApiError };
