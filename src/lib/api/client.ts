import 'server-only';

import { getAdminApiBaseUrl } from '@/lib/api/config';
import type {
  AuthSessionData,
  BackendEnvelope,
  LoginPayload,
  RegisterPayload,
} from '@/server/auth/types';

type RequestOptions<TPayload> = {
  path: string;
  payload: TPayload;
};

type AuthenticatedGetOptions = {
  path: string;
  refreshToken?: string;
  token: string;
  query?: Record<string, string | number | boolean | null | undefined>;
};

type AuthenticatedJsonOptions<TPayload> = {
  method: 'DELETE' | 'PATCH' | 'POST' | 'PUT';
  path: string;
  token: string;
  payload: TPayload;
};

type AuthenticatedEmptyMutationOptions = {
  method: 'DELETE' | 'POST';
  path: string;
  refreshToken?: string;
  token: string;
};

type AuthenticatedDeleteOptions = {
  path: string;
  refreshToken?: string;
  token: string;
};

type LogoutOptions = {
  refreshToken?: string;
};

type AuthenticatedCookiePostOptions = {
  path: string;
  refreshToken?: string;
  token: string;
};

type ParsedEnvelopeBody<TData> = Partial<BackendEnvelope<TData>> & {
  code?: string;
  error?: string;
};

export type BackendRefreshCookie = {
  expires?: Date;
  maxAge?: number;
  value: string;
};

type AuthApiResponse<TData> = {
  data: TData;
  refreshCookie?: BackendRefreshCookie;
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

async function requestAuthJson<TPayload, TData>({
  path,
  payload,
}: RequestOptions<TPayload>): Promise<AuthApiResponse<TData>> {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (response.status === 204) {
    return { data: undefined as TData };
  }

  const envelope = await parseEnvelope<TData>(response);

  if (!response.ok || !envelope.success) {
    throw new AdminApiError({
      code: envelope.success ? undefined : envelope.code,
      message: envelope.success ? response.statusText || 'Request failed.' : envelope.error,
      status: envelope.status || response.status,
    });
  }

  const refreshCookie = readRefreshCookie(response.headers);

  return {
    data: envelope.data,
    ...(refreshCookie ? { refreshCookie } : {}),
  };
}

export async function requestAuthenticatedGet<TData>({
  path,
  query,
  refreshToken,
  token,
}: AuthenticatedGetOptions) {
  const headers: HeadersInit = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (refreshToken) {
    headers.Cookie = `refresh_token=${refreshToken}`;
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${path}${serializeQuery(query)}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as TData;
  }

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

  if (response.status === 204) {
    return undefined as TData;
  }

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

export async function requestAuthenticatedDelete({
  path,
  refreshToken,
  token,
}: AuthenticatedDeleteOptions) {
  return requestAuthenticatedEmptyMutation({ method: 'DELETE', path, refreshToken, token });
}

export async function requestAuthenticatedEmptyPost({ path, token }: AuthenticatedDeleteOptions) {
  return requestAuthenticatedEmptyMutation({ method: 'POST', path, token });
}

export async function requestAuthenticatedCookiePost({
  path,
  refreshToken,
  token,
}: AuthenticatedCookiePostOptions) {
  const headers: HeadersInit = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
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

async function requestAuthenticatedEmptyMutation({
  method,
  path,
  refreshToken,
  token,
}: AuthenticatedEmptyMutationOptions) {
  const headers: HeadersInit = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (refreshToken) {
    headers.Cookie = `refresh_token=${refreshToken}`;
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    method,
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

function readRefreshCookie(headers: Headers): BackendRefreshCookie | null {
  for (const setCookie of getSetCookieHeaders(headers)) {
    const refreshCookie = parseRefreshCookie(setCookie);

    if (refreshCookie) {
      return refreshCookie;
    }
  }

  return null;
}

function getSetCookieHeaders(headers: Headers) {
  const headersWithSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookieHeaders = headersWithSetCookie.getSetCookie?.();

  if (setCookieHeaders?.length) {
    return setCookieHeaders;
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

function parseRefreshCookie(setCookie: string): BackendRefreshCookie | null {
  const refreshCookieStart = setCookie.match(/(?:^|,\s*)refresh_token=/)?.index;

  if (refreshCookieStart === undefined) {
    return null;
  }

  const cookie = setCookie.slice(refreshCookieStart).replace(/^,\s*/, '');
  const [nameValue, ...attributes] = cookie.split(';');
  const value = nameValue?.slice('refresh_token='.length).trim();

  if (!value) {
    return null;
  }

  const maxAge = readCookieMaxAge(attributes);
  const expires = readCookieExpires(attributes);

  return {
    value,
    ...(maxAge !== null ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  };
}

function readCookieMaxAge(attributes: string[]) {
  const maxAgeAttribute = attributes.find((attribute) =>
    attribute.trim().toLowerCase().startsWith('max-age='),
  );
  const maxAge = Number(maxAgeAttribute?.split('=')[1]);

  return Number.isFinite(maxAge) ? maxAge : null;
}

function readCookieExpires(attributes: string[]) {
  const expiresAttribute = attributes.find((attribute) =>
    attribute.trim().toLowerCase().startsWith('expires='),
  );
  const expires = Date.parse(expiresAttribute?.split('=').slice(1).join('=') ?? '');

  return Number.isNaN(expires) ? null : new Date(expires);
}

export const authApi = {
  login(payload: LoginPayload) {
    return requestAuthJson<LoginPayload, AuthSessionData>({ path: '/auth/login', payload });
  },
  logout(options: LogoutOptions = {}) {
    return requestCookiePost({ path: '/auth/logout', refreshToken: options.refreshToken });
  },
  register(payload: RegisterPayload) {
    return requestAuthJson<RegisterPayload, AuthSessionData>({ path: '/auth/register', payload });
  },
};

export function isAdminApiError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError;
}
