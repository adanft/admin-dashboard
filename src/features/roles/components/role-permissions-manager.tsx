'use client';

import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Checkbox from '@adanft/ui/checkbox';
import Field from '@adanft/ui/field';
import Label from '@adanft/ui/label';
import Link from 'next/link';
import { useActionState } from 'react';

import type { PermissionSummary } from '@/lib/api/permissions';
import { type RoleActionState, updateRolePermissionsAction } from '../actions/role-actions';

type RolePermissionsManagerProps = {
  assignedPermissions: PermissionSummary[];
  availablePermissions: PermissionSummary[];
  permissionsError?: string;
  roleId: string;
};

type PermissionGroup = {
  category: string;
  permissions: PermissionSummary[];
};

const initialState: RoleActionState = {};

export default function RolePermissionsManager({
  assignedPermissions,
  availablePermissions,
  permissionsError,
  roleId,
}: RolePermissionsManagerProps) {
  const [state, formAction, isPending] = useActionState(updateRolePermissionsAction, initialState);
  const messageId = state.message ? 'role-permissions-message' : undefined;
  const assignedPermissionIds = new Set(assignedPermissions.map((permission) => permission.id));
  const permissionGroups = groupPermissions(
    mergePermissionOptions(assignedPermissions, availablePermissions),
  );
  const assignedPermissionsByKey = sortPermissionsByKey(assignedPermissions);

  return (
    <Box className="space-y-6" padding="default">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-heading">Permissions</h2>
        <p className="text-foreground">Select the permissions this role should have.</p>
      </div>

      {permissionsError ? (
        <p className="text-danger" role="alert">
          {permissionsError}
        </p>
      ) : null}

      {!permissionsError ? (
        <form action={formAction} aria-describedby={messageId} className="space-y-6">
          <input name="roleId" type="hidden" value={roleId} />
          {assignedPermissionsByKey.map((permission) => (
            <input
              key={permission.id}
              name="currentPermissionIds"
              type="hidden"
              value={permission.id}
            />
          ))}

          {permissionGroups.length > 0 ? (
            <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
              {permissionGroups.map((group) => (
                <Field.Set className="space-y-3" key={group.category}>
                  <Field.Legend className="text-sm font-medium text-foreground">
                    {formatCategoryLabel(group.category)}
                  </Field.Legend>
                  <ul className="space-y-2">
                    {group.permissions.map((permission) => (
                      <li className="flex gap-2" key={permission.id}>
                        <Checkbox
                          aria-label={permission.displayName}
                          defaultChecked={assignedPermissionIds.has(permission.id)}
                          id={`permission-${permission.id}`}
                          name="permissionIds"
                          value={permission.id}
                        />
                        <Label
                          className="text-sm text-heading"
                          htmlFor={`permission-${permission.id}`}
                        >
                          <Badge className="text-sm" variant="success">
                            {permission.key}
                          </Badge>{' '}
                          {permission.displayName}
                        </Label>
                      </li>
                    ))}
                  </ul>
                </Field.Set>
              ))}
            </div>
          ) : (
            <p className="text-foreground">No permissions are available to assign.</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button disabled={isPending || permissionGroups.length === 0} type="submit">
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/roles/${roleId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      ) : null}

      {state.message ? (
        <output
          className={state.status === 'success' ? 'text-success' : 'text-danger'}
          id="role-permissions-message"
        >
          {state.message}
        </output>
      ) : null}

      {permissionsError ? (
        <p className="text-foreground">Permissions could not be loaded.</p>
      ) : null}
    </Box>
  );
}

function mergePermissionOptions(
  assignedPermissions: PermissionSummary[],
  availablePermissions: PermissionSummary[],
) {
  const permissionsById = new Map<string, PermissionSummary>();

  for (const permission of availablePermissions) {
    if (permission.status === 'active') {
      permissionsById.set(permission.id, permission);
    }
  }

  for (const permission of assignedPermissions) {
    permissionsById.set(permission.id, permission);
  }

  return sortPermissionsByKey([...permissionsById.values()]);
}

function groupPermissions(permissions: PermissionSummary[]): PermissionGroup[] {
  const groups = new Map<string, PermissionSummary[]>();

  for (const permission of permissions) {
    const group = groups.get(permission.category) ?? [];
    group.push(permission);
    groups.set(permission.category, group);
  }

  return [...groups.entries()]
    .sort(([firstCategory], [secondCategory]) => firstCategory.localeCompare(secondCategory))
    .map(([category, groupPermissions]) => ({
      category,
      permissions: sortPermissionsByKey(groupPermissions),
    }));
}

function formatCategoryLabel(category: string) {
  return category
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function sortPermissionsByKey(permissions: PermissionSummary[]) {
  return [...permissions].sort((first, second) => first.key.localeCompare(second.key));
}
