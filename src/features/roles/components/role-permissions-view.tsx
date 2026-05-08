import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

import type { PermissionSummary } from '@/server/api/permissions';

type RolePermissionsViewProps = {
  canModify: boolean;
  permissions: PermissionSummary[];
  permissionsError?: string;
  roleId: string;
};

type PermissionGroup = {
  category: string;
  permissions: PermissionSummary[];
};

export default function RolePermissionsView({
  canModify,
  permissions,
  permissionsError,
  roleId,
}: RolePermissionsViewProps) {
  const sortedPermissions = sortPermissionsByKey(permissions);
  const permissionGroups = groupPermissions(sortedPermissions);

  return (
    <Box className="space-y-6" padding="default">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-heading">Permissions</h2>
            <Badge variant="secondary">{sortedPermissions.length} granted</Badge>
          </div>
          <p className="text-foreground">Granted access and capabilities for this role.</p>
        </div>
        {canModify ? (
          <Button
            asChild
            className="flex gap-2 rounded-full border border-heading bg-transparent text-heading hover:bg-heading/10"
          >
            <Link href={`/roles/${roleId}/permissions`}>
              <KeyRound aria-hidden="true" className="size-4" />
              Modify
            </Link>
          </Button>
        ) : null}
      </div>

      {permissionsError ? (
        <p className="text-danger" role="alert">
          {permissionsError}
        </p>
      ) : permissionGroups.length > 0 ? (
        <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
          {permissionGroups.map((group) => (
            <section className="space-y-3" key={group.category}>
              <h3 className="font-medium text-heading">{formatCategoryLabel(group.category)}</h3>
              <ul className="space-y-2">
                {group.permissions.map((permission) => (
                  <li key={permission.id}>
                    <Badge className="text-sm" variant="success">
                      {permission.displayName}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-foreground">No permissions assigned yet.</p>
      )}
    </Box>
  );
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
