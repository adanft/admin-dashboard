'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CHANGE_PASSWORD_VALIDATION_MESSAGE,
  type ChangePasswordField,
  getChangePasswordErrorMessage,
  readChangePasswordPayload,
} from '@/features/auth/actions/change-password-core';
import { accountApi } from '@/server/api/account';
import { clearRefreshCookie, clearSession, getSession } from '@/server/auth/session';

export type AccountActionState = {
  status?: 'error' | 'success';
  message?: string;
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
};

const EXPIRED_SESSION_MESSAGE = 'Your session expired. Please sign in again.';

export async function changePasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const payload = readChangePasswordPayload(formData);

  if (!payload.success) {
    return {
      status: 'error',
      message: CHANGE_PASSWORD_VALIDATION_MESSAGE,
      fieldErrors: payload.fieldErrors,
    };
  }

  const token = await readSessionToken();

  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE };
  }

  try {
    await accountApi.changePassword(payload.payload, token);
    return {
      status: 'success',
      message: 'Password updated. Already-issued access tokens expire naturally.',
    };
  } catch (error) {
    return {
      status: 'error',
      message: getChangePasswordErrorMessage(error, { expiredSession: EXPIRED_SESSION_MESSAGE }),
    };
  }
}

export async function logoutAllSessionsAction(
  _previousState: AccountActionState,
): Promise<AccountActionState> {
  const session = await getSession();
  const refreshToken = (await cookies()).get('refresh_token')?.value;

  if (!session?.accessToken) {
    await clearSession();
    await clearRefreshCookie();
    redirect('/auth/sign-in');
  }

  try {
    await accountApi.logoutAll(session.accessToken, refreshToken);
  } catch {
    return {
      status: 'error',
      message: 'Unable to log out all sessions right now. Try again later.',
    };
  }

  await clearSession();
  await clearRefreshCookie();
  redirect('/auth/sign-in');
}

async function readSessionToken() {
  const session = await getSession();
  return session?.accessToken || null;
}
