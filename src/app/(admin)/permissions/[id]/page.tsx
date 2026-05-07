import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import type { PermissionProfile, PermissionStatus } from '@/lib/api/permissions';
import DashboardPermissionBreadcrumbs from '../../_components/dashboard-permission-breadcrumbs';
import { loadPermissionRouteState, PermissionRouteMessage } from '../_lib/route-state';

type PermissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS: Record<PermissionStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_BADGE_VARIANTS: Record<PermissionStatus, 'success' | 'secondary'> = {
  active: 'success',
  disabled: 'secondary',
};

export default async function PermissionDetailPage({ params }: PermissionDetailPageProps) {
  const { id } = await params;
  const state = await loadPermissionRouteState(id);
  const permissionLabel = state.status === 'success' ? state.permission.displayName : null;

  return (
    <>
      {permissionLabel ? (
        <DashboardPermissionBreadcrumbs permissionLabel={permissionLabel} />
      ) : null}
      <section className="space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-heading">Permission details</h1>
          <p className="max-w-prose text-foreground">
            Permissions are system-defined. Only display metadata can be edited.
          </p>
        </header>

        {state.status === 'success' ? (
          <PermissionProfileView permission={state.permission} />
        ) : (
          <PermissionRouteMessage state={state} />
        )}
      </section>
    </>
  );
}

function PermissionProfileView({ permission }: { permission: PermissionProfile }) {
  return (
    <Box className="space-y-5" padding="default">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-heading">{permission.displayName}</h2>
            <Badge variant="secondary">System</Badge>
          </div>
          <p className="text-foreground">{permission.key}</p>
        </div>
        <Button
          asChild
          className="flex gap-2 rounded-full border border-heading bg-transparent text-heading hover:bg-heading/10"
        >
          <Link
            aria-label={`Edit ${permission.displayName}`}
            href={`/permissions/${permission.id}/edit`}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Link>
        </Button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <ProfileFact label="Category" value={permission.category} />
        <div className="space-y-1">
          <dt className="text-sm font-medium text-heading">Status</dt>
          <dd>
            <Badge variant={STATUS_BADGE_VARIANTS[permission.status]}>
              {STATUS_LABELS[permission.status]}
            </Badge>
          </dd>
        </div>
        <ProfileFact label="Sort order" value={String(permission.sortOrder)} />
        {permission.description ? (
          <ProfileFact label="Description" value={permission.description} />
        ) : null}
      </dl>
    </Box>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-heading">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
