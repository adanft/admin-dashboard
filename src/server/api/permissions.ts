import 'server-only';

import {
  isAdminApiError,
  requestAuthenticatedGet,
  requestAuthenticatedJson,
} from '@/server/api/client';

export type PermissionStatus = 'active' | 'disabled';
export type PermissionsListLimit = 10 | 25 | 50 | 100;

export type PermissionSummary = {
  id: string;
  key: string;
  displayName: string;
  description?: string;
  category: string;
  status: PermissionStatus;
  sortOrder: number;
};

export type PermissionsListQuery = {
  search?: string;
  limit: PermissionsListLimit;
  offset: number;
};

export type PermissionsListSearchParams = Record<string, string | string[] | undefined>;

export type PermissionsList = {
  permissions: PermissionSummary[];
  pagination: { total: number; limit: number; offset: number };
  total: number;
};

export type PermissionsListState =
  | { status: 'success'; data: PermissionsList }
  | { status: 'bad-request' | 'unauthorized' | 'forbidden' | 'error'; message: string };

export type PermissionProfile = PermissionSummary;

export type UpdatePermissionPayload = {
  displayName: string;
  description?: string;
  category: string;
  sortOrder: number;
};

const DEFAULT_QUERY: PermissionsListQuery = { limit: 50, offset: 0 };
const PERMISSION_STATUSES = ['active', 'disabled'] as const;
const PERMISSIONS_LIST_LIMITS = [10, 25, 50, 100] as const;

export function normalizePermissionsListQuery(
  params: PermissionsListSearchParams,
): PermissionsListQuery {
  const search = firstParam(params.search)?.trim();
  const limit =
    parseNumberOption(firstParam(params.limit), PERMISSIONS_LIST_LIMITS) ?? DEFAULT_QUERY.limit;
  const offset = parseOffset(firstParam(params.offset));

  return {
    ...(search ? { search } : {}),
    limit,
    offset,
  };
}

export function mapPermissionsListResponse(response: unknown): PermissionsList {
  const body = isRecord(response) ? response : {};
  const backendPermissions = Array.isArray(body.items) ? body.items : [];
  const pagination = mapPagination(body.pagination, backendPermissions.length);

  return {
    permissions: backendPermissions.map(mapPermissionSummary),
    pagination,
    total: pagination.total,
  };
}

export function mapPermissionSummary(response: unknown): PermissionSummary {
  const permission = isRecord(response) ? response : {};
  const key = readString(permission.key) ?? 'unknown.permission';
  const description = readString(permission.description);

  return {
    id: readString(permission.id) ?? key,
    key,
    displayName: readString(permission.displayName) ?? readString(permission.display_name) ?? key,
    ...(description ? { description } : {}),
    category: readString(permission.category) ?? 'General',
    status: parseOption(readString(permission.status), PERMISSION_STATUSES) ?? 'disabled',
    sortOrder:
      readNonNegativeNumber(permission.sortOrder) ??
      readNonNegativeNumber(permission.sort_order) ??
      0,
  };
}

export function toPermissionsListState(
  error: unknown,
): Exclude<PermissionsListState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 400) return { status: 'bad-request', message: 'Invalid permission filters.' };
  if (status === 401)
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  if (status === 403)
    return { status: 'forbidden', message: 'You do not have permission to view permissions.' };
  return { status: 'error', message: 'Unable to load permissions right now.' };
}

export const permissionsApi = {
  async listPermissions(
    token: string,
    query: PermissionsListQuery = DEFAULT_QUERY,
  ): Promise<PermissionsListState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({
        path: '/permissions',
        token,
        query: toBackendQuery(query),
      });

      return { status: 'success', data: mapPermissionsListResponse(response) };
    } catch (error) {
      return toPermissionsListState(error);
    }
  },
  async listPermissionsData(
    token: string,
    query: PermissionsListQuery = DEFAULT_QUERY,
  ): Promise<PermissionsList> {
    const state = await permissionsApi.listPermissions(token, query);

    if (state.status !== 'success') {
      throw new Error(state.message);
    }

    return state.data;
  },
  async getPermission(id: string, token: string): Promise<PermissionProfile> {
    const response = await requestAuthenticatedGet<unknown>({
      path: `/permissions/${encodeURIComponent(id)}`,
      token,
    });

    return mapPermissionSummary(response);
  },
  async updatePermission(
    id: string,
    payload: UpdatePermissionPayload,
    token: string,
  ): Promise<PermissionProfile> {
    const response = await requestAuthenticatedJson<UpdatePermissionPayload, unknown>({
      method: 'PATCH',
      path: `/permissions/${encodeURIComponent(id)}`,
      payload,
      token,
    });

    return mapPermissionSummary(response);
  },
};

function toBackendQuery(query: PermissionsListQuery) {
  const search = query.search?.trim();

  return {
    ...(search ? { search } : {}),
    limit: query.limit,
    ...(query.offset ? { offset: query.offset } : {}),
  };
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

function mapPagination(value: unknown, fallbackTotal: number) {
  const pagination = isRecord(value) ? value : {};

  return {
    total: readNonNegativeNumber(pagination.total) ?? fallbackTotal,
    limit: readNonNegativeNumber(pagination.limit) ?? DEFAULT_QUERY.limit,
    offset: readNonNegativeNumber(pagination.offset) ?? DEFAULT_QUERY.offset,
  };
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

function readNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
