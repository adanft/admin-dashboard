'use client';

import Profile from '@adanft/ui/profile';
import { startTransition } from 'react';

import { logoutAction } from '@/features/auth/actions/logout-action';
import type { AdminSessionUser } from '@/server/auth/session-cookie';

type DashboardProfileActionProps = {
  user: AdminSessionUser;
};

export default function DashboardProfileAction({ user }: DashboardProfileActionProps) {
  const displayName = `${user.name} ${user.lastName}`;
  const initials = getProfileInitials(displayName);

  return (
    <Profile
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
