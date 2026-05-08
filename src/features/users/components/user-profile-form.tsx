'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Link from 'next/link';
import { useActionState } from 'react';

import {
  createUserAction,
  type UserActionState,
  updateUserAction,
} from '@/features/users/actions/user-actions';
import type { UserProfile } from '@/server/api/users';

type UserProfileFormProps =
  | {
      mode: 'create';
      initialActionState?: UserActionState;
      user?: never;
    }
  | {
      mode: 'edit';
      user: UserProfile;
      initialActionState?: UserActionState;
    };

const initialState: UserActionState = {};

export default function UserProfileForm({
  initialActionState = initialState,
  mode,
  user,
}: UserProfileFormProps) {
  const action = mode === 'create' ? createUserAction : updateUserAction;
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const formErrorId = state.message ? 'user-profile-form-error' : undefined;
  const values = {
    name: state.values?.name ?? user?.name ?? '',
    lastName: state.values?.lastName ?? user?.lastName ?? '',
    username: state.values?.username ?? user?.username ?? '',
    email: state.values?.email ?? user?.email ?? '',
    avatar: state.values?.avatar ?? user?.avatar ?? '',
  };

  return (
    <form action={formAction} aria-describedby={formErrorId} className="flex flex-col gap-5">
      {mode === 'edit' ? <input name="id" type="hidden" value={user.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileField
          autoComplete="given-name"
          error={state.fieldErrors?.name}
          id="name"
          label="First name"
          name="name"
          required
          type="text"
          value={values.name}
        />
        <ProfileField
          autoComplete="family-name"
          error={state.fieldErrors?.lastName}
          id="lastName"
          label="Last name"
          name="lastName"
          required
          type="text"
          value={values.lastName}
        />
      </div>

      <ProfileField
        autoComplete="username"
        error={state.fieldErrors?.username}
        id="username"
        label="Username"
        name="username"
        required
        type="text"
        value={values.username}
      />

      <ProfileField
        autoComplete="email"
        error={state.fieldErrors?.email}
        id="email"
        label="Email"
        name="email"
        required
        type="email"
        value={values.email}
      />

      <ProfileField
        autoComplete="url"
        description="Optional. Use a full image URL."
        error={state.fieldErrors?.avatar}
        id="avatar"
        label="Avatar URL"
        name="avatar"
        type="url"
        value={values.avatar}
      />

      {mode === 'create' ? (
        <ProfileField
          autoComplete="new-password"
          description="Share this temporary password through an approved secure channel. It is never shown after submit."
          error={state.fieldErrors?.temporaryPassword}
          id="temporaryPassword"
          label="Temporary password"
          name="temporaryPassword"
          required
          type="password"
        />
      ) : null}

      <Field.Error id="user-profile-form-error">{state.message}</Field.Error>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isPending}>
          {isPending ? pendingLabel(mode) : submitLabel(mode)}
        </Button>
        <Button asChild variant="secondary">
          <Link href={mode === 'edit' ? `/users/${user.id}` : '/users'}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

type ProfileFieldProps = {
  description?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  value?: string;
} & Pick<React.ComponentPropsWithoutRef<'input'>, 'autoComplete' | 'required' | 'type'>;

function ProfileField({
  description,
  error,
  id,
  label,
  name,
  value,
  ...inputProps
}: ProfileFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field>
      <Field.Label htmlFor={id}>{label}</Field.Label>
      <Input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        defaultValue={value}
        id={id}
        name={name}
        {...inputProps}
      />
      {description ? <Field.Description>{description}</Field.Description> : null}
      <Field.Error id={errorId}>{error}</Field.Error>
    </Field>
  );
}

function submitLabel(mode: UserProfileFormProps['mode']) {
  return mode === 'create' ? 'Create' : 'Update';
}

function pendingLabel(mode: UserProfileFormProps['mode']) {
  return mode === 'create' ? 'Creating…' : 'Updating…';
}
