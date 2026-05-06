import 'server-only';

import { requestAuthenticatedGet } from '@/lib/api/client';

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

export type PermissionsList = {
  permissions: PermissionSummary[];
  pagination: { total: number; limit: number; offset: number };
  total: number;
};

const DEFAULT_QUERY: PermissionsListQuery = { limit: 50, offset: 0 };
const PERMISSION_STATUSES = ['active', 'disabled'] as const;

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

export const permissionsApi = {
  async listPermissions(
    token: string,
    query: PermissionsListQuery = DEFAULT_QUERY,
  ): Promise<PermissionsList> {
    const response = await requestAuthenticatedGet<unknown>({
      path: '/permissions',
      token,
      query: toBackendQuery(query),
    });

    return mapPermissionsListResponse(response);
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
