'use client';

import Profile from '@adanft/ui/profile';
import { type ComponentProps, type ComponentType, startTransition } from 'react';

import type { AdminSessionUser } from '@/lib/auth/session-cookie';
import { logoutAction } from '../_lib/logout-action';

type DashboardProfileActionProps = {
  user: AdminSessionUser;
};

type DashboardProfileProps = ComponentProps<typeof Profile> & {
  avatarSize?: 'sm';
};

const DashboardProfile = Profile as ComponentType<DashboardProfileProps>;

export default function DashboardProfileAction({ user }: DashboardProfileActionProps) {
  const displayName = `${user.name} ${user.lastName}`;
  const initials = getProfileInitials(displayName);

  return (
    <DashboardProfile
      actionLabel="Logout"
      {...(user.avatar
        ? {
            avatarAlt: `Avatar for ${displayName}`,
            avatarSrc: user.avatar,
            avatarType: 'image',
          }
        : { avatarText: initials, avatarType: 'text' })}
      name={displayName}
      onAction={() => startTransition(() => void logoutAction())}
      username={user.username}
      avatarSize="sm"
    />
  );
}

function getProfileInitials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
