import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RevokeSessionActionState } from '../actions/session-actions';
import SessionRevokeForm from './session-revoke-form';

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

describe('SessionRevokeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActionStateMock.mockImplementation((_action, initialState) => [
      initialState,
      '/account/sessions/revoke',
      false,
    ]);
  });

  it('renders safe revoke failures as inline feedback', () => {
    const markup = renderSessionRevokeForm({
      status: 'error',
      message: 'Unable to revoke this session right now. Try again later.',
    });

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('text-danger');
    expect(markup).toContain('Unable to revoke this session right now. Try again later.');
    expect(markup).not.toContain('backend unavailable');
  });
});

function renderSessionRevokeForm(initialState: RevokeSessionActionState) {
  return renderToStaticMarkup(
    <SessionRevokeForm initialState={initialState} isCurrent={false} sessionId="session-1" />,
  );
}
