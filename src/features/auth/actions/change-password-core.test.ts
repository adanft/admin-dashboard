import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class MockAdminApiError extends Error {
    readonly status: number;

    constructor(status: number, message = 'api error') {
      super(message);
      this.status = status;
    }
  }

  return { MockAdminApiError };
});

vi.mock('@/server/api/account', () => ({
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

import {
  BAD_REQUEST_PASSWORD_MESSAGE,
  getChangePasswordErrorMessage,
  readChangePasswordPayload,
} from './change-password-core';

describe('change password core', () => {
  it('reads and trims a valid password change payload', () => {
    const formData = new FormData();
    formData.set('currentPassword', ' current-secret ');
    formData.set('newPassword', ' new-secret ');

    expect(readChangePasswordPayload(formData)).toEqual({
      success: true,
      payload: { currentPassword: 'current-secret', newPassword: 'new-secret' },
    });
  });

  it('returns required field errors without a payload when passwords are missing', () => {
    expect(readChangePasswordPayload(new FormData())).toEqual({
      success: false,
      fieldErrors: {
        currentPassword: 'Current password is required.',
        newPassword: 'New password is required.',
      },
    });
  });

  it('maps backend 400 errors to the safe password policy message without raw details', () => {
    const message = getChangePasswordErrorMessage(
      new mocks.MockAdminApiError(400, 'Details: new password contains the username'),
      { expiredSession: 'Expired session.' },
    );

    expect(message).toBe(BAD_REQUEST_PASSWORD_MESSAGE);
    expect(message).not.toContain('Details:');
    expect(message).not.toContain('username');
  });

  it('maps backend 401 errors to the caller-specific expired session message', () => {
    expect(
      getChangePasswordErrorMessage(new mocks.MockAdminApiError(401), {
        expiredSession: 'Expired session.',
      }),
    ).toBe('Expired session.');
  });

  it('maps unknown errors to a generic safe message', () => {
    expect(
      getChangePasswordErrorMessage(new Error('Details: database unavailable'), {
        expiredSession: 'Expired session.',
      }),
    ).toBe('Unable to update your password right now.');
  });
});
