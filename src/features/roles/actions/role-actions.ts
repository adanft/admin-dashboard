'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdminApiError } from '@/server/api/client';
import {
  type CreateRolePayload,
  type RoleStatus,
  rolesApi,
  type UpdateRolePayload,
} from '@/server/api/roles';
import { getSession } from '@/server/auth/session';

type RoleActionField = keyof CreateRolePayload | 'status' | 'permissionIds';

export type RoleActionValues = Partial<CreateRolePayload & { status: RoleStatus }>;
export type RoleActionState = {
  status?: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Partial<Record<RoleActionField, string>>;
  values?: RoleActionValues;
};

const EXPIRED_SESSION_MESSAGE = 'Your session expired. Please sign in again.';
const ROLE_STATUSES = ['active', 'disabled'] as const;

export async function createRoleAction(
  _previousState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const validated = readCreateRolePayload(formData);

  if (!validated.success) {
    return validationError(validated.fieldErrors, validated.values);
  }

  const token = await readSessionToken();
  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE, values: validated.values };
  }

  let roleId: string;

  try {
    const role = await rolesApi.createRole(validated.payload, token);
    roleId = role.id;
  } catch (error) {
    return {
      status: 'error',
      message: getCreateRoleErrorMessage(error),
      values: validated.values,
    };
  }

  revalidatePath('/roles');
  redirect(`/roles/${roleId}`);
}

export async function updateRoleAction(
  _previousState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const id = readRequiredText(formData, 'id');
  const validated = readUpdateRolePayload(formData);

  if (!id) {
    return { status: 'error', message: 'Role profile is missing.' };
  }

  if (!validated.success) {
    return validationError(validated.fieldErrors, validated.values);
  }

  const token = await readSessionToken();
  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE, values: validated.values };
  }

  try {
    await rolesApi.updateRole(id, validated.payload, token);
  } catch (error) {
    return {
      status: 'error',
      message: getUpdateRoleErrorMessage(error),
      values: validated.values,
    };
  }

  revalidatePath('/roles');
  revalidatePath(`/roles/${id}`);
  redirect(`/roles/${id}`);
}

export async function deleteRoleAction(
  _previousState: RoleActionState,
  id: string,
): Promise<RoleActionState> {
  if (!id) {
    return { status: 'error', message: 'Role profile is missing.' };
  }

  const token = await readSessionToken();
  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE };
  }

  try {
    await rolesApi.deleteRole(id, token);
  } catch (error) {
    return { status: 'error', message: getDeleteRoleErrorMessage(error) };
  }

  revalidatePath('/roles');
  revalidatePath(`/roles/${id}`);
  redirect('/roles');
}

export async function updateRolePermissionsAction(
  _previousState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const roleId = readRequiredText(formData, 'roleId');
  // biome-ignore lint/nursery/noSecrets: These are public form field names, not secret values.
  const currentPermissionIds = readTextList(formData, 'currentPermissionIds');
  // biome-ignore lint/nursery/noSecrets: These are public form field names, not secret values.
  const selectedPermissionIds = readTextList(formData, 'permissionIds');

  if (!roleId) {
    return { status: 'error', message: 'Role profile is missing.' } as const;
  }

  const token = await readSessionToken();
  if (!token) {
    return { status: 'error', message: EXPIRED_SESSION_MESSAGE } as const;
  }

  let changedPermissions = false;

  try {
    const currentPermissionIdSet = new Set(currentPermissionIds);
    const selectedPermissionIdSet = new Set(selectedPermissionIds);
    const permissionIdsToAssign = selectedPermissionIds.filter(
      (permissionId) => !currentPermissionIdSet.has(permissionId),
    );
    const permissionIdsToRemove = currentPermissionIds.filter(
      (permissionId) => !selectedPermissionIdSet.has(permissionId),
    );

    if (permissionIdsToAssign.length > 0) {
      await rolesApi.assignPermissions(roleId, permissionIdsToAssign, token);
      changedPermissions = true;
    }

    if (permissionIdsToRemove.length > 0) {
      await rolesApi.removePermissions(roleId, permissionIdsToRemove, token);
      changedPermissions = true;
    }

    revalidatePath('/roles');
    revalidatePath(`/roles/${roleId}`);
    return { status: 'success', message: 'Role permissions updated.' } as const;
  } catch (error) {
    if (changedPermissions) {
      revalidatePath('/roles');
      revalidatePath(`/roles/${roleId}`);
      return {
        status: 'error',
        message:
          'Some permission changes may have been saved. Refresh to confirm current assignments.',
      } as const;
    }

    return { status: 'error', message: getPermissionMutationErrorMessage(error) } as const;
  }
}

