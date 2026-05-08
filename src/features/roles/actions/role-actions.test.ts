import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRoleAction,
  deleteRoleAction,
  updateRoleAction,
  updateRolePermissionsAction,
} from './role-actions';

const mocks = vi.hoisted(() => {
  class MockAdminApiError extends Error {
    readonly status: number;

    constructor(status: number, message = 'api error') {
      super(message);
      this.status = status;
    }
  }

  return {
    getSession: vi.fn(),
    MockAdminApiError,
    redirect: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    revalidatePath: vi.fn(),
    rolesApi: {
      assignPermissions: vi.fn(),
      createRole: vi.fn(),
      deleteRole: vi.fn(),
      removePermissions: vi.fn(),
      updateRole: vi.fn(),
    },
  };
});

vi.mock('@/server/api/client', () => ({
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/server/api/roles', () => ({
  rolesApi: mocks.rolesApi,
}));

vi.mock('@/server/auth/session', () => ({
  getSession: mocks.getSession,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('roles Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ accessToken: 'access-token' });
  });

  it('creates a role, revalidates roles, and redirects to the detail page', async () => {
    mocks.rolesApi.createRole.mockResolvedValue({ id: 'role-1' });

    await expect(createRoleAction({ status: 'idle' }, createRoleFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/roles/role-1',
    );

    expect(mocks.rolesApi.createRole).toHaveBeenCalledWith(
      { key: 'finance.viewer', displayName: 'Finance viewer', description: 'Read finance data' },
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles');
  });

  it('returns field errors and safe values for invalid create FormData', async () => {
    await expect(
      createRoleAction({ status: 'idle' }, createRoleFormData({ key: '', displayName: '' })),
    ).resolves.toEqual({
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors: {
        key: 'Role key is required.',
        displayName: 'Display name is required.',
      },
      values: { key: '', displayName: '', description: 'Read finance data' },
    });
    expect(mocks.rolesApi.createRole).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'Please fix the highlighted fields.'],
    [401, 'Your session expired. Please sign in again.'],
    [403, 'You do not have permission to create roles.'],
    [409, 'A role with those details already exists.'],
  ] as const)('maps create API status %i distinctly', async (status, message) => {
    mocks.rolesApi.createRole.mockRejectedValue(new mocks.MockAdminApiError(status));

    await expect(createRoleAction({ status: 'idle' }, createRoleFormData())).resolves.toEqual({
      status: 'error',
      message,
      values: {
        key: 'finance.viewer',
        displayName: 'Finance viewer',
        description: 'Read finance data',
      },
    });
  });

  it('updates roles with displayName, description, and status through PATCH payload', async () => {
    mocks.rolesApi.updateRole.mockResolvedValue({ id: 'role-2' });

    await expect(updateRoleAction({ status: 'idle' }, updateRoleFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/roles/role-2',
    );

    expect(mocks.rolesApi.updateRole).toHaveBeenCalledWith(
      'role-2',
      { displayName: 'Operator', description: '', status: 'disabled' },
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles/role-2');
  });

  it('requires a valid status when updating roles', async () => {
    await expect(
      updateRoleAction({ status: 'idle' }, updateRoleFormData({ status: 'archived' })),
    ).resolves.toEqual({
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors: { status: 'Choose a supported status.' },
      values: { key: '', displayName: 'Operator' },
    });
  });

  it('maps assigned-role delete conflicts to a specific message', async () => {
    mocks.rolesApi.deleteRole.mockRejectedValue(new mocks.MockAdminApiError(409));

    await expect(deleteRoleAction({ status: 'idle' }, 'role-3')).resolves.toEqual({
      status: 'error',
      message: 'This role cannot be deleted while it is still assigned.',
    });
  });

  it('deletes roles, revalidates list/detail, and redirects to the list', async () => {
    mocks.rolesApi.deleteRole.mockResolvedValue(undefined);

    await expect(deleteRoleAction({ status: 'idle' }, 'role-3')).rejects.toThrow(
      'NEXT_REDIRECT:/roles',
    );

    expect(mocks.rolesApi.deleteRole).toHaveBeenCalledWith('role-3', 'access-token');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles/role-3');
  });

  it('syncs role permissions without redirecting away from detail', async () => {
    mocks.rolesApi.assignPermissions.mockResolvedValue(undefined);
    mocks.rolesApi.removePermissions.mockResolvedValue(undefined);

    await expect(
      updateRolePermissionsAction({ status: 'idle' }, permissionFormData()),
    ).resolves.toEqual({ status: 'success', message: 'Role permissions updated.' });

    expect(mocks.rolesApi.assignPermissions).toHaveBeenCalledWith(
      'role-1',
      ['permission-3'],
      'access-token',
    );
    expect(mocks.rolesApi.removePermissions).toHaveBeenCalledWith(
      'role-1',
      ['permission-1'],
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles/role-1');
  });

  it('reports uncertainty and revalidates when role permission sync partially succeeds', async () => {
    mocks.rolesApi.assignPermissions.mockResolvedValue(undefined);
    mocks.rolesApi.removePermissions.mockRejectedValue(new mocks.MockAdminApiError(500));

    await expect(
      updateRolePermissionsAction({ status: 'idle' }, permissionFormData()),
    ).resolves.toEqual({
      status: 'error',
      message:
        'Some permission changes may have been saved. Refresh to confirm current assignments.',
    });

    expect(mocks.rolesApi.assignPermissions).toHaveBeenCalledWith(
      'role-1',
      ['permission-3'],
      'access-token',
    );
    expect(mocks.rolesApi.removePermissions).toHaveBeenCalledWith(
      'role-1',
      ['permission-1'],
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/roles/role-1');
  });
});

function createRoleFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    key: 'finance.viewer',
    displayName: 'Finance viewer',
    description: 'Read finance data',
    ...overrides,
  });
}

function updateRoleFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    id: 'role-2',
    displayName: 'Operator',
    description: '',
    status: 'disabled',
    ...overrides,
  });
}

function permissionFormData() {
  const formData = new FormData();
  formData.set('roleId', 'role-1');
  formData.append('currentPermissionIds', 'permission-1');
  formData.append('currentPermissionIds', 'permission-2');
  formData.append('permissionIds', 'permission-2');
  formData.append('permissionIds', 'permission-3');
  return formData;
}

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
