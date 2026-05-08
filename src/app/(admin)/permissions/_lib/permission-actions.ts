'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdminApiError } from '@/lib/api/client';
import { permissionsApi, type UpdatePermissionPayload } from '@/lib/api/permissions';
import { getSession } from '@/server/auth/session';

type PermissionActionField = keyof UpdatePermissionPayload;

export type PermissionActionValues = Partial<{
  displayName: string;
  description: string;
  category: string;
  sortOrder: string;
}>;

export type PermissionActionState = {
  status?: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Partial<Record<PermissionActionField, string>>;
  values?: PermissionActionValues;
};

const EXPIRED_SESSION_MESSAGE = 'Your session expired. Please sign in again.';

export async function updatePermissionAction(
  _previousState: PermissionActionState,
  formData: FormData,
): Promise<PermissionActionState> {
  const id = readRequiredText(formData, 'id');
  const validated = readUpdatePermissionPayload(formData);

  if (!id) {
    return { status: 'error', message: 'Permission profile is missing.' };
  }

  if (!validated.success) {
    return validationError(validated.fieldErrors, validated.values);
  }

  const token = await readSessionToken();
  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE, values: validated.values };
  }

  try {
    await permissionsApi.updatePermission(id, validated.payload, token);
  } catch (error) {
    return {
      status: 'error',
      message: getUpdatePermissionErrorMessage(error),
      values: validated.values,
    };
  }

  revalidatePath('/permissions');
  revalidatePath(`/permissions/${id}`);
  redirect(`/permissions/${id}`);
}

function readUpdatePermissionPayload(formData: FormData) {
  const values = readPermissionActionValues(formData);
  const fieldErrors = validatePermissionValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, values } as const;
  }

  return {
    success: true,
    payload: {
      displayName: values.displayName ?? '',
      description: values.description ?? '',
      category: values.category ?? '',
      sortOrder: Number(values.sortOrder),
    } satisfies UpdatePermissionPayload,
    values,
  } as const;
}

function readPermissionActionValues(formData: FormData): PermissionActionValues {
  return {
    displayName: readOptionalText(formData, 'displayName') ?? '',
    description: readOptionalText(formData, 'description') ?? '',
    category: readOptionalText(formData, 'category') ?? '',
    sortOrder: readOptionalText(formData, 'sortOrder') ?? '',
  };
}

function validatePermissionValues(values: PermissionActionValues) {
  const fieldErrors: Partial<Record<PermissionActionField, string>> = {};
  const sortOrder = Number(values.sortOrder);

  if (!values.displayName) {
    fieldErrors.displayName = 'Display name is required.';
  }

  if (!values.category) {
    fieldErrors.category = 'Category is required.';
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    fieldErrors.sortOrder = 'Sort order must be a whole number greater than or equal to 0.';
  }

  return fieldErrors;
}

function validationError(
  fieldErrors: Partial<Record<PermissionActionField, string>>,
  values: PermissionActionValues,
): PermissionActionState {
  return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors, values };
}

async function readSessionToken() {
  const session = await getSession();
  return session?.accessToken || null;
}

function getUpdatePermissionErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update this permission right now.';
  }

  if (error.status === 400) {
    return 'Please fix the highlighted fields.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to edit permissions.';
  }

  if (error.status === 404) {
    return 'This permission was not found.';
  }

  return 'Unable to update this permission right now.';
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() || null : null;
}
