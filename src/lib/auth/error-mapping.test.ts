import { describe, expect, it } from 'vitest';

import { AdminApiError } from '@/lib/api/client';
import { getSignUpErrorMessage, SETUP_CLOSED_MESSAGE } from './error-mapping';

describe('sign-up failures', () => {
  it.each([403, 409])('maps setup-closed status %i to the exact required message', (status) => {
    const error = new AdminApiError({ message: 'closed', status });

    expect(getSignUpErrorMessage(error)).toBe(SETUP_CLOSED_MESSAGE);
  });

  it('keeps validation failures distinct from setup-closed failures', () => {
    const error = new AdminApiError({ message: 'bad payload', status: 400 });

    expect(getSignUpErrorMessage(error)).toBe('Review the registration details and try again.');
  });
});
