import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import SignUpForm from './sign-up-form';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/auth/sign-up', false]),
  };
});

vi.mock('./actions', () => ({
  signUpAction: vi.fn(),
}));

describe('SignUpForm', () => {
  it('associates rendered setup errors with the form', () => {
    const markup = renderToStaticMarkup(
      <SignUpForm
        initialActionState={{ error: 'Initial setup is no longer available. Please sign in' }}
      />,
    );

    expect(markup).toContain('aria-describedby="sign-up-error"');
    expect(markup).toContain('id="sign-up-error"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Initial setup is no longer available. Please sign in');
  });
});
