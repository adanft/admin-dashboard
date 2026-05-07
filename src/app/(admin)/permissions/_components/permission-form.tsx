'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Link from 'next/link';
import { useActionState } from 'react';

import type { PermissionProfile } from '@/lib/api/permissions';
import { type PermissionActionState, updatePermissionAction } from '../_lib/permission-actions';

type PermissionFormProps = {
  initialActionState?: PermissionActionState;
  permission: PermissionProfile;
};

const initialState: PermissionActionState = {};

export default function PermissionForm({
  initialActionState = initialState,
  permission,
}: PermissionFormProps) {
  const [state, formAction, isPending] = useActionState(updatePermissionAction, initialActionState);
  const formErrorId = state.message ? 'permission-form-error' : undefined;
  const values = {
    key: permission.key,
    displayName: state.values?.displayName ?? permission.displayName,
    description: state.values?.description ?? permission.description ?? '',
    category: state.values?.category ?? permission.category,
    sortOrder: state.values?.sortOrder ?? String(permission.sortOrder),
  };

  return (
    <form action={formAction} aria-describedby={formErrorId} className="flex flex-col gap-5">
      <input name="id" type="hidden" value={permission.id} />

      <PermissionTextField
        description="System permission keys are defined by the backend and cannot be edited."
        disabled
        id="key"
        label="Permission key"
        name="key"
        type="text"
        value={values.key}
      />

      <PermissionTextField
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
          placeholder="Optional summary shown to administrators"
          rows={4}
        />
      </Field>

      <PermissionTextField
        error={state.fieldErrors?.category}
        id="category"
        label="Category"
        name="category"
        required
        type="text"
        value={values.category}
      />

      <PermissionTextField
        error={state.fieldErrors?.sortOrder}
        id="sortOrder"
        label="Sort order"
        min={0}
        name="sortOrder"
        required
        step={1}
        type="number"
        value={values.sortOrder}
      />

      <Field.Error id="permission-form-error">{state.message}</Field.Error>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Updating…' : 'Update'}
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/permissions/${permission.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

type PermissionTextFieldProps = {
  description?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  value?: string;
} & Pick<
  React.ComponentPropsWithoutRef<'input'>,
  'disabled' | 'min' | 'required' | 'step' | 'type'
>;

function PermissionTextField({
  description,
  error,
  id,
  label,
  name,
  value,
  ...inputProps
}: PermissionTextFieldProps) {
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
