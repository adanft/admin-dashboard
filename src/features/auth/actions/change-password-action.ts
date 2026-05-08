'use server';

import { redirect } from 'next/navigation';

import { accountApi } from '@/server/api/account';
import {
  clearRefreshCookie,
  clearRequiredPasswordChangeSession,
  clearSession,
  getRequiredPasswordChangeSession,
} from '@/server/auth/session';
import {
  CHANGE_PASSWORD_VALIDATION_MESSAGE,
  type ChangePasswordField,
  getChangePasswordErrorMessage,
  readChangePasswordPayload,
} from './change-password-core';

export type RequiredPasswordChangeState = {
  status?: 'error';
  message?: string;
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
};

const EXPIRED_PASSWORD_CHANGE_MESSAGE =
  'Your password change session expired. Sign in again to continue.';
const PASSWORD_CHANGED_SIGN_IN_PATH = `/auth/sign-in?${new URLSearchParams({
  passwordChanged: '1',
}).toString()}`;

export async function requiredPasswordChangeAction(
  _previousState: RequiredPasswordChangeState,
  formData: FormData,
): Promise<RequiredPasswordChangeState> {
  const payload = readChangePasswordPayload(formData);

  if (!payload.success) {
    return {
      status: 'error',
      message: CHANGE_PASSWORD_VALIDATION_MESSAGE,
      fieldErrors: payload.fieldErrors,
    };
  }

  const session = await getRequiredPasswordChangeSession();

  if (!session?.accessToken) {
    await clearRequiredPasswordChangeSession();
    return { status: 'error', message: EXPIRED_PASSWORD_CHANGE_MESSAGE };
  }

  try {
    await accountApi.changePassword(payload.payload, session.accessToken);
  } catch (error) {
    return {
      status: 'error',
      message: getChangePasswordErrorMessage(error, {
        expiredSession: EXPIRED_PASSWORD_CHANGE_MESSAGE,
      }),
    };
  }

  await clearRequiredPasswordChangeSession();
  await clearSession();
  await clearRefreshCookie();
  redirect(PASSWORD_CHANGED_SIGN_IN_PATH);
}
