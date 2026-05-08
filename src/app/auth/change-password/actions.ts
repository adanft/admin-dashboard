'use server';

import { redirect } from 'next/navigation';

import type { ChangePasswordPayload } from '@/lib/api/auth';
import { authApi, isAdminApiError } from '@/lib/api/auth';
import {
  clearRefreshCookie,
  clearRequiredPasswordChangeSession,
  clearSession,
  getRequiredPasswordChangeSession,
} from '@/lib/auth/session';

type ChangePasswordField = keyof ChangePasswordPayload;

export type RequiredPasswordChangeState = {
  status?: 'error';
  message?: string;
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
};

const EXPIRED_PASSWORD_CHANGE_MESSAGE =
  'Your password change session expired. Sign in again to continue.';
const BAD_REQUEST_PASSWORD_MESSAGE =
  'We could not update your password. Check that your current password is correct and that the new password meets the password policy.';
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
      message: 'Review the highlighted fields and try again.',
      fieldErrors: payload.fieldErrors,
    };
  }

  const session = await getRequiredPasswordChangeSession();

  if (!session?.accessToken) {
    await clearRequiredPasswordChangeSession();
    return { status: 'error', message: EXPIRED_PASSWORD_CHANGE_MESSAGE };
  }

  try {
    await authApi.changePassword(payload.payload, session.accessToken);
  } catch (error) {
    return { status: 'error', message: getRequiredPasswordChangeErrorMessage(error) };
  }

  await clearRequiredPasswordChangeSession();
  await clearSession();
  await clearRefreshCookie();
  redirect(PASSWORD_CHANGED_SIGN_IN_PATH);
}

function readChangePasswordPayload(
  formData: FormData,
):
  | { success: true; payload: ChangePasswordPayload }
  | { success: false; fieldErrors: Partial<Record<ChangePasswordField, string>> } {
  // biome-ignore lint/nursery/noSecrets: This is a public form field name, not a secret value.
  const currentPassword = readRequiredText(formData, 'currentPassword');
  const newPassword = readRequiredText(formData, 'newPassword');

  if (currentPassword && newPassword) {
    return { success: true, payload: { currentPassword, newPassword } };
  }

  return {
    success: false,
    fieldErrors: {
      ...(currentPassword ? {} : { currentPassword: 'Current password is required.' }),
      ...(newPassword ? {} : { newPassword: 'New password is required.' }),
    },
  };
}

function getRequiredPasswordChangeErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update your password right now.';
  }

  if (error.status === 401) {
    return EXPIRED_PASSWORD_CHANGE_MESSAGE;
  }

  if (error.status === 400) {
    const backendMessage = error.message.trim();

    return backendMessage
      ? `${BAD_REQUEST_PASSWORD_MESSAGE} Details: ${backendMessage}`
      : BAD_REQUEST_PASSWORD_MESSAGE;
  }

  return 'Unable to update your password right now.';
}

function readRequiredText(formData: FormData, key: ChangePasswordField) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
