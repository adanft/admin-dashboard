import 'server-only';

import { cookies } from 'next/headers';

import type { AuthSessionData } from '@/lib/auth/types';
import {
  ADMIN_SESSION_COOKIE,
  type AdminSession,
  decodeAdminSession,
  encodeAdminSession,
} from './session-cookie';

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60;
const MS_PER_SECOND = 1000;
const UNIX_SECONDS_THRESHOLD = 10_000_000_000;

export async function getSession() {
  const cookieStore = await cookies();
  return decodeAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function setSessionFromAuthData(data: AuthSessionData) {
  const session = createSessionFromAuthData(data);

  if (!session) {
    return false;
  }

  const cookieStore = await cookies();
  const encodedSession = encodeAdminSession(session);

  if (!encodedSession) {
    return false;
  }

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: encodedSession,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    expires: new Date(session.expiresAt),
  });

  return true;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function createSessionFromAuthData(data: AuthSessionData): AdminSession | null {
  const accessToken = data.accessToken || data.token;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    expiresAt: resolveExpiresAt(data, accessToken),
  };
}

function resolveExpiresAt(data: AuthSessionData, accessToken: string) {
  if (typeof data.expiresAt === 'number') {
    return normalizeExpiresAt(data.expiresAt);
  }

  if (typeof data.expiresAt === 'string') {
    const parsedDate = Date.parse(data.expiresAt);

    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  const expiresIn = data.expiresIn ?? data.expiresInSeconds;

  if (typeof expiresIn === 'number' && expiresIn > 0) {
    return Date.now() + expiresIn * MS_PER_SECOND;
  }

  return readJwtExpiresAt(accessToken) ?? Date.now() + DEFAULT_SESSION_TTL_SECONDS * MS_PER_SECOND;
}

function normalizeExpiresAt(expiresAt: number) {
  return expiresAt < UNIX_SECONDS_THRESHOLD ? expiresAt * MS_PER_SECOND : expiresAt;
}

function readJwtExpiresAt(accessToken: string) {
  const [, payload] = accessToken.split('.');

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf8')) as {
      exp?: unknown;
    };

    return typeof decoded.exp === 'number' ? decoded.exp * MS_PER_SECOND : null;
  } catch {
    return null;
  }
}
