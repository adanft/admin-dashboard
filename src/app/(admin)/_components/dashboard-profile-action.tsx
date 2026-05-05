'use client';

import Profile from '@adanft/ui/profile';
import { useRouter } from 'next/navigation';

export default function DashboardProfileAction() {
  const router = useRouter();

  return (
    <Profile
      actionLabel="My Account"
      avatarText="AD"
      avatarType="text"
      name="Admin dashboard"
      onAction={() => router.push('/account')}
      username="admin"
    />
  );
}
