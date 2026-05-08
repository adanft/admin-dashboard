'use client';

import Button from '@adanft/ui/button';
import { LogOut } from 'lucide-react';
import { useActionState } from 'react';

import { type RevokeSessionActionState, revokeSessionAction } from '../actions/session-actions';

const initialActionState: RevokeSessionActionState = {};

type SessionRevokeFormProps = {
  initialState?: RevokeSessionActionState;
  isCurrent: boolean;
  sessionId: string;
};

export default function SessionRevokeForm({
  initialState = initialActionState,
  isCurrent,
  sessionId,
}: SessionRevokeFormProps) {
  const [state, formAction, isPending] = useActionState(revokeSessionAction, initialState);
  const messageId = state.message ? `revoke-session-${sessionId}-message` : undefined;
  const actionLabel = isCurrent ? 'Revoke current session and sign out' : 'Revoke session';

  return (
    <form action={formAction} aria-describedby={messageId} className="space-y-2">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="isCurrent" type="hidden" value={String(isCurrent)} />
      <Button
        aria-label={actionLabel}
        className="size-8 rounded-full bg-transparent p-0 text-danger hover:bg-danger/10"
        disabled={isPending}
        title={actionLabel}
        type="submit"
      >
        <LogOut aria-hidden="true" className="size-4" />
      </Button>
      {state.message ? (
        <p aria-live="polite" className="text-sm text-danger" id={messageId}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
