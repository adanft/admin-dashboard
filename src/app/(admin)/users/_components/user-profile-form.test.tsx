// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public field names and fake profile values.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import UserProfileForm from './user-profile-form';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/users/action', false]),
  };
});

vi.mock('../_lib/user-actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
}));

describe('UserProfileForm', () => {
  it('renders a create form with labels, temporary password, and safe preserved values', () => {
    const markup = renderToStaticMarkup(
      <UserProfileForm
        mode="create"
        initialActionState={{
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
        }}
      />,
    );

    expect(markup).toContain('aria-describedby="user-profile-form-error"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Please fix the highlighted fields.');
    expect(markup).toContain('for="name"');
    expect(markup).toContain('First name');
    expect(markup).toContain('name="temporaryPassword"');
    expect(markup).toContain('Temporary password');
    expect(markup).toContain('Temporary password is required.');
    expect(markup).toContain('value="not-an-email"');
    expect(markup).not.toContain('temporary-secret');
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('Create');
  });

  it('renders an edit form for profile fields only with the user id hidden', () => {
    const markup = renderToStaticMarkup(
      <UserProfileForm
        mode="edit"
        user={{
          id: 'user-2',
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
          status: 'active',
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        }}
      />,
    );

    expect(markup).toContain('name="id"');
    expect(markup).toContain('value="user-2"');
    expect(markup).toContain('value="Grace"');
    expect(markup).toContain('Update');
    expect(markup).not.toContain('temporaryPassword');
    expect(markup).not.toContain('Role');
    expect(markup).not.toContain('Status');
    expect(markup).not.toContain('Revoke sessions');
  });
});
