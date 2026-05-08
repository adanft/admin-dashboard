'use server';

import { redirect } from 'next/navigation';

import { authApi, isAdminApiError } from '@/lib/api/client';
import {
  clearRefreshCookie,
  clearRequiredPasswordChangeSession,
  clearSession,
  persistRefreshCookie,
  setRequiredPasswordChangeSessionFromAuthData,
  setSessionFromAuthData,
} from '@/server/auth/session';
import type { AuthActionState, LoginPayload } from '@/server/auth/types';

const INVALID_SIGN_IN_MESSAGE = 'Invalid username or password.';

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const payload = readLoginPayload(formData);

  if (!payload) {
    return { error: INVALID_SIGN_IN_MESSAGE };
  }

  const result = await login(payload);

  if (!result.success) {
    return { error: result.error };
  }

  redirect(result.redirectTo);
}

async function login(payload: LoginPayload) {
  try {
    const { data, refreshCookie } = await authApi.login(payload);

    if (data.requiredAction === 'change_password') {
      await clearSession();
      await clearRefreshCookie();
      const passwordChangeSessionWasSet = await setRequiredPasswordChangeSessionFromAuthData(data);

      if (!passwordChangeSessionWasSet) {
        await clearRequiredPasswordChangeSession();
        return {
          success: false,
          error: 'We couldn’t start password change. Please try again.',
        } as const;
      }

      return { success: true, redirectTo: '/auth/change-password' } as const;
    }

    await clearRequiredPasswordChangeSession();

    const sessionWasSet = await setSessionFromAuthData(data);

    if (!sessionWasSet) {
      await clearSession();
      return {
        success: false,
        error: 'We couldn’t sign you in. Please try again.',
      } as const;
    }

    await persistRefreshCookie(refreshCookie);

    return { success: true, redirectTo: '/' } as const;
  } catch (error) {
    await clearSession();
    await clearRequiredPasswordChangeSession();

    if (isAdminApiError(error) && [400, 401].includes(error.status)) {
      return { success: false, error: INVALID_SIGN_IN_MESSAGE } as const;
    }

    return {
      success: false,
      error: 'Sign in is temporarily unavailable. Please try again.',
    } as const;
  }
}

function readLoginPayload(formData: FormData): LoginPayload | null {
  const identity = readRequiredText(formData, 'identity');
  const password = readRequiredText(formData, 'password');

  if (!identity || !password) {
    return null;
  }

  return { identity, password };
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
