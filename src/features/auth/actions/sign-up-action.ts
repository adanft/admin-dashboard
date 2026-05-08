'use server';

import { redirect } from 'next/navigation';

import { getSignUpErrorMessage } from '@/features/auth/actions/error-mapping';
import { authApi } from '@/server/api/client';
import { persistRefreshCookie, setSessionFromAuthData } from '@/server/auth/session';
import type { AuthActionState, RegisterPayload } from '@/server/auth/types';

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const payload = readRegisterPayload(formData);

  if (!payload) {
    return { error: 'Please complete all required fields to create the initial admin account.' };
  }

  const result = await register(payload);

  if (!result.success) {
    return { error: result.error };
  }

  redirect(result.redirectTo);
}

async function register(payload: RegisterPayload) {
  try {
    const { data, refreshCookie } = await authApi.register(payload);
    const sessionWasSet = await setSessionFromAuthData(data);

    await persistRefreshCookie(refreshCookie);

    return { success: true, redirectTo: sessionWasSet ? '/' : '/auth/sign-in' } as const;
  } catch (error) {
    return { success: false, error: getSignUpErrorMessage(error) } as const;
  }
}

function readRegisterPayload(formData: FormData): RegisterPayload | null {
  const name = readRequiredText(formData, 'name');
  const lastName = readRequiredText(formData, 'lastName');
  const username = readRequiredText(formData, 'username');
  const email = readRequiredText(formData, 'email');
  const password = readRequiredText(formData, 'password');
  const avatar = readOptionalText(formData, 'avatar');

  if (!name || !lastName || !username || !email || !password) {
    return null;
  }

  return {
    name,
    lastName,
    username,
    email,
    password,
    ...(avatar ? { avatar } : {}),
  };
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
