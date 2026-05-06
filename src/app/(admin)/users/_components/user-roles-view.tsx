import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import type { UserRoleSummary } from '@/lib/api/users';

type UserRolesViewProps = {
  roles: UserRoleSummary[];
  userId: string;
};

export default function UserRolesView({ roles, userId }: UserRolesViewProps) {
  const sortedRoles = sortRolesByKey(roles);

  return (
    <Box className="space-y-6" padding="default">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-heading">Roles</h2>
            <Badge variant="secondary">{sortedRoles.length} assigned</Badge>
          </div>
          <p className="text-foreground">Assigned roles and access profiles for this user.</p>
        </div>
        <Button
          asChild
          className="flex gap-2 rounded-full border border-heading bg-transparent text-heading hover:bg-heading/10"
        >
          <Link href={`/users/${userId}/roles`}>
            <ShieldCheck aria-hidden="true" className="size-4" />
            Modify
          </Link>
        </Button>
      </div>

      {sortedRoles.length > 0 ? (
        <ul className="grid gap-x-12 gap-y-3 md:grid-cols-2">
          {sortedRoles.map((role) => (
            <li className="flex flex-wrap items-center gap-2" key={role.id}>
              <Badge
                className="text-sm"
                variant={role.status === 'active' ? 'success' : 'secondary'}
              >
                {role.displayName}
              </Badge>
              {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground">No roles assigned yet.</p>
      )}
    </Box>
  );
}

function sortRolesByKey(roles: UserRoleSummary[]) {
  return [...roles].sort((first, second) => first.key.localeCompare(second.key));
}
