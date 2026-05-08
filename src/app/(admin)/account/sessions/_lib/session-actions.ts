'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { authApi } from '@/lib/api/auth';
import { clearRefreshCookie, clearSession, getSession } from '@/lib/auth/session';

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const sessionId = readRequiredText(formData, 'sessionId');

  if (!sessionId) {
    return;
  }

  const session = await getSession();

  if (!session?.accessToken) {
    await clearSession();
    await clearRefreshCookie();
    redirect('/auth/sign-in');
  }

  const refreshToken = (await cookies()).get('refresh_token')?.value;

  try {
    await authApi.revokeSession(sessionId, session.accessToken, refreshToken);
  } catch {
    return;
  }

  revalidatePath('/account/sessions');

  if (readRequiredText(formData, 'isCurrent') === 'true') {
    await clearSession();
    await clearRefreshCookie();
    redirect('/auth/sign-in');
  }

  return;
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
