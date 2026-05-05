import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardNavbarActions from './dashboard-navbar-actions';

const mocks = vi.hoisted(() => ({
  initialDark: vi.fn<(value: boolean) => void>(),
  themeCookie: vi.fn<() => string | undefined>(() => undefined),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'theme' ? { value: mocks.themeCookie() } : undefined),
  }),
}));

vi.mock('./dashboard-theme-switch', () => ({
  default: ({ initialDark }: { initialDark: boolean }) => {
    mocks.initialDark(initialDark);

    return <span>Theme switch</span>;
  },
}));

vi.mock('./dashboard-profile-action', () => ({
  default: () => <span>Profile action</span>,
}));

describe('DashboardNavbarActions', () => {
  it('passes a dark initial theme to the client switch from the theme cookie', async () => {
    mocks.themeCookie.mockReturnValue('dark');

    const markup = renderToStaticMarkup(await DashboardNavbarActions());

    expect(markup).toContain('Theme switch');
    expect(markup).toContain('Profile action');
    expect(mocks.initialDark).toHaveBeenCalledWith(true);
  });

  it('passes a light initial theme when the theme cookie is not dark', async () => {
    mocks.themeCookie.mockReturnValue('light');

    renderToStaticMarkup(await DashboardNavbarActions());

    expect(mocks.initialDark).toHaveBeenCalledWith(false);
  });
});
