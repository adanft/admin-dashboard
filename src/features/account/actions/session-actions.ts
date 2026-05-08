'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { accountApi } from '@/server/api/account';
import { clearRefreshCookie, clearSession, getSession } from '@/server/auth/session';

export type RevokeSessionActionState = {
  status?: 'error';
  message?: string;
};

export async function revokeSessionAction(
  _previousState: RevokeSessionActionState,
  formData: FormData,
): Promise<RevokeSessionActionState> {
  const sessionId = readRequiredText(formData, 'sessionId');

  if (!sessionId) {
    return {};
  }

  const session = await getSession();

  if (!session?.accessToken) {
    await clearSession();
    await clearRefreshCookie();
    redirect('/auth/sign-in');
  }

  const refreshToken = (await cookies()).get('refresh_token')?.value;

  try {
    await accountApi.revokeSession(sessionId, session.accessToken, refreshToken);
  } catch {
    return {
      status: 'error',
      message: 'Unable to revoke this session right now. Try again later.',
    };
  }

  revalidatePath('/account/sessions');

  if (readRequiredText(formData, 'isCurrent') === 'true') {
    await clearSession();
    await clearRefreshCookie();
    redirect('/auth/sign-in');
  }

  return {};
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
