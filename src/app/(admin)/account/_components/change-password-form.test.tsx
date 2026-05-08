import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountActionState } from '../_lib/account-actions';
import ChangePasswordForm from './change-password-form';

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActionStateMock.mockImplementation((_action, initialState) => [
      initialState,
      '/account/change-password',
      false,
    ]);
  });

  it('renders successful password updates as a positive status message', () => {
    const markup = renderChangePasswordForm({
      status: 'success',
      message: 'Password updated. Already-issued access tokens expire naturally.',
    });

    expect(markup).toContain('id="change-password-form-message"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('text-success');
    expect(markup).toContain('Password updated. Already-issued access tokens expire naturally.');
    expect(markup).not.toContain('role="alert"');
    expect(markup).not.toContain('class="text-sm text-danger" id="change-password-form-message"');
  });

  it('keeps password update failures in error styling', () => {
    const markup = renderChangePasswordForm({
      status: 'error',
      message: 'The current password or new password details were rejected.',
    });

    expect(markup).toContain('id="change-password-form-message"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('text-danger');
    expect(markup).toContain('The current password or new password details were rejected.');
    expect(markup).not.toContain('aria-live="polite"');
    expect(markup).not.toContain('text-success');
  });
});

function renderChangePasswordForm(initialActionState: AccountActionState) {
  return renderToStaticMarkup(<ChangePasswordForm initialActionState={initialActionState} />);
}
