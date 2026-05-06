import Badge from '@adanft/ui/badge';
import Button from '@adanft/ui/button';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';
import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';

import type { RoleStatus, RolesList } from '@/lib/api/roles';
import RoleRowDeleteAction from './role-row-delete-action';

const STATUS_LABELS: Record<RoleStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_BADGE_VARIANTS: Record<RoleStatus, 'success' | 'secondary'> = {
  active: 'success',
  disabled: 'secondary',
};

export default function RolesTable({ roles }: { roles: RolesList }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Role</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Protected</TableHead>
          <TableHead scope="col">Created</TableHead>
          <TableHead scope="col">Updated</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.rows.map((role) => (
          <TableRow key={role.id}>
            <TableCell>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-heading">{role.displayName}</span>
                  {role.isSystem ? <Badge variant="secondary">System</Badge> : null}
                </div>
                <div className="text-sm text-foreground">{role.key}</div>
                {role.description ? (
                  <div className="max-w-prose text-sm text-foreground">{role.description}</div>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE_VARIANTS[role.status]}>
                {STATUS_LABELS[role.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={role.isSystem ? 'success' : 'danger'}>
                {role.isSystem ? 'True' : 'False'}
              </Badge>
            </TableCell>
            <TableCell>{formatDisplayDate(role.createdAt)}</TableCell>
            <TableCell>{formatDisplayDate(role.updatedAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
                >
                  <Link
                    aria-label={`View role ${role.displayName}`}
                    href={`/roles/${role.id}`}
                    title={`View role ${role.displayName}`}
                  >
                    <Info aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                {role.isSystem ? null : (
                  <RoleRowActions roleId={role.id} roleLabel={role.displayName} />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RoleRowActions({ roleId, roleLabel }: { roleId: string; roleLabel: string }) {
  return (
    <>
      <Button
        asChild
        className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
      >
        <Link
          aria-label={`Edit ${roleLabel}`}
          href={`/roles/${roleId}/edit`}
          title={`Edit ${roleLabel}`}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Link>
      </Button>
      <RoleRowDeleteAction roleId={roleId} roleLabel={roleLabel} />
    </>
  );
}

export function formatDisplayDate(value: string) {
  if (value === '—') {
    return value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsedDate);
}
