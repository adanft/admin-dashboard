'use client';

import Button from '@adanft/ui/button';
import Modal from '@adanft/ui/modal';
import { Trash } from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';

import { deleteUserAction, type UserActionState } from '../_lib/user-actions';

type UserRowDeleteActionProps = {
  presentation?: 'icon' | 'text';
  userId: string;
  userLabel: string;
};

type DeleteUserConfirmationContentProps = UserRowDeleteActionProps & {
  closeLabel: string;
  initialActionState?: UserActionState;
  onClose: () => void;
};

const initialState: UserActionState = {};

export default function UserRowDeleteAction({
  presentation = 'icon',
  userId,
  userLabel,
}: UserRowDeleteActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerClassName =
    presentation === 'text'
      ? 'flex gap-2 rounded-full border border-danger bg-transparent text-danger hover:bg-danger/10'
      : 'size-8 rounded-full bg-transparent p-0 text-danger hover:bg-danger/10';

  return (
    <>
      <Button
        aria-label={`Delete ${userLabel}`}
        className={triggerClassName}
        onClick={() => setIsOpen(true)}
        title={`Delete ${userLabel}`}
        type="button"
      >
        <Trash aria-hidden="true" className="size-4" />
        {presentation === 'text' ? 'Delete' : null}
      </Button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Backdrop />
        <Modal.Panel aria-labelledby={`delete-user-title-${userId}`} className="max-w-md space-y-4">
          <DeleteUserConfirmationContent
            closeLabel={`Cancel deleting ${userLabel}`}
            onClose={() => setIsOpen(false)}
            userId={userId}
            userLabel={userLabel}
          />
        </Modal.Panel>
      </Modal>
    </>
  );
}

export function DeleteUserConfirmationContent({
  closeLabel,
  initialActionState = initialState,
  onClose,
  userId,
  userLabel,
}: DeleteUserConfirmationContentProps) {
  const [state, deleteAction, isPending] = useActionState(deleteUserAction, initialActionState);
  const errorId = state.message ? 'row-delete-user-error' : undefined;

  return (
    <div aria-describedby={errorId} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-heading" id={`delete-user-title-${userId}`}>
          Delete User
        </h2>
        <p className="text-foreground">
          Are you sure you want to delete &quot;{userLabel}&quot;? This action cannot be undone.
        </p>
      </div>

      {state.message ? (
        <p className="text-danger" id="row-delete-user-error" role="alert">
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
          onClick={() => startTransition(() => deleteAction(userId))}
          type="button"
        >
          {isPending ? 'Deleting user…' : 'Delete user'}
        </Button>
      </div>
    </div>
  );
}
