'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdminApiError } from '@/lib/api/client';
import { type CreateUserPayload, type UserProfilePayload, usersApi } from '@/lib/api/users';
import { getSession } from '@/lib/auth/session';

type UserActionField = keyof CreateUserPayload;

export type UserActionValues = Partial<UserProfilePayload>;

export type UserActionState = {
  status?: 'idle' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<UserActionField, string>>;
  values?: UserActionValues;
};

type ValidatedPayload<TPayload> =
  | { success: true; payload: TPayload; values: UserActionValues }
  | {
      success: false;
      fieldErrors: Partial<Record<UserActionField, string>>;
      values: UserActionValues;
    };

const EXPIRED_SESSION_MESSAGE = 'Your session expired. Please sign in again.';

export async function createUserAction(
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const validated = readCreateUserPayload(formData);

  if (!validated.success) {
    return validationError(validated.fieldErrors, validated.values);
  }

  const result = await createUser(validated.payload, validated.values);

  if (!result.success) {
    return result.state;
  }

  revalidatePath('/users');
  redirect(`/users/${result.id}`);
}

export async function updateUserAction(
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const id = readRequiredText(formData, 'id');
  const validated = readUserProfilePayload(formData);

  if (!id) {
    return { status: 'error', message: 'User profile is missing.' };
  }

  if (!validated.success) {
    return validationError(validated.fieldErrors, validated.values);
  }

  const result = await updateUser(id, validated.payload, validated.values);

  if (!result.success) {
    return result.state;
  }

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  redirect(`/users/${id}`);
}

export async function deleteUserAction(
  _previousState: UserActionState,
  id: string,
): Promise<UserActionState> {
  if (!id) {
    return { status: 'error', message: 'User profile is missing.' };
  }

  const result = await deleteUser(id);

  if (!result.success) {
    return result.state;
  }

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  redirect('/users');
}

async function createUser(payload: CreateUserPayload, values: UserActionValues) {
  const token = await readSessionToken();

  if (!token) {
    return {
      success: false,
      state: { status: 'error', message: EXPIRED_SESSION_MESSAGE, values },
    } as const;
  }

  try {
    const profile = await usersApi.createUser(payload, token);
    return { success: true, id: profile.id } as const;
  } catch (error) {
    return {
      success: false,
      state: { status: 'error', message: getCreateUserErrorMessage(error), values },
    } as const;
  }
}

async function updateUser(id: string, payload: UserProfilePayload, values: UserActionValues) {
  const token = await readSessionToken();

  if (!token) {
    return {
      success: false,
      state: { status: 'error', message: EXPIRED_SESSION_MESSAGE, values },
    } as const;
  }

  try {
    await usersApi.updateUser(id, payload, token);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      state: { status: 'error', message: getUpdateUserErrorMessage(error), values },
    } as const;
  }
}

async function deleteUser(id: string) {
  const token = await readSessionToken();

  if (!token) {
    return {
      success: false,
      state: { status: 'error', message: EXPIRED_SESSION_MESSAGE },
    } as const;
  }

  try {
    await usersApi.deleteUser(id, token);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      state: { status: 'error', message: getDeleteUserErrorMessage(error) },
    } as const;
  }
}

async function readSessionToken() {
  const session = await getSession();
  return session?.accessToken || null;
}

function readCreateUserPayload(formData: FormData): ValidatedPayload<CreateUserPayload> {
  const profile = readUserProfilePayload(formData);
  // biome-ignore lint/nursery/noSecrets: This is a public form field name, not a secret value.
  const temporaryPassword = readRequiredText(formData, 'temporaryPassword');

  if (profile.success && temporaryPassword) {
    return {
      success: true,
      payload: { ...profile.payload, temporaryPassword },
      values: profile.values,
    };
  }

  return {
    success: false,
    fieldErrors: {
      ...(profile.success ? {} : profile.fieldErrors),
      ...(temporaryPassword ? {} : { temporaryPassword: 'Temporary password is required.' }),
    },
    values: profile.values,
  };
}

function readUserProfilePayload(formData: FormData): ValidatedPayload<UserProfilePayload> {
  const values = readUserActionValues(formData);
  const fieldErrors = validateUserProfileValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, values };
  }

  return {
    success: true,
    payload: {
      name: values.name ?? '',
      lastName: values.lastName ?? '',
      username: values.username ?? '',
      email: values.email ?? '',
      ...(values.avatar ? { avatar: values.avatar } : {}),
    },
    values,
  };
}

function readUserActionValues(formData: FormData): UserActionValues {
  const avatar = readOptionalText(formData, 'avatar');

  return {
    name: readOptionalText(formData, 'name') ?? '',
    lastName: readOptionalText(formData, 'lastName') ?? '',
    username: readOptionalText(formData, 'username') ?? '',
    email: readOptionalText(formData, 'email') ?? '',
    ...(avatar ? { avatar } : {}),
  };
}

function validateUserProfileValues(values: UserActionValues) {
  const fieldErrors: Partial<Record<UserActionField, string>> = {};

  if (!values.name) {
    fieldErrors.name = 'First name is required.';
  }

  if (!values.lastName) {
    fieldErrors.lastName = 'Last name is required.';
  }

  if (!values.username) {
    fieldErrors.username = 'Username is required.';
  }

  if (!values.email) {
    fieldErrors.email = 'Email is required.';
  } else if (!values.email.includes('@')) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  return fieldErrors;
}

function validationError(
  fieldErrors: Partial<Record<UserActionField, string>>,
  values: UserActionValues,
): UserActionState {
  return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors, values };
}

function getCreateUserErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to create this user right now.';
  }

  if (error.status === 400) {
    return 'Please fix the highlighted fields.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to create users.';
  }

  if (error.status === 409) {
    return 'A user with those details already exists.';
  }

  return 'Unable to create this user right now.';
}

function getUpdateUserErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update this user right now.';
  }

  if (error.status === 400) {
    return 'Please fix the highlighted fields.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to edit this user.';
  }

  if (error.status === 404) {
    return 'This user was not found.';
  }

  if (error.status === 409) {
    return 'A user with those details already exists.';
  }

  return 'Unable to update this user right now.';
}

function getDeleteUserErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to delete this user right now.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to delete this user.';
  }

  if (error.status === 404) {
    return 'This user was not found.';
  }

  if (error.status === 409) {
    return 'This user cannot be deleted right now.';
  }

  return 'Unable to delete this user right now.';
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() || null : null;
}
