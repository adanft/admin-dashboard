import 'server-only';

import {
  AdminApiError,
  isAdminApiError,
  requestAuthenticatedDelete,
  requestAuthenticatedGet,
  requestAuthenticatedJson,
} from '@/lib/api/client';
import { mapPermissionSummary, type PermissionSummary } from '@/server/api/permissions';

export type RoleStatus = 'active' | 'disabled';
export type RolesListLimit = 10 | 25 | 50 | 100;

export type RolesListQuery = {
  search?: string;
  limit: RolesListLimit;
  offset: number;
};

export type RolesListSearchParams = Record<string, string | string[] | undefined>;

export type RoleSummary = {
  id: string;
  key: string;
  displayName: string;
  description?: string;
  status: RoleStatus;
  isSystem: boolean;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RolesList = {
  rows: RoleSummary[];
  pagination: { total: number; limit: number; offset: number };
  total: number;
};

export type RolesListState =
  | { status: 'success'; data: RolesList }
  | { status: 'bad-request' | 'unauthorized' | 'forbidden' | 'error'; message: string };

export type CreateRolePayload = {
  key: string;
  displayName: string;
  description?: string;
};

export type UpdateRolePayload = {
  displayName: string;
  description?: string;
  status: RoleStatus;
};

export type RolePermissionsPayload = {
  permissionIds: string[];
};

export type RoleProfile = RoleSummary;

const DEFAULT_QUERY: RolesListQuery = { limit: 50, offset: 0 };
const ROLE_STATUSES = ['active', 'disabled'] as const;
const ROLES_LIST_LIMITS = [10, 25, 50, 100] as const;

export function normalizeRolesListQuery(params: RolesListSearchParams): RolesListQuery {
  const search = firstParam(params.search)?.trim();
  const limit =
    parseNumberOption(firstParam(params.limit), ROLES_LIST_LIMITS) ?? DEFAULT_QUERY.limit;
  const offset = parseOffset(firstParam(params.offset));

  return {
    ...(search ? { search } : {}),
    limit,
    offset,
  };
}

export function toRolesListBackendQuery(query: RolesListQuery) {
  const search = query.search?.trim();

  return {
    ...(search ? { search } : {}),
    limit: query.limit,
    ...(query.offset !== DEFAULT_QUERY.offset ? { offset: query.offset } : {}),
  };
}

export function mapRolesListResponse(response: unknown): RolesList {
  const body = isRecord(response) ? response : {};
  const backendRoles = Array.isArray(body.items) ? body.items : [];
  const pagination = mapPagination(body.pagination, backendRoles.length);

  return {
    rows: backendRoles.map(mapRoleProfileResponse),
    pagination,
    total: pagination.total,
  };
}

export function mapRoleProfileResponse(response: unknown): RoleProfile {
  const role = isRecord(response) ? response : {};
  const key = readString(role.key) ?? 'unknown-role';
  const description = readString(role.description);
  const permissionCount =
    readNonNegativeNumber(role.permissionCount) ?? readNonNegativeNumber(role.permission_count);

  return {
    id: readString(role.id) ?? key,
    key,
    displayName: readString(role.displayName) ?? readString(role.display_name) ?? key,
    ...(description ? { description } : {}),
    status: parseOption(readString(role.status), ROLE_STATUSES) ?? 'disabled',
    isSystem: readBoolean(role.isSystem) ?? readBoolean(role.is_system) ?? false,
    permissionCount:
      permissionCount ?? (Array.isArray(role.permissions) ? role.permissions.length : 0),
    createdAt: readString(role.created_at) ?? readString(role.createdAt) ?? '—',
    updatedAt: readString(role.updated_at) ?? readString(role.updatedAt) ?? '—',
  };
}

export function mapRolePermissionsResponse(response: unknown): PermissionSummary[] {
  const permissions = Array.isArray(response) ? response : [];
  return permissions.map(mapPermissionSummary);
}

export function toRolesListState(error: unknown): Exclude<RolesListState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 400) return { status: 'bad-request', message: 'Invalid role filters.' };
  if (status === 401)
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  if (status === 403)
    return { status: 'forbidden', message: 'You do not have permission to view roles.' };
  return { status: 'error', message: 'Unable to load roles right now.' };
}

export const rolesApi = {
  async listRoles(query: RolesListQuery, token: string): Promise<RolesListState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({
        path: '/roles',
        token,
        query: toRolesListBackendQuery(query),
      });

      return { status: 'success', data: mapRolesListResponse(response) };
    } catch (error) {
      return toRolesListState(error);
    }
  },
  async getRole(id: string, token: string): Promise<RoleProfile> {
    const response = await requestAuthenticatedGet<unknown>({
      path: `/roles/${encodeURIComponent(id)}`,
      token,
    });

    return mapRoleProfileResponse(response);
  },
  async createRole(payload: CreateRolePayload, token: string): Promise<RoleProfile> {
    const response = await requestAuthenticatedJson<CreateRolePayload, unknown>({
      method: 'POST',
      path: '/roles',
      payload,
      token,
    });

    return mapRoleProfileResponse(response);
  },
  async updateRole(id: string, payload: UpdateRolePayload, token: string): Promise<RoleProfile> {
    const response = await requestAuthenticatedJson<UpdateRolePayload, unknown>({
      method: 'PATCH',
      path: `/roles/${encodeURIComponent(id)}`,
      payload,
      token,
    });

    return mapRoleProfileResponse(response);
  },
  deleteRole(id: string, token: string): Promise<void> {
    return requestAuthenticatedDelete({ path: `/roles/${encodeURIComponent(id)}`, token });
  },
  async listRolePermissions(id: string, token: string): Promise<PermissionSummary[]> {
    const response = await requestAuthenticatedGet<unknown>({
      path: `/roles/${encodeURIComponent(id)}/permissions`,
      token,
    });

    return mapRolePermissionsResponse(response);
  },
  assignPermissions(roleId: string, permissionIds: string[], token: string): Promise<void> {
    return requestAuthenticatedJson<RolePermissionsPayload, void>({
      method: 'POST',
      path: `/roles/${encodeURIComponent(roleId)}/permissions`,
      payload: { permissionIds },
      token,
    });
  },
  removePermissions(roleId: string, permissionIds: string[], token: string): Promise<void> {
    return requestAuthenticatedJson<RolePermissionsPayload, void>({
      method: 'DELETE',
      path: `/roles/${encodeURIComponent(roleId)}/permissions`,
      payload: { permissionIds },
      token,
    });
  },
};

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

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export { AdminApiError };
