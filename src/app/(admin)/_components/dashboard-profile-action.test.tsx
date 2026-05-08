import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import DashboardProfileAction from './dashboard-profile-action';

vi.mock('@adanft/ui/profile', () => ({
  default: (props: {
    actionLabel: string;
    avatarAlt?: string;
    avatarText?: string;
    avatarType: 'image' | 'text';
    name: string;
    username: string;
  }) => (
    <div>
      <span>{props.actionLabel}</span>
      <span>{props.name}</span>
      <span>{props.username}</span>
      {props.avatarType === 'image' ? (
        <span>{props.avatarAlt}</span>
      ) : (
        <span>{props.avatarText}</span>
      )}
    </div>
  ),
}));

vi.mock('@/features/auth/actions/logout-action', () => ({
  logoutAction: vi.fn(),
}));

describe('DashboardProfileAction', () => {
  it('renders the session user display data in the profile action', () => {
    const markup = renderToStaticMarkup(
      <DashboardProfileAction
        user={{
          avatar: 'https://cdn.example.com/ada.png',
          lastName: 'Lovelace',
          name: 'Ada',
          username: 'ada',
        }}
      />,
    );

    expect(markup).toContain('Avatar for Ada Lovelace');
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('ada');
    expect(markup).toContain('Logout');
  });

  it('falls back to text initials when no avatar is available', () => {
    const markup = renderToStaticMarkup(
      <DashboardProfileAction user={{ lastName: 'Hopper', name: 'Grace', username: 'grace' }} />,
    );

    expect(markup).toContain('GH');
    expect(markup).toContain('Grace Hopper');
    expect(markup).toContain('grace');
  });

  it('uses only first and last name initials for text avatars', () => {
    const markup = renderToStaticMarkup(
      <DashboardProfileAction user={{ lastName: 'Lovelace', name: 'Ada', username: 'zz-top' }} />,
    );

    expect(markup).toContain('AL');
    expect(markup).not.toContain('AZ');
  });

  it('uses the first two given-name initials before falling back to last name', () => {
    const markup = renderToStaticMarkup(
      <DashboardProfileAction
        user={{ lastName: 'Franco Paz', name: 'Adan Elias', username: 'adan' }}
      />,
    );

    expect(markup).toContain('AE');
    expect(markup).not.toContain('AF');
  });
});
