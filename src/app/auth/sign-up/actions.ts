'use server';

import { redirect } from 'next/navigation';

import { authApi } from '@/lib/api/client';
import { getSignUpErrorMessage } from '@/lib/auth/error-mapping';
import { setSessionFromAuthData } from '@/lib/auth/session';
import type { AuthActionState, RegisterPayload } from '@/lib/auth/types';

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
    const data = await authApi.register(payload);
    const sessionWasSet = await setSessionFromAuthData(data);

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
