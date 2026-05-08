'use client';

import Button from '@adanft/ui/button';
import Modal from '@adanft/ui/modal';
import { Trash } from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';

import { deleteRoleAction, type RoleActionState } from '../actions/role-actions';

type RoleRowDeleteActionProps = {
  presentation?: 'icon' | 'text';
  roleId: string;
  roleLabel: string;
};

type DeleteRoleConfirmationContentProps = RoleRowDeleteActionProps & {
  closeLabel: string;
  initialActionState?: RoleActionState;
  onClose: () => void;
};

const initialState: RoleActionState = {};

export default function RoleRowDeleteAction({
  presentation = 'icon',
  roleId,
  roleLabel,
}: RoleRowDeleteActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerClassName =
    presentation === 'text'
      ? 'flex gap-2 rounded-full border border-danger bg-transparent text-danger hover:bg-danger/10'
      : 'size-8 rounded-full bg-transparent p-0 text-danger hover:bg-danger/10';

  return (
    <>
      <Button
        aria-label={`Delete ${roleLabel}`}
        className={triggerClassName}
        onClick={() => setIsOpen(true)}
        title={`Delete ${roleLabel}`}
        type="button"
      >
        <Trash aria-hidden="true" className="size-4" />
        {presentation === 'text' ? 'Delete' : null}
      </Button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Backdrop />
        <Modal.Panel aria-labelledby={`delete-role-title-${roleId}`} className="max-w-md space-y-4">
          <DeleteRoleConfirmationContent
            closeLabel={`Cancel deleting ${roleLabel}`}
            onClose={() => setIsOpen(false)}
            roleId={roleId}
            roleLabel={roleLabel}
          />
        </Modal.Panel>
      </Modal>
    </>
  );
}

export function DeleteRoleConfirmationContent({
  closeLabel,
  initialActionState = initialState,
  onClose,
  roleId,
  roleLabel,
}: DeleteRoleConfirmationContentProps) {
  const [state, deleteAction, isPending] = useActionState(deleteRoleAction, initialActionState);
  const errorId = state.message ? 'row-delete-role-error' : undefined;

  return (
    <div aria-describedby={errorId} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-heading" id={`delete-role-title-${roleId}`}>
          Delete Role
        </h2>
        <p className="text-foreground">
          Are you sure you want to delete &quot;{roleLabel}&quot;? This action cannot be undone.
        </p>
      </div>

      {state.message ? (
        <p className="text-danger" id="row-delete-role-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button aria-label={closeLabel} variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          className="bg-danger hover:bg-danger/90"
          disabled={isPending}
          onClick={() => startTransition(() => deleteAction(roleId))}
          type="button"
        >
          {isPending ? 'Deleting role…' : 'Delete role'}
        </Button>
      </div>
    </div>
  );
}
