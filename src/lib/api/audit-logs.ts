import 'server-only';

import { isAdminApiError, requestAuthenticatedGet } from '@/lib/api/client';

export type AuditLogsListLimit = 10 | 25 | 50 | 100;

export type AuditLogsListQuery = {
  search?: string;
  from?: string;
  to?: string;
  limit: AuditLogsListLimit;
  offset: number;
};

export type AuditLogsListBackendQuery = {
  from?: string;
  to?: string;
  limit: AuditLogsListLimit;
  offset?: number;
};

export type AuditLogsListSearchParams = Record<string, string | string[] | undefined>;

export type AuditLogMetadata =
  | string
  | number
  | boolean
  | null
  | AuditLogMetadata[]
  | { [key: string]: AuditLogMetadata };

export type AuditLogEvent = {
  id: string;
  actorType: string;
  actorId?: string;
  action: string;
  category: string;
  resource: string;
  resourceId?: string;
  result: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: AuditLogMetadata;
};

export type AuditLogsList = {
  events: AuditLogEvent[];
  pagination: { total: number; limit: number; offset: number };
  total: number;
};

export type AuditLogsListState =
  | { status: 'success'; data: AuditLogsList }
  | { status: 'bad-request' | 'unauthorized' | 'forbidden' | 'error'; message: string };

export type AuditLogsLocalFilters = Pick<AuditLogsListQuery, 'search'>;

const DEFAULT_QUERY: AuditLogsListQuery = { limit: 50, offset: 0 };
const AUDIT_LOGS_LIST_LIMITS = [10, 25, 50, 100] as const;

export function normalizeAuditLogsListQuery(params: AuditLogsListSearchParams): AuditLogsListQuery {
  const search = firstParam(params.search)?.trim();
  const from = firstParam(params.from)?.trim();
  const to = firstParam(params.to)?.trim();
  const limit =
    parseNumberOption(firstParam(params.limit), AUDIT_LOGS_LIST_LIMITS) ?? DEFAULT_QUERY.limit;
  const offset = parseOffset(firstParam(params.offset));

  return {
    ...(search ? { search } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    limit,
    offset,
  };
}

export function filterAuditLogsForCurrentPage(
  events: AuditLogEvent[],
  filters: AuditLogsLocalFilters,
) {
  const search = filters.search?.trim().toLowerCase();

  return events.filter((event) => {
    if (!search) {
      return true;
    }

    return buildAuditLogSearchText(event).includes(search);
  });
}

export function toAuditLogsListBackendQuery(query: AuditLogsListQuery): AuditLogsListBackendQuery {
  return {
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
    limit: query.limit,
    ...(query.offset !== DEFAULT_QUERY.offset ? { offset: query.offset } : {}),
  };
}

export function mapAuditLogsListResponse(response: unknown): AuditLogsList {
  const body = isRecord(response) ? response : {};
  const backendEvents = Array.isArray(body.items) ? body.items : [];
  const pagination = mapPagination(body.pagination, backendEvents.length);

  return {
    events: backendEvents.map(mapAuditLogEvent),
    pagination,
    total: pagination.total,
  };
}

export function mapAuditLogEvent(response: unknown): AuditLogEvent {
  const event = isRecord(response) ? response : {};
  const id = readString(event.id) ?? 'unknown-audit-log';
  const actorId = readString(event.actorId);
  const metadata = readAuditLogMetadata(event.metadata);

  return {
    id,
    actorType: readString(event.actorType) ?? 'unknown',
    ...(actorId ? { actorId } : {}),
    action: readString(event.action) ?? 'unknown',
    category: readString(event.category) ?? 'unknown',
    resource: readString(event.resource) ?? 'unknown',
    ...(readString(event.resourceId) ? { resourceId: readString(event.resourceId) } : {}),
    result: readString(event.result) ?? 'unknown',
    createdAt: readString(event.createdAt) ?? '—',
    ...(readString(event.ipAddress) ? { ipAddress: readString(event.ipAddress) } : {}),
    ...(readString(event.userAgent) ? { userAgent: readString(event.userAgent) } : {}),
    ...(readString(event.reason) ? { reason: readString(event.reason) } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

export function toAuditLogsListState(
  error: unknown,
): Exclude<AuditLogsListState, { status: 'success' }> {
  const status = isAdminApiError(error) ? error.status : 500;

  if (status === 400) return { status: 'bad-request', message: 'Invalid audit log filters.' };
  if (status === 401)
    return { status: 'unauthorized', message: 'Your session expired or is invalid.' };
  if (status === 403)
    return { status: 'forbidden', message: 'You do not have permission to view audit logs.' };
  return { status: 'error', message: 'Unable to load audit logs right now.' };
}

export const auditLogsApi = {
  async listAuditLogs(
    token: string,
    query: AuditLogsListQuery = DEFAULT_QUERY,
  ): Promise<AuditLogsListState> {
    try {
      const response = await requestAuthenticatedGet<unknown>({
        path: '/audit-logs',
        token,
        query: toAuditLogsListBackendQuery(query),
      });

      return { status: 'success', data: mapAuditLogsListResponse(response) };
    } catch (error) {
      return toAuditLogsListState(error);
    }
  },
};

function readAuditLogMetadata(value: unknown): AuditLogMetadata | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => readAuditLogMetadata(item) ?? null);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const metadata: { [key: string]: AuditLogMetadata } = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    const metadataValue = readAuditLogMetadata(nestedValue);

    if (metadataValue !== undefined) {
      metadata[key] = metadataValue;
    }
  }

  return metadata;
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

function buildAuditLogSearchText(event: AuditLogEvent) {
  return [event.actorId, event.action, event.result, event.resource, event.reason]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();
}

function mapPagination(value: unknown, fallbackTotal: number) {
  const pagination = isRecord(value) ? value : {};

  return {
    total: readNonNegativeNumber(pagination.total) ?? fallbackTotal,
    limit: readNonNegativeNumber(pagination.limit) ?? DEFAULT_QUERY.limit,
    offset: readNonNegativeNumber(pagination.offset) ?? DEFAULT_QUERY.offset,
  };
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
