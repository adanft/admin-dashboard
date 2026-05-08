// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public component copy and fake IDs.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import RoleRowDeleteAction, { DeleteRoleConfirmationContent } from './role-row-delete-action';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    startTransition: vi.fn((callback: () => void) => callback()),
    useActionState: vi.fn((_action, initialState) => [initialState, vi.fn(), false]),
  };
});

vi.mock('../actions/role-actions', () => ({
  deleteRoleAction: vi.fn(),
}));

describe('RoleRowDeleteAction', () => {
  it('renders an icon-only trigger with an accessible name', () => {
    const markup = renderToStaticMarkup(
      <RoleRowDeleteAction roleId="role-3" roleLabel="Administrator" />,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-label="Delete Administrator"');
    expect(markup).toContain('rounded-full');
    expect(markup).toContain('text-danger');
  });

  it('renders confirmation dialog content with the assigned-role conflict surface', () => {
    const markup = renderToStaticMarkup(
      <DeleteRoleConfirmationContent
        closeLabel="Cancel deleting Administrator"
        initialActionState={{
          status: 'error',
          message: 'This role cannot be deleted while it is still assigned.',
        }}
        onClose={() => undefined}
        roleId="role-3"
        roleLabel="Administrator"
      />,
    );

    expect(markup).toContain('Delete Role');
    expect(markup).toContain(
      'Are you sure you want to delete &quot;Administrator&quot;? This action cannot be undone.',
    );
    expect(markup).toContain('This role cannot be deleted while it is still assigned.');
    expect(markup).not.toContain('<form');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('bg-danger');
    expect(markup).toContain('Delete role');
  });
});
