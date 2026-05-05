import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardNavbarActions from './dashboard-navbar-actions';

const mocks = vi.hoisted(() => ({
  initialDark: vi.fn<(value: boolean) => void>(),
  profileUser: vi.fn<(value: unknown) => void>(),
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
  default: ({ user }: { user: unknown }) => {
    mocks.profileUser(user);

    return <span>Profile action</span>;
  },
}));

const session = {
  accessToken: 'access-token',
  expiresAt: 1_800_000_000_000,
  user: {
    avatar: 'https://cdn.example.com/ada.png',
    lastName: 'Lovelace',
    name: 'Ada',
    username: 'ada',
  },
};

describe('DashboardNavbarActions', () => {
  it('passes a dark initial theme to the client switch from the theme cookie', async () => {
    mocks.themeCookie.mockReturnValue('dark');

    const markup = renderToStaticMarkup(await DashboardNavbarActions({ session }));

    expect(markup).toContain('Theme switch');
    expect(markup).toContain('Profile action');
    expect(mocks.initialDark).toHaveBeenCalledWith(true);
    expect(mocks.profileUser).toHaveBeenCalledWith(session.user);
  });

  it('passes a light initial theme when the theme cookie is not dark', async () => {
    mocks.themeCookie.mockReturnValue('light');

    renderToStaticMarkup(await DashboardNavbarActions({ session }));

    expect(mocks.initialDark).toHaveBeenCalledWith(false);
  });
});
