import 'server-only';

import { getAdminApiBaseUrl } from '@/lib/api/config';
import type {
  AuthSessionData,
  BackendEnvelope,
  LoginPayload,
  RegisterPayload,
} from '@/lib/auth/types';

type RequestOptions<TPayload> = {
  path: string;
  payload: TPayload;
};

type AuthenticatedGetOptions = {
  path: string;
  token: string;
  query?: Record<string, string | number | boolean | null | undefined>;
};

type AuthenticatedJsonOptions<TPayload> = {
  method: 'POST' | 'PUT';
  path: string;
  token: string;
  payload: TPayload;
};

type AuthenticatedDeleteOptions = {
  path: string;
  token: string;
};

type LogoutOptions = {
  refreshToken?: string;
};

type ParsedEnvelopeBody<TData> = Partial<BackendEnvelope<TData>> & {
  code?: string;
  error?: string;
};

export class AdminApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor({ code, message, status }: { code?: string; message: string; status: number }) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function requestJson<TPayload, TData>({ path, payload }: RequestOptions<TPayload>) {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const envelope = await parseEnvelope<TData>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }

  return envelope.data;
}

export async function requestAuthenticatedGet<TData>({
  path,
  query,
  token,
}: AuthenticatedGetOptions) {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}${serializeQuery(query)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const envelope = await parseEnvelope<TData>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }

  return envelope.data;
}

export async function requestAuthenticatedJson<TPayload, TData>({
  method,
  path,
  payload,
  token,
}: AuthenticatedJsonOptions<TPayload>) {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const envelope = await parseEnvelope<TData>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }

  return envelope.data;
}

export async function requestAuthenticatedDelete({ path, token }: AuthenticatedDeleteOptions) {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (response.status === 204) {
    return;
  }

  const envelope = await parseEnvelope<null>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }
}

async function requestCookiePost({ path, refreshToken }: { path: string; refreshToken?: string }) {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (refreshToken) {
    headers.Cookie = `refresh_token=${refreshToken}`;
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method: 'POST',
    headers,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return;
  }

  const envelope = await parseEnvelope<null>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }
}

function serializeQuery(query?: AuthenticatedGetOptions['query']) {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();

  return serialized ? `?${serialized}` : '';
}

async function parseEnvelope<TData>(response: Response): Promise<BackendEnvelope<TData>> {
  const fallbackStatus = response.status || 500;
  const fallbackError = response.ok ? 'Unexpected API response.' : response.statusText;

  try {
    const body = (await response.json()) as ParsedEnvelopeBody<TData>;

    if (body.success === false || !response.ok) {
      return {
        success: false,
        code: body.code,
        error: body.error || fallbackError || 'Request failed.',
        status: body.status ?? fallbackStatus,
      };
    }

    if (body.success === true && 'data' in body) {
      return {
        success: true,
        data: body.data as TData,
        status: body.status ?? fallbackStatus,
      };
    }
  } catch {
    // Fall through to a status-preserving error for invalid or empty JSON.
  }

  return {
    success: false,
    error: fallbackError || 'Request failed.',
    status: fallbackStatus,
  };
}

export const authApi = {
  login(payload: LoginPayload) {
    return requestJson<LoginPayload, AuthSessionData>({ path: '/auth/login', payload });
  },
  logout(options: LogoutOptions = {}) {
    return requestCookiePost({ path: '/auth/logout', refreshToken: options.refreshToken });
  },
  register(payload: RegisterPayload) {
    return requestJson<RegisterPayload, AuthSessionData>({ path: '/auth/register', payload });
  },
};

export function isAdminApiError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError;
}
