import 'server-only';

import {
  AdminApiError,
  isAdminApiError,
  requestAuthenticatedDelete,
  requestAuthenticatedGet,
  requestAuthenticatedJson,
} from '@/lib/api/client';

export type UserStatus = 'active' | 'disabled' | 'locked' | 'pending_password_change';
export type UsersListSort = 'created_at' | 'updated_at' | 'username' | 'email' | 'status';
export type UsersListOrder = 'asc' | 'desc';
export type UsersListLimit = 10 | 25 | 50;

export type UsersListQuery = {
  search?: string;
  status?: UserStatus;
  sort: UsersListSort;
  order: UsersListOrder;
  limit: UsersListLimit;
  offset: number;
};

export type UsersListBackendQuery = Partial<UsersListQuery>;

export type UsersListSearchParams = Record<string, string | string[] | undefined>;

export type UsersListRow = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  email: string;
  status: UserStatus;
  roleSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type UsersList = {
  rows: UsersListRow[];
  pagination: UsersListPagination;
  total: number;
};

export type UsersListPagination = {
  total: number;
  limit: number;
  offset: number;
};

export type UsersListState =
  | { status: 'success'; data: UsersList }
  | { status: 'bad-request' | 'unauthorized' | 'forbidden' | 'error'; message: string };

export type UserProfilePayload = {
  name: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
};

export type CreateUserPayload = UserProfilePayload & {
  temporaryPassword: string;
};

export type UpdateUserPayload = UserProfilePayload;

export type UserProfile = UserProfilePayload & {
  id: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_QUERY: UsersListQuery = {
  sort: 'created_at',
  order: 'desc',
  limit: 10,
  offset: 0,
};

const USER_STATUSES = ['active', 'disabled', 'locked', 'pending_password_change'] as const;
const USERS_LIST_SORTS = ['created_at', 'updated_at', 'username', 'email', 'status'] as const;
const USERS_LIST_ORDERS = ['asc', 'desc'] as const;
const USERS_LIST_LIMITS = [10, 25, 50] as const;
const USERS_LIST_SORT_ALIASES = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const satisfies Record<string, UsersListSort>;

export function normalizeUsersListQuery(params: UsersListSearchParams): UsersListQuery {
  const search = firstParam(params.search)?.trim();
  const status = parseOption(firstParam(params.status)?.toLowerCase(), USER_STATUSES);
  const sort =
    parseAliasedOption(firstParam(params.sort), USERS_LIST_SORTS, USERS_LIST_SORT_ALIASES) ??
    DEFAULT_QUERY.sort;
  const order = parseOption(firstParam(params.order), USERS_LIST_ORDERS) ?? DEFAULT_QUERY.order;
  const limit =
    parseNumberOption(firstParam(params.limit), USERS_LIST_LIMITS) ?? DEFAULT_QUERY.limit;
  const offset = parseOffset(firstParam(params.offset));

  return {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    sort,
    order,
    limit,
    offset,
  };
}

export function toUsersListBackendQuery(query: UsersListQuery): UsersListBackendQuery {
  const backendQuery: UsersListBackendQuery = {};
  const search = query.search?.trim();

  if (search) {
    backendQuery.search = search;
  }

  if (query.status) {
    backendQuery.status = query.status;
  }

  if (query.sort !== DEFAULT_QUERY.sort) {
    backendQuery.sort = query.sort;
  }

  if (query.order !== DEFAULT_QUERY.order) {
    backendQuery.order = query.order;
  }

  backendQuery.limit = query.limit;

  if (query.offset !== DEFAULT_QUERY.offset) {
    backendQuery.offset = query.offset;
  }

  return backendQuery;
}

export function mapUsersListResponse(response: unknown): UsersList {
  const body = isRecord(response) ? response : {};
  const backendUsers = Array.isArray(body.items) ? body.items : [];
  const pagination = mapUsersListPagination(body.pagination, backendUsers.length);

  return {
    rows: backendUsers.map(mapUserRow),
    pagination,
    total: pagination.total,
  };
}

export function mapUserProfileResponse(response: unknown): UserProfile {
  const profile = isRecord(response) ? response : {};

  return {
    id: readString(profile.id) ?? 'unknown-user',
    name: readString(profile.name) ?? '',
    lastName: readString(profile.lastName) ?? readString(profile.last_name) ?? '',
    username: readString(profile.username) ?? '',
    email: readString(profile.email) ?? '',
    ...(readString(profile.avatar) ? { avatar: readString(profile.avatar) } : {}),
    status: parseOption(readString(profile.status), USER_STATUSES) ?? 'disabled',
    createdAt: readString(profile.created_at) ?? readString(profile.createdAt) ?? '—',
    updatedAt: readString(profile.updated_at) ?? readString(profile.updatedAt) ?? '—',
  };
}

export function toUsersListState(error: unknown): Exclude<UsersListState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 400) {
    return { status: 'bad-request', message: 'Invalid user filters.' };
  }

  if (status === 401) {
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  }

  if (status === 403) {
    return { status: 'forbidden', message: 'You do not have permission to view users.' };
  }

  return { status: 'error', message: 'Unable to load users right now.' };
}

