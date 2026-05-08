import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import type { RoleProfile, RoleStatus } from '@/server/api/roles';
import type { RoleDetailRouteState } from '../route-state';
import { RoleRouteMessage } from '../route-state';
import RolePermissionsView from './role-permissions-view';
import RoleRowDeleteAction from './role-row-delete-action';
import { formatDisplayDate } from './roles-table';

type RoleDetailPageContentProps = {
  state: RoleDetailRouteState;
};

const STATUS_LABELS: Record<RoleStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_BADGE_VARIANTS: Record<RoleStatus, 'success' | 'secondary'> = {
  active: 'success',
  disabled: 'secondary',
};

export default function RoleDetailPageContent({ state }: RoleDetailPageContentProps) {
  return (
    <section className="space-y-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-heading">Role details</h1>
      </header>

      {state.status === 'success' ? (
        <>
          <RoleProfileView permissionCount={state.assignedPermissions.length} role={state.role} />
          <RolePermissionsView
            canModify={!state.role.isSystem && !state.permissionsError}
            permissions={state.assignedPermissions}
            permissionsError={state.permissionsError}
            roleId={state.role.id}
          />
        </>
      ) : (
        <RoleRouteMessage state={state} />
      )}
    </section>
  );
}

function RoleProfileView({
  permissionCount,
  role,
}: {
  permissionCount: number;
  role: RoleProfile;
}) {
  return (
    <Box className="space-y-5" padding="default">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-heading">{role.displayName}</h2>
            {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
          </div>
          <p className="text-foreground">{role.key}</p>
        </div>
        {role.isSystem ? (
          <p className="max-w-sm text-sm text-foreground">
            System roles are protected and cannot be edited or deleted in this dashboard.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="flex gap-2 rounded-full border border-heading bg-transparent text-heading hover:bg-heading/10"
            >
              <Link aria-label={`Edit ${role.displayName}`} href={`/roles/${role.id}/edit`}>
                <Pencil aria-hidden="true" className="size-4" />
                Edit
              </Link>
            </Button>
            <RoleRowDeleteAction
              presentation="text"
              roleId={role.id}
              roleLabel={role.displayName}
            />
          </div>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-heading">Status</dt>
          <dd>
            <Badge variant={STATUS_BADGE_VARIANTS[role.status]}>{STATUS_LABELS[role.status]}</Badge>
          </dd>
        </div>
        <ProfileFact label="Permissions" value={formatPermissionCount(permissionCount)} />
        <ProfileFact label="Created" value={formatDisplayDate(role.createdAt)} />
        <ProfileFact label="Last updated" value={formatDisplayDate(role.updatedAt)} />
        {role.description ? <ProfileFact label="Description" value={role.description} /> : null}
      </dl>
    </Box>
  );
}

function formatPermissionCount(count: number) {
  return `${count} ${count === 1 ? 'permission' : 'permissions'}`;
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-heading">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
