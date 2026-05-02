import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'admin_session';

const COOKIE_PART_SEPARATOR = '.';
const SESSION_SECRET_ENV = 'ADMIN_SESSION_SECRET';

export type AdminSession = {
  accessToken: string;
  expiresAt: number;
};

export function encodeAdminSession(session: AdminSession) {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}${COOKIE_PART_SEPARATOR}${signPayload(payload, secret)}`;
}

export function decodeAdminSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const secret = getSessionSecret();

    if (!secret) {
      return null;
    }

    const [payload, signature, extra] = value.split(COOKIE_PART_SEPARATOR);

    if (!payload || !signature || extra !== undefined) {
      return null;
    }

    if (!isValidSignature(payload, signature, secret)) {
      return null;
    }

    const session = JSON.parse(fromBase64Url(payload)) as Partial<AdminSession>;

    if (typeof session.accessToken !== 'string' || !session.accessToken) {
      return null;
    }

    if (typeof session.expiresAt !== 'number' || Number.isNaN(session.expiresAt)) {
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      return null;
    }

    return {
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    } satisfies AdminSession;
  } catch {
    return null;
  }
}

function getSessionSecret() {
  const explicitSecret = process.env[SESSION_SECRET_ENV]?.trim();

  if (explicitSecret) {
    return explicitSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return `admin-dashboard-dev-session:${process.env.ADMIN_API_BASE_URL ?? 'local'}`;
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function isValidSignature(payload: string, signature: string, secret: string) {
  const expected = signPayload(payload, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
