'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ChangePasswordPayload } from '@/server/api/account';
import { accountApi, isAdminApiError } from '@/server/api/account';
import { clearRefreshCookie, clearSession, getSession } from '@/server/auth/session';

type ChangePasswordField = keyof ChangePasswordPayload;

export type AccountActionState = {
  status?: 'error' | 'success';
  message?: string;
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
};

const EXPIRED_SESSION_MESSAGE = 'Your session expired. Please sign in again.';
const BAD_REQUEST_PASSWORD_MESSAGE =
  'We could not update your password. Check that your current password is correct and that the new password meets the password policy.';

export async function changePasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const payload = readChangePasswordPayload(formData);

  if (!payload.success) {
    return {
      status: 'error',
      message: 'Review the highlighted fields and try again.',
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
    return { status: 'error', message: getChangePasswordErrorMessage(error) };
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

function getChangePasswordErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update your password right now.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
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
