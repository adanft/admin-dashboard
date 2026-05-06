// biome-ignore-all lint/nursery/noSecrets: Users UI tests assert public component copy and fake IDs.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import UserRowDeleteAction, { DeleteUserConfirmationContent } from './user-row-delete-action';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    startTransition: vi.fn((callback: () => void) => callback()),
    useActionState: vi.fn((_action, initialState) => [initialState, vi.fn(), false]),
  };
});

vi.mock('../_lib/user-actions', () => ({
  deleteUserAction: vi.fn(),
}));

describe('UserRowDeleteAction', () => {
  it('renders an icon-only trigger with an accessible name', () => {
    const markup = renderToStaticMarkup(
      <UserRowDeleteAction userId="user-3" userLabel="Ada Lovelace" />,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-label="Delete Ada Lovelace"');
    expect(markup).toContain('rounded-full');
    expect(markup).toContain('text-danger');
  });

  it('renders a text delete trigger for profile detail actions', () => {
    const markup = renderToStaticMarkup(
      <UserRowDeleteAction presentation="text" userId="user-3" userLabel="Ada Lovelace" />,
    );

    expect(markup).toContain('aria-label="Delete Ada Lovelace"');
    expect(markup).toContain('Delete</button>');
    expect(markup).toContain('rounded-full');
    expect(markup).toContain('border-danger');
    expect(markup).toContain('text-danger');
  });

  it('renders confirmation dialog content without a form before deleting', () => {
    const markup = renderToStaticMarkup(
      <DeleteUserConfirmationContent
        closeLabel="Cancel deleting Ada Lovelace"
        onClose={() => undefined}
        userId="user-3"
        userLabel="Ada Lovelace"
      />,
    );

    expect(markup).toContain('Delete User');
    expect(markup).toContain(
      'Are you sure you want to delete &quot;Ada Lovelace&quot;? This action cannot be undone.',
    );
    expect(markup).not.toContain('<form');
    expect(markup).not.toContain('name="id"');
    expect(markup).not.toContain('name="confirm"');
    expect(markup).not.toContain('Type DELETE to confirm');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('bg-danger');
    expect(markup).toContain('Delete user');
  });
});
