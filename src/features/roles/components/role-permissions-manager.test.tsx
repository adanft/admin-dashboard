// biome-ignore-all lint/nursery/noSecrets: Roles UI tests assert public component copy and fake IDs.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { PermissionSummary } from '@/server/api/permissions';
import RolePermissionsManager from './role-permissions-manager';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn((_action, initialState) => [initialState, '/roles/permission', false]),
  };
});

vi.mock('../actions/role-actions', () => ({
  updateRolePermissionsAction: vi.fn(),
}));

describe('RolePermissionsManager', () => {
  it('renders grouped active permissions as checkboxes and assigned permission summaries', () => {
    const markup = renderToStaticMarkup(
      <RolePermissionsManager
        assignedPermissions={[
          permission('perm-2', 'roles.write', 'Write roles', 'Large write description'),
          permission('perm-1', 'roles.read', 'Read roles', 'Large read description'),
        ]}
        availablePermissions={[
          permission('perm-1', 'roles.read', 'Read roles'),
          permission('perm-3', 'roles.delete', 'Delete roles'),
          permission('perm-2', 'roles.write', 'Write roles'),
          permission('perm-4', 'users.read', 'Read users', undefined, 'Users'),
          {
            ...permission('perm-3', 'roles.disabled', 'Disabled permission'),
            status: 'disabled',
          },
        ]}
        roleId="role-1"
      />,
    );

    expect(markup).toContain('name="roleId"');
    expect(markup).toContain('value="role-1"');
    expect(markup).toContain('Save changes');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('name="permissionIds"');
    expect(markup).toContain('name="currentPermissionIds"');
    expect(markup).toContain('Write roles');
    expect(markup).toContain('Users');
    expect(markup).toContain('roles.write');
    expect(markup.indexOf('Delete roles')).toBeLessThan(markup.indexOf('Read roles'));
    expect(markup).not.toContain('Disabled permission (roles.disabled)');
    expect(markup.indexOf('Read roles')).toBeLessThan(markup.indexOf('Write roles'));
    expect(markup).toContain('Read roles');
    expect(markup).not.toContain('Large read description');
    expect(markup).not.toContain('Large write description');
    expect(markup).not.toContain('Remove');
  });

  it('renders permissions load warnings and empty assignment state', () => {
    const markup = renderToStaticMarkup(
      <RolePermissionsManager
        assignedPermissions={[]}
        availablePermissions={[]}
        permissionsError="Unable to load role permissions right now."
        roleId="role-1"
      />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Unable to load role permissions right now.');
    expect(markup).toContain('Permissions could not be loaded.');
    expect(markup).not.toContain('Save changes');
  });
});

function permission(
  id: string,
  key: string,
  displayName: string,
  description?: string,
  category = 'Roles',
): PermissionSummary {
  return {
    id,
    key,
    displayName,
    ...(description ? { description } : {}),
    category,
    status: 'active',
    sortOrder: 0,
  };
}
