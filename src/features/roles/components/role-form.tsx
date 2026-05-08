'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Select from '@adanft/ui/select';
import Link from 'next/link';
import { useActionState } from 'react';

import type { RoleProfile } from '@/server/api/roles';
import { createRoleAction, type RoleActionState, updateRoleAction } from '../actions/role-actions';

type RoleFormProps =
  | {
      initialActionState?: RoleActionState;
      mode: 'create';
      role?: never;
    }
  | {
      initialActionState?: RoleActionState;
      mode: 'edit';
      role: RoleProfile;
    };

const initialState: RoleActionState = {};

export default function RoleForm({ initialActionState = initialState, mode, role }: RoleFormProps) {
  const action = mode === 'create' ? createRoleAction : updateRoleAction;
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const formErrorId = state.message ? 'role-form-error' : undefined;
  const values = {
    key: state.values?.key ?? role?.key ?? '',
    displayName: state.values?.displayName ?? role?.displayName ?? '',
    description: state.values?.description ?? role?.description ?? '',
    status: state.values?.status ?? role?.status ?? 'active',
  };

  return (
    <form action={formAction} aria-describedby={formErrorId} className="flex flex-col gap-5">
      {mode === 'edit' ? <input name="id" type="hidden" value={role.id} /> : null}

      <RoleTextField
        description={
          mode === 'create' ? 'Stable backend key, for example finance.viewer.' : undefined
        }
        disabled={mode === 'edit'}
        error={state.fieldErrors?.key}
        id="key"
        label="Role key"
        name="key"
        required={mode === 'create'}
        type="text"
        value={values.key}
      />

      <RoleTextField
        error={state.fieldErrors?.displayName}
        id="displayName"
        label="Display name"
        name="displayName"
        required
        type="text"
        value={values.displayName}
      />

      <Field>
        <Field.Label htmlFor="description">Description</Field.Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-transparent px-3 py-2 text-foreground"
          defaultValue={values.description}
          id="description"
          name="description"
          placeholder="Optional summary of what this role can do"
          rows={4}
        />
      </Field>

      {mode === 'edit' ? (
        <Field>
          <Field.Label htmlFor="status">Status</Field.Label>
          <Select
            aria-describedby={state.fieldErrors?.status ? 'role-status-error' : undefined}
            aria-invalid={Boolean(state.fieldErrors?.status)}
            defaultValue={values.status}
            id="status"
            name="status"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
          <Field.Error id="role-status-error">{state.fieldErrors?.status}</Field.Error>
        </Field>
      ) : null}

      <Field.Error id="role-form-error">{state.message}</Field.Error>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isPending}>
          {isPending ? pendingLabel(mode) : submitLabel(mode)}
        </Button>
        <Button asChild variant="secondary">
          <Link href={mode === 'edit' ? `/roles/${role.id}` : '/roles'}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

type RoleTextFieldProps = {
  description?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  value?: string;
} & Pick<React.ComponentPropsWithoutRef<'input'>, 'disabled' | 'required' | 'type'>;

function RoleTextField({
  description,
  error,
  id,
  label,
  name,
  value,
  ...inputProps
}: RoleTextFieldProps) {
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

function submitLabel(mode: RoleFormProps['mode']) {
  return mode === 'create' ? 'Create' : 'Update';
}

function pendingLabel(mode: RoleFormProps['mode']) {
  return mode === 'create' ? 'Creating…' : 'Updating…';
}