function readCreateRolePayload(formData: FormData) {
  const values = readRoleActionValues(formData);
  const fieldErrors = validateRoleValues(values, 'create');

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, values } as const;
  }

  return {
    success: true,
    payload: {
      key: values.key ?? '',
      displayName: values.displayName ?? '',
      ...(values.description ? { description: values.description } : {}),
    },
    values,
  } as const;
}

function readUpdateRolePayload(formData: FormData) {
  const values = readRoleActionValues(formData);
  const fieldErrors = validateRoleValues(values, 'edit');

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, values } as const;
  }

  return {
    success: true,
    payload: {
      displayName: values.displayName ?? '',
      description: values.description ?? '',
      status: values.status ?? 'disabled',
    } satisfies UpdateRolePayload,
    values,
  } as const;
}

function readRoleActionValues(formData: FormData): RoleActionValues {
  const description = readOptionalText(formData, 'description');
  const status = parseRoleStatus(readOptionalText(formData, 'status'));

  return {
    key: readOptionalText(formData, 'key') ?? '',
    displayName: readOptionalText(formData, 'displayName') ?? '',
    ...(description ? { description } : {}),
    ...(status ? { status } : {}),
  };
}

function validateRoleValues(values: RoleActionValues, mode: 'create' | 'edit') {
  const fieldErrors: Partial<Record<RoleActionField, string>> = {};

  if (mode === 'create' && !values.key) {
    fieldErrors.key = 'Role key is required.';
  }

  if (!values.displayName) {
    fieldErrors.displayName = 'Display name is required.';
  }

  if (mode === 'edit' && !values.status) {
    fieldErrors.status = 'Choose a supported status.';
  }

  return fieldErrors;
}

function validationError(
  fieldErrors: Partial<Record<RoleActionField, string>>,
  values: RoleActionValues,
): RoleActionState {
  return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors, values };
}

async function readSessionToken() {
  const session = await getSession();
  return session?.accessToken || null;
}

function getCreateRoleErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to create this role right now.';
  }

  if (error.status === 400) {
    return 'Please fix the highlighted fields.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to create roles.';
  }

  if (error.status === 409) {
    return 'A role with those details already exists.';
  }

  return 'Unable to create this role right now.';
}

function getUpdateRoleErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update this role right now.';
  }

  if (error.status === 400) {
    return 'Please fix the highlighted fields.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to edit this role.';
  }

  if (error.status === 404) {
    return 'This role was not found.';
  }

  return 'Unable to update this role right now.';
}

function getDeleteRoleErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to delete this role right now.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to delete this role.';
  }

  if (error.status === 404) {
    return 'This role was not found.';
  }

  if (error.status === 409) {
    return 'This role cannot be deleted while it is still assigned.';
  }

  return 'Unable to delete this role right now.';
}

function getPermissionMutationErrorMessage(error: unknown) {
  if (!isAdminApiError(error)) {
    return 'Unable to update role permissions right now.';
  }

  if (error.status === 400) {
    return 'Choose at least one valid permission.';
  }

  if (error.status === 401) {
    return EXPIRED_SESSION_MESSAGE;
  }

  if (error.status === 403) {
    return 'You do not have permission to update role permissions.';
  }

  if (error.status === 404) {
    return 'This role or permission was not found.';
  }

  return 'Unable to update role permissions right now.';
}

function parseRoleStatus(value: string | null) {
  return ROLE_STATUSES.find((status) => status === value);
}

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() || null : null;
}

function readTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim());
}
