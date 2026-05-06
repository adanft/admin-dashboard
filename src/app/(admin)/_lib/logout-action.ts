'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authApi } from '@/lib/api/client';
import { clearSession } from '@/lib/auth/session';

export async function logoutAction() {
  const refreshToken = (await cookies()).get('refresh_token')?.value;

  try {
    await authApi.logout({ refreshToken });
  } catch {
    // Local logout must still complete when the backend session is already gone or unreachable.
  } finally {
    await clearSession();
  }

  redirect('/auth/sign-in');
}
