import type { ChangePasswordPayload } from '@/server/api/account';
import { isAdminApiError } from '@/server/api/account';

export type ChangePasswordField = keyof ChangePasswordPayload;

export type ChangePasswordPayloadResult =
  | { success: true; payload: ChangePasswordPayload }
  | { success: false; fieldErrors: Partial<Record<ChangePasswordField, string>> };

export const CHANGE_PASSWORD_VALIDATION_MESSAGE = 'Review the highlighted fields and try again.';
export const BAD_REQUEST_PASSWORD_MESSAGE =
  'We could not update your password. Check that your current password is correct and that the new password meets the password policy.';

const GENERIC_PASSWORD_CHANGE_ERROR_MESSAGE = 'Unable to update your password right now.';

export function readChangePasswordPayload(formData: FormData): ChangePasswordPayloadResult {
  // biome-ignore lint/nursery/noSecrets: These are public form field names, not secret values.
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

export function getChangePasswordErrorMessage(
  error: unknown,
  messages: { expiredSession: string },
) {
  if (!isAdminApiError(error)) {
    return GENERIC_PASSWORD_CHANGE_ERROR_MESSAGE;
  }

  if (error.status === 401) {
    return messages.expiredSession;
  }

  if (error.status === 400) {
    return BAD_REQUEST_PASSWORD_MESSAGE;
  }

  return GENERIC_PASSWORD_CHANGE_ERROR_MESSAGE;
}

function readRequiredText(formData: FormData, key: ChangePasswordField) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
