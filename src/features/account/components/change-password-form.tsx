'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import { useActionState } from 'react';

import { type AccountActionState, changePasswordAction } from '../actions/account-actions';

const initialState: AccountActionState = {};

export default function ChangePasswordForm({
  initialActionState = initialState,
}: {
  initialActionState?: AccountActionState;
}) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialActionState);
  const formMessageId = state.message ? 'change-password-form-message' : undefined;

  return (
    <form action={formAction} aria-describedby={formMessageId} className="flex flex-col gap-5">
      <PasswordField
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
        id="currentPassword"
        label="Current password"
        name="currentPassword"
      />
      <PasswordField
        autoComplete="new-password"
        description="Use a strong password that is not shared with another service."
        error={state.fieldErrors?.newPassword}
        id="newPassword"
        label="New password"
        name="newPassword"
      />

      <FormMessage id={formMessageId} message={state.message} status={state.status} />

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Updating…' : 'Change password'}
        </Button>
      </div>
    </form>
  );
}

function FormMessage({
  id,
  message,
  status,
}: Pick<AccountActionState, 'message' | 'status'> & { id?: string }) {
  if (!message) return null;

  if (status === 'success') {
    return (
      <p aria-live="polite" className="text-sm text-success" id={id}>
        {message}
      </p>
    );
  }

  return <Field.Error id={id}>{message}</Field.Error>;
}

type PasswordFieldProps = {
  autoComplete: string;
  description?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
};

function PasswordField({ autoComplete, description, error, id, label, name }: PasswordFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field>
      <Field.Label htmlFor={id}>{label}</Field.Label>
      <Input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        name={name}
        required
        type="password"
      />
      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error id={errorId}>{error}</Field.Error>
    </Field>
  );
}
