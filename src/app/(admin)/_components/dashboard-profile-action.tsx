'use client';

import Profile from '@adanft/ui/profile';
import { startTransition } from 'react';

import type { AdminSessionUser } from '@/lib/auth/session-cookie';
import { logoutAction } from '../_lib/logout-action';

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
