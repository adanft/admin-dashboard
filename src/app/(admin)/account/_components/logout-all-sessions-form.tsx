'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import { useActionState } from 'react';

import { type AccountActionState, logoutAllSessionsAction } from '../_lib/account-actions';

const initialState: AccountActionState = {};

export default function LogoutAllSessionsForm({
  initialActionState = initialState,
}: {
  initialActionState?: AccountActionState;
}) {
  const [state, formAction, isPending] = useActionState(
    logoutAllSessionsAction,
    initialActionState,
  );
  const errorId = state.message ? 'logout-all-sessions-error' : undefined;

  return (
    <form action={formAction} aria-describedby={errorId} className="space-y-3">
      <Field.Error id={errorId}>{state.message}</Field.Error>
      <Button type="submit" variant="danger" disabled={isPending}>
        {isPending ? 'Logging out…' : 'Log out all sessions'}
      </Button>
    </form>
  );
}
