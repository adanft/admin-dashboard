'use client';

import Badge from '@adanft/ui/badge';
import Box from '@adanft/ui/box';
import Button from '@adanft/ui/button';
import Checkbox from '@adanft/ui/checkbox';
import Label from '@adanft/ui/label';
import Link from 'next/link';
import { useActionState } from 'react';

import type { UserActionState } from '@/features/users/actions/user-actions';
import { updateUserRolesAction } from '@/features/users/actions/user-actions';
import type { RoleSummary } from '@/server/api/roles';
import type { UserRoleSummary } from '@/server/api/users';

type RoleOption = Pick<RoleSummary, 'displayName' | 'id' | 'isSystem' | 'key' | 'status'>;

type UserRolesManagerProps = {
  assignedRoles: UserRoleSummary[];
  availableRoles: RoleSummary[];
  rolesError?: string;
  userId: string;
};

const initialState: UserActionState = {};

export default function UserRolesManager({
  assignedRoles,
  availableRoles,
  rolesError,
  userId,
}: UserRolesManagerProps) {
  const [state, formAction, isPending] = useActionState(updateUserRolesAction, initialState);
  const assignedRoleIds = new Set(assignedRoles.map((role) => role.id));
  const sortedAssignedRoles = sortRolesByKey(assignedRoles);
  const roleOptions = sortRolesByKey(mergeRoleOptions(assignedRoles, availableRoles));
  const messageId = state.message ? 'user-roles-message' : undefined;

  return (
    <Box className="space-y-6" padding="default">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-heading">Roles</h2>
        <p className="text-foreground">Select the roles this user should have.</p>
      </div>

      {rolesError ? (
        <p className="text-danger" role="alert">
          {rolesError}
        </p>
      ) : null}

      {!rolesError ? (
        <form action={formAction} aria-describedby={messageId} className="space-y-6">
          <input name="userId" type="hidden" value={userId} />
          {sortedAssignedRoles.map((role) => (
            <input key={role.id} name="currentRoleIds" type="hidden" value={role.id} />
          ))}

          {roleOptions.length > 0 ? (
            <ul className="grid gap-x-12 gap-y-3 md:grid-cols-2">
              {roleOptions.map((role) => (
                <li className="flex gap-2" key={role.id}>
                  <Checkbox
                    aria-label={role.displayName}
                    defaultChecked={assignedRoleIds.has(role.id)}
                    id={`role-${role.id}`}
                    name="roleIds"
                    value={role.id}
                  />
                  <Label className="text-sm text-heading" htmlFor={`role-${role.id}`}>
                    <Badge className="text-sm" variant="success">
                      {role.key}
                    </Badge>{' '}
                    {role.displayName}
                    {role.isSystem ? ' · System' : ''}
                  </Label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground">No roles are available to assign.</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button disabled={isPending || roleOptions.length === 0} type="submit">
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/users/${userId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      ) : null}

      {state.message ? (
        <output
          className={state.status === 'success' ? 'text-success' : 'text-danger'}
          id="user-roles-message"
        >
          {state.message}
        </output>
      ) : null}
    </Box>
  );
}

function mergeRoleOptions(assignedRoles: UserRoleSummary[], availableRoles: RoleSummary[]) {
  const rolesById = new Map<string, RoleOption>();

  for (const role of availableRoles) {
    if (role.status === 'active') {
      rolesById.set(role.id, role);
    }
  }

  for (const role of assignedRoles) {
    rolesById.set(role.id, role);
  }

  return [...rolesById.values()];
}

function sortRolesByKey<TRole extends RoleOption>(roles: TRole[]) {
  return [...roles].sort((first, second) => first.key.localeCompare(second.key));
}
