import Badge from '@adanft/ui/badge';
import Button from '@adanft/ui/button';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@adanft/ui/table';
import { Info, Pencil } from 'lucide-react';
import Link from 'next/link';

import type { PermissionStatus, PermissionsList } from '@/server/api/permissions';

const STATUS_LABELS: Record<PermissionStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_BADGE_VARIANTS: Record<PermissionStatus, 'success' | 'secondary'> = {
  active: 'success',
  disabled: 'secondary',
};

export default function PermissionsTable({ permissions }: { permissions: PermissionsList }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Permission</TableHead>
          <TableHead scope="col">Category</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Sort order</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permissions.permissions.map((permission) => (
          <TableRow key={permission.id}>
            <TableCell>
              <div className="space-y-0.5">
                <div className="font-medium text-heading">{permission.displayName}</div>
                <div className="text-sm text-foreground">{permission.key}</div>
                {permission.description ? (
                  <div className="max-w-prose text-sm text-foreground">
                    {permission.description}
                  </div>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{permission.category}</TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE_VARIANTS[permission.status]}>
                {STATUS_LABELS[permission.status]}
              </Badge>
            </TableCell>
            <TableCell>{permission.sortOrder}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
                >
                  <Link
                    aria-label={`View permission ${permission.displayName}`}
                    href={`/permissions/${permission.id}`}
                    title={`View permission ${permission.displayName}`}
                  >
                    <Info aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
                >
                  <Link
                    aria-label={`Edit ${permission.displayName}`}
                    href={`/permissions/${permission.id}/edit`}
                    title={`Edit ${permission.displayName}`}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
