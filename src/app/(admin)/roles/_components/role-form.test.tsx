// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public field names and fake values.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import RoleForm from './role-form';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/roles/action', false]),
  };
});

vi.mock('../_lib/role-actions', () => ({
  createRoleAction: vi.fn(),
  updateRoleAction: vi.fn(),
}));

describe('RoleForm', () => {
  it('renders a create form with labels and safe preserved values', () => {
    const markup = renderToStaticMarkup(
      <RoleForm
        mode="create"
        initialActionState={{
          status: 'error',
          message: 'Please fix the highlighted fields.',
          fieldErrors: { key: 'Role key is required.' },
          values: { displayName: 'Finance viewer', description: 'Read finance data' },
        }}
      />,
    );

    expect(markup).toContain('aria-describedby="role-form-error"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Please fix the highlighted fields.');
    expect(markup).toContain('for="key"');
    expect(markup).toContain('Role key');
    expect(markup).toContain('Role key is required.');
    expect(markup).toContain('name="displayName"');
    expect(markup).toContain('value="Finance viewer"');
    expect(markup).toContain('name="description"');
    expect(markup).not.toContain('name="status"');
    expect(markup).toContain('Create');
  });

  it('renders an edit form with immutable key and status selector', () => {
    const markup = renderToStaticMarkup(
      <RoleForm
        mode="edit"
        role={{
          id: 'role-2',
          key: 'operator',
          displayName: 'Operator',
          description: 'Runs workflows',
          status: 'disabled',
          isSystem: false,
          permissionCount: 0,
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        }}
      />,
    );

    expect(markup).toContain('name="id"');
    expect(markup).toContain('value="role-2"');
    expect(markup).toContain('name="key"');
    expect(markup).toContain('value="operator"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('name="status"');
    expect(markup).toMatch(/selected="">Disabled/);
    expect(markup).toContain('Update');
  });
});
