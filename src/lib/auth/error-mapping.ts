import { isAdminApiError } from '@/lib/api/client';

export const SETUP_CLOSED_MESSAGE = 'Initial setup is no longer available. Please sign in';

export function getSignUpErrorMessage(error: unknown) {
  if (isAdminApiError(error) && [403, 409].includes(error.status)) {
    return SETUP_CLOSED_MESSAGE;
  }

  if (isAdminApiError(error) && error.status === 400) {
    return 'Review the registration details and try again.';
  }

  return 'Initial setup is unavailable. Please try again.';
}
