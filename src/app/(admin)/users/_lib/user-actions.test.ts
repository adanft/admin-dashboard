import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createUserAction, deleteUserAction, updateUserAction } from './user-actions';

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
    usersApi: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUser: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/client', () => ({
  isAdminApiError: (error: unknown) => error instanceof mocks.MockAdminApiError,
}));

vi.mock('@/lib/api/users', () => ({
  usersApi: mocks.usersApi,
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

describe('users Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ accessToken: 'access-token' });
  });

  it('creates a user with temporaryPassword, revalidates users, and redirects without echoing it', async () => {
    mocks.usersApi.createUser.mockResolvedValue({ id: 'user-1' });

    await expect(createUserAction({ status: 'idle' }, createCreateUserFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/users/user-1',
    );

    expect(mocks.usersApi.createUser).toHaveBeenCalledWith(
      {
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        avatar: 'https://cdn.example.com/ada.png',
        temporaryPassword: 'temporary-secret',
      },
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/users');
    expect(mocks.redirect).toHaveBeenCalledWith('/users/user-1');
  });

  it('returns field errors and safe values for invalid create FormData', async () => {
    const formData = createCreateUserFormData({ email: 'not-an-email', temporaryPassword: '' });

    await expect(createUserAction({ status: 'idle' }, formData)).resolves.toEqual({
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors: {
        email: 'Enter a valid email address.',
        temporaryPassword: 'Temporary password is required.',
      },
      values: {
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'not-an-email',
        avatar: 'https://cdn.example.com/ada.png',
      },
    });
    expect(mocks.usersApi.createUser).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'Please fix the highlighted fields.'],
    [401, 'Your session expired. Please sign in again.'],
    [403, 'You do not have permission to create users.'],
    [409, 'A user with those details already exists.'],
  ] as const)(
    'maps create API status %i to a user-friendly action error',
    async (status, message) => {
      mocks.usersApi.createUser.mockRejectedValue(
        new mocks.MockAdminApiError(status, 'backend detail'),
      );

      await expect(
        createUserAction({ status: 'idle' }, createCreateUserFormData()),
      ).resolves.toEqual({
        status: 'error',
        message,
        values: {
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          avatar: 'https://cdn.example.com/ada.png',
        },
      });
    },
  );

  it('updates profile details only and redirects back to the profile', async () => {
    mocks.usersApi.updateUser.mockResolvedValue({ id: 'user-2' });

    await expect(updateUserAction({ status: 'idle' }, createUpdateUserFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/users/user-2',
    );

    expect(mocks.usersApi.updateUser).toHaveBeenCalledWith(
      'user-2',
      {
        name: 'Grace',
        lastName: 'Hopper',
        username: 'grace',
        email: 'grace@example.com',
      },
      'access-token',
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/users');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/users/user-2');
  });

  it.each([
    [400, 'Please fix the highlighted fields.'],
    [401, 'Your session expired. Please sign in again.'],
    [403, 'You do not have permission to edit this user.'],
    [404, 'This user was not found.'],
    [409, 'A user with those details already exists.'],
  ] as const)('maps update API status %i distinctly', async (status, message) => {
    mocks.usersApi.updateUser.mockRejectedValue(
      new mocks.MockAdminApiError(status, 'backend detail'),
    );

    await expect(updateUserAction({ status: 'idle' }, createUpdateUserFormData())).resolves.toEqual(
      {
        status: 'error',
        message,
        values: {
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
        },
      },
    );
  });

  it('requires a session token before updating or deleting users', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(updateUserAction({ status: 'idle' }, createUpdateUserFormData())).resolves.toEqual(
      {
        status: 'error',
        message: 'Your session expired. Please sign in again.',
        values: {
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
        },
      },
    );
    await expect(deleteUserAction({ status: 'idle' }, 'user-3')).resolves.toEqual({
      status: 'error',
      message: 'Your session expired. Please sign in again.',
    });
  });

  it.each([
    [401, 'Your session expired. Please sign in again.'],
    [403, 'You do not have permission to delete this user.'],
    [404, 'This user was not found.'],
    [409, 'This user cannot be deleted right now.'],
  ] as const)('maps delete API status %i distinctly', async (status, message) => {
    mocks.usersApi.deleteUser.mockRejectedValue(
      new mocks.MockAdminApiError(status, 'backend detail'),
    );

    await expect(deleteUserAction({ status: 'idle' }, 'user-3')).resolves.toEqual({
      status: 'error',
      message,
    });
  });

  it('deletes confirmed users, revalidates list/detail, and redirects to the list', async () => {
    mocks.usersApi.deleteUser.mockResolvedValue(undefined);

    await expect(deleteUserAction({ status: 'idle' }, 'user-3')).rejects.toThrow(
      'NEXT_REDIRECT:/users',
    );

    expect(mocks.usersApi.deleteUser).toHaveBeenCalledWith('user-3', 'access-token');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/users');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/users/user-3');
  });
});

function createCreateUserFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    name: 'Ada',
    lastName: 'Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    avatar: 'https://cdn.example.com/ada.png',
    temporaryPassword: 'temporary-secret',
    ...overrides,
  });
}

function createUpdateUserFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    id: 'user-2',
    name: 'Grace',
    lastName: 'Hopper',
    username: 'grace',
    email: 'grace@example.com',
    ...overrides,
  });
}

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
