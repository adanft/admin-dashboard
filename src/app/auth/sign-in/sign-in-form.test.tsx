import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import SignInForm from './sign-in-form';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/auth/sign-in', false]),
  };
});

vi.mock('./actions', () => ({
  signInAction: vi.fn(),
}));

describe('SignInForm', () => {
  it('associates rendered errors with the form and marks fields invalid', () => {
    const markup = renderToStaticMarkup(
      <SignInForm initialActionState={{ error: 'Invalid identity or password.' }} />,
    );

    expect(markup).toContain('aria-describedby="sign-in-error"');
    expect(markup).toContain('id="sign-in-error"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Invalid identity or password.');
    expect(markup).toContain('aria-invalid="true"');
  });
});
