'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import { useActionState } from 'react';

import { type RequiredPasswordChangeState, requiredPasswordChangeAction } from './actions';

const initialState: RequiredPasswordChangeState = {};

type RequiredPasswordChangeFormProps = {
  initialActionState?: RequiredPasswordChangeState;
};

export default function RequiredPasswordChangeForm({
  initialActionState = initialState,
}: RequiredPasswordChangeFormProps) {
  const [state, formAction, isPending] = useActionState(
    requiredPasswordChangeAction,
    initialActionState,
  );
  const formMessageId = state.message ? 'required-password-change-form-message' : undefined;

  return (
    <form action={formAction} aria-describedby={formMessageId} className="flex flex-col gap-5">
      <PasswordField
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
        id="currentPassword"
        label="Temporary password"
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

      <FormMessage id={formMessageId} message={state.message} />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Updating…' : 'Change password'}
      </Button>
    </form>
  );
}

function FormMessage({
  id,
  message,
}: Pick<RequiredPasswordChangeState, 'message'> & { id?: string }) {
  if (!message) return null;

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