export const usersApi = {
  async listUsers(query: UsersListQuery, token: string): Promise<UsersListState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({
        path: '/users',
        token,
        query: toUsersListBackendQuery(query),
      });

      return { status: 'success', data: mapUsersListResponse(response) };
    } catch (error) {
      return toUsersListState(error);
    }
  },
  async getUser(id: string, token: string): Promise<UserProfile> {
    const response = await requestAuthenticatedGet<unknown>({
      path: `/users/${encodeURIComponent(id)}`,
      token,
    });

    return mapUserProfileResponse(response);
  },
  async createUser(payload: CreateUserPayload, token: string): Promise<UserProfile> {
    const response = await requestAuthenticatedJson<CreateUserPayload, unknown>({
      method: 'POST',
      path: '/users',
      payload,
      token,
    });

    return mapUserProfileResponse(response);
  },
  async updateUser(id: string, payload: UpdateUserPayload, token: string): Promise<UserProfile> {
    const response = await requestAuthenticatedJson<UpdateUserPayload, unknown>({
      method: 'PUT',
      path: `/users/${encodeURIComponent(id)}`,
      payload,
      token,
    });

    return mapUserProfileResponse(response);
  },
  deleteUser(id: string, token: string): Promise<void> {
    return requestAuthenticatedDelete({ path: `/users/${encodeURIComponent(id)}`, token });
  },
};

function mapUserRow(user: unknown): UsersListRow {
  const row = isRecord(user) ? user : {};
  const id = readString(row.id) ?? readString(row.email) ?? 'unknown-user';
  const email = readString(row.email) ?? '—';
  const username = readString(row.username) ?? '—';
  const name = readString(row.name) ?? readString(row.fullName) ?? 'Unnamed user';
  const avatar = readString(row.avatar);
  const status = parseOption(readString(row.status), USER_STATUSES) ?? 'disabled';
  const roles = Array.isArray(row.roles)
    ? row.roles.filter((role) => typeof role === 'string')
    : [];

  return {
    id,
    name,
    username,
    ...(avatar ? { avatar } : {}),
    email,
    status,
    roleSummary: roles.length > 0 ? roles.join(', ') : '—',
    createdAt: readString(row.created_at) ?? readString(row.createdAt) ?? '—',
    updatedAt: readUpdatedAt(row),
  };
}

function readUpdatedAt(row: Record<string, unknown>) {
  return (
    readString(row.updated_at) ??
    readString(row.updatedAt) ??
    readString(row.last_activity_at) ??
    readString(row.lastActivityAt) ??
    '—'
  );
}

function mapUsersListPagination(value: unknown, fallbackTotal: number): UsersListPagination {
  const pagination = isRecord(value) ? value : {};

  return {
    total: readNonNegativeNumber(pagination.total) ?? fallbackTotal,
    limit: readNonNegativeNumber(pagination.limit) ?? DEFAULT_QUERY.limit,
    offset: readNonNegativeNumber(pagination.offset) ?? DEFAULT_QUERY.offset,
  };
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOption<const TOption extends string>(
  value: string | undefined,
  options: readonly TOption[],
) {
  return options.find((option) => option === value);
}

function parseAliasedOption<const TOption extends string>(
  value: string | undefined,
  options: readonly TOption[],
  aliases: Readonly<Record<string, TOption>>,
) {
  return parseOption(value, options) ?? (value ? aliases[value] : undefined);
}

function parseNumberOption<const TOption extends number>(
  value: string | undefined,
  options: readonly TOption[],
) {
  const numericValue = value ? Number(value) : Number.NaN;

  return options.find((option) => option === numericValue);
}

function parseOffset(value: string | undefined) {
  const numericValue = value ? Number(value) : DEFAULT_QUERY.offset;

  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : DEFAULT_QUERY.offset;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export { AdminApiError };
