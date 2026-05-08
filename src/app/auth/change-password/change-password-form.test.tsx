import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequiredPasswordChangeState } from './actions';
import RequiredPasswordChangeForm from './change-password-form';

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

describe('RequiredPasswordChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActionStateMock.mockImplementation((_action, initialState) => [
      initialState,
      '/auth/change-password',
      false,
    ]);
  });

  it('associates form-level password change errors with the form', () => {
    const markup = renderRequiredPasswordChangeForm({
      status: 'error',
      message: 'Your password change session expired. Sign in again to continue.',
    });

    expect(markup).toContain('aria-describedby="required-password-change-form-message"');
    expect(markup).toContain('id="required-password-change-form-message"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your password change session expired. Sign in again to continue.');
  });

  it('renders accessible field labels and field errors for password inputs', () => {
    const markup = renderRequiredPasswordChangeForm({
      status: 'error',
      message: 'Review the highlighted fields and try again.',
      fieldErrors: {
        currentPassword: 'Current password is required.',
        newPassword: 'New password is required.',
      },
    });

    expect(markup).toContain('for="currentPassword"');
    expect(markup).toContain('Temporary password');
    expect(markup).toContain('for="newPassword"');
    expect(markup).toContain('New password');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('Current password is required.');
    expect(markup).toContain('New password is required.');
  });
});

function renderRequiredPasswordChangeForm(initialActionState: RequiredPasswordChangeState) {
  return renderToStaticMarkup(
    <RequiredPasswordChangeForm initialActionState={initialActionState} />,
  );
}
