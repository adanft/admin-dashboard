import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import RootLayout from './layout';

const mocks = vi.hoisted(() => ({
  themeCookie: vi.fn<() => string | undefined>(() => undefined),
}));

vi.mock('next/font/google', () => ({
  Nunito: () => ({ variable: '--font-nunito' }),
  Sansita_Swashed: () => ({ variable: '--font-sansita-swashed' }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'theme' ? { value: mocks.themeCookie() } : undefined),
  }),
}));

describe('RootLayout', () => {
  it('renders the dark theme class from the theme cookie during SSR', async () => {
    mocks.themeCookie.mockReturnValue('dark');

    const markup = renderToStaticMarkup(await RootLayout({ children: <main>Dashboard</main> }));

    expect(markup).toContain('class="--font-nunito --font-sansita-swashed dark"');
  });

  it('omits the dark class when the theme cookie is not dark', async () => {
    mocks.themeCookie.mockReturnValue('light');

    const markup = renderToStaticMarkup(await RootLayout({ children: <main>Dashboard</main> }));

    expect(markup).toContain('class="--font-nunito --font-sansita-swashed"');
    expect(markup).not.toContain('--font-sansita-swashed dark');
  });
});
