import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import SignInPage from './sign-in/page';
import SignUpPage from './sign-up/page';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string; src: string }) => <span aria-label={alt} role="img" />,
}));

vi.mock('./sign-in/sign-in-form', () => ({
  default: () => <form aria-label="Sign in form" />,
}));

vi.mock('./sign-up/sign-up-form', () => ({
  default: () => <form aria-label="Setup form" />,
}));

describe('auth pages dashboard exclusion', () => {
  it('renders sign-in without the authenticated dashboard layout or private navigation', () => {
    const markup = renderToStaticMarkup(<SignInPage />);

    expect(markup).toContain('Sign In');
    expect(markup).toContain('Sign in form');
    expect(markup.match(/<main\b/g)).toHaveLength(1);
    // biome-ignore lint/nursery/noSecrets: Static accessibility label assertion, not a secret.
    expect(markup).not.toContain('aria-label="Dashboard navigation"');
    expect(markup).not.toContain('data-dashboard-sidebar-offset="compact"');
    expect(markup).not.toContain('href="/users"');
    expect(markup).not.toContain('href="/roles"');
    expect(markup).not.toContain('href="/audit-logs"');
  });

  it('renders setup without the authenticated dashboard layout or private navigation', () => {
    const markup = renderToStaticMarkup(<SignUpPage />);

    expect(markup).toContain('Setup');
    expect(markup).toContain('Setup form');
    expect(markup.match(/<main\b/g)).toHaveLength(1);
    // biome-ignore lint/nursery/noSecrets: Static accessibility label assertion, not a secret.
    expect(markup).not.toContain('aria-label="Dashboard navigation"');
    expect(markup).not.toContain('data-dashboard-sidebar-offset="compact"');
    expect(markup).not.toContain('href="/users"');
    expect(markup).not.toContain('href="/permissions"');
    expect(markup).not.toContain('href="/system/status"');
  });
});
