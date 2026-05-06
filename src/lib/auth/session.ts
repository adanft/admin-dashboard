import 'server-only';

import { cookies } from 'next/headers';

import type { AuthSessionData } from '@/lib/auth/types';
import {
  ADMIN_SESSION_COOKIE,
  type AdminSession,
  type AdminSessionUser,
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

  const user = resolveSessionUser(data, accessToken);

  return {
    accessToken,
    expiresAt: resolveExpiresAt(data, accessToken),
    ...(user ? { user } : {}),
  };
}

function resolveSessionUser(data: AuthSessionData, accessToken: string): AdminSessionUser | null {
  return readUserFromAuthData(data) ?? readUserFromJwt(accessToken);
}

function readUserFromAuthData(data: AuthSessionData): AdminSessionUser | null {
  const firstName = data.user?.name?.trim();
  const lastName = data.user?.lastName?.trim();
  const username = data.user?.username?.trim();
  const avatar = data.user?.avatar?.trim();

  if (!firstName || !lastName || !username) {
    return null;
  }

  return {
    lastName,
    name: firstName,
    username,
    ...(avatar ? { avatar } : {}),
  };
}

function readUserFromJwt(accessToken: string): AdminSessionUser | null {
  const payload = readJwtPayload(accessToken);

  if (!payload) {
    return null;
  }

  const firstName = readStringClaim(payload, 'name') ?? readStringClaim(payload, 'given_name');
  const lastName = readStringClaim(payload, 'lastName') ?? readStringClaim(payload, 'family_name');
  const username =
    readStringClaim(payload, 'username') ?? readStringClaim(payload, 'preferred_username');
  const avatar = readStringClaim(payload, 'avatar') ?? readStringClaim(payload, 'picture');

  if (!firstName || !lastName || !username) {
    return null;
  }

  return {
    lastName,
    name: firstName,
    username,
    ...(avatar ? { avatar } : {}),
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
  const decoded = readJwtPayload(accessToken);

  return typeof decoded?.exp === 'number' ? decoded.exp * MS_PER_SECOND : null;
}

function readJwtPayload(accessToken: string) {
  const [, payload] = accessToken.split('.');

  try {
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    return JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function readStringClaim(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
