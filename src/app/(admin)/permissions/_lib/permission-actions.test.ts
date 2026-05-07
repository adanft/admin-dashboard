import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updatePermissionAction } from './permission-actions';

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
    permissionsApi: {
      updatePermission: vi.fn(),
    },
    redirect: vi.fn((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    revalidatePath: vi.fn(),
  };
});

vi.mock('@/lib/api/client', () => ({
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/lib/api/permissions', () => ({
  permissionsApi: mocks.permissionsApi,
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: mocks.getSession,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('permissions Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ accessToken: 'access-token' });
  });

  it('updates permission metadata through PATCH payload and redirects to detail', async () => {
    mocks.permissionsApi.updatePermission.mockResolvedValue({ id: 'perm-1' });

    await expect(updatePermissionAction({ status: 'idle' }, permissionFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/permissions/perm-1',
    );

    expect(mocks.permissionsApi.updatePermission).toHaveBeenCalledWith(
      'perm-1',
      {
        displayName: 'Read permissions',
        description: '',
        category: 'Permissions',
        sortOrder: 10,
      },
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/permissions');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/permissions/perm-1');
  });

  it('returns field errors and safe values for invalid metadata FormData', async () => {
    await expect(
      updatePermissionAction(
        { status: 'idle' },
        permissionFormData({ displayName: '', category: '', sortOrder: '-1' }),
      ),
    ).resolves.toEqual({
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors: {
        displayName: 'Display name is required.',
        category: 'Category is required.',
        sortOrder: 'Sort order must be a whole number greater than or equal to 0.',
      },
      values: { displayName: '', description: '', category: '', sortOrder: '-1' },
    });
    expect(mocks.permissionsApi.updatePermission).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'Please fix the highlighted fields.'],
    [401, 'Your session expired. Please sign in again.'],
    [403, 'You do not have permission to edit permissions.'],
    [404, 'This permission was not found.'],
  ] as const)('maps update API status %i distinctly', async (status, message) => {
    mocks.permissionsApi.updatePermission.mockRejectedValue(new mocks.MockAdminApiError(status));

    await expect(updatePermissionAction({ status: 'idle' }, permissionFormData())).resolves.toEqual(
      {
        status: 'error',
        message,
        values: {
          displayName: 'Read permissions',
          description: '',
          category: 'Permissions',
          sortOrder: '10',
        },
      },
    );
  });
});

function permissionFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    id: 'perm-1',
    displayName: 'Read permissions',
    description: '',
    category: 'Permissions',
    sortOrder: '10',
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
