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
  register(payload: RegisterPayload) {
    return requestJson<RegisterPayload, AuthSessionData>({ path: '/auth/register', payload });
  },
};

export function isAdminApiError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError;
}
