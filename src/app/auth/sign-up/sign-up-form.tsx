'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Link from 'next/link';
import { useActionState } from 'react';

import type { AuthActionState } from '@/lib/auth/types';
import { signUpAction } from './actions';

const initialState: AuthActionState = {};

type SignUpFormProps = {
  initialActionState?: AuthActionState;
};

export default function SignUpForm({ initialActionState = initialState }: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialActionState);
  const errorId = state.error ? 'sign-up-error' : undefined;

  return (
    <form action={formAction} aria-describedby={errorId} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Field.Label htmlFor="name">Name</Field.Label>
          <Input id="name" name="name" type="text" autoComplete="given-name" required />
        </Field>

        <Field>
          <Field.Label htmlFor="lastName">Last name</Field.Label>
          <Input id="lastName" name="lastName" type="text" autoComplete="family-name" required />
        </Field>
      </div>

      <Field>
        <Field.Label htmlFor="username">Username</Field.Label>
        <Input id="username" name="username" type="text" autoComplete="username" required />
      </Field>

      <Field>
        <Field.Label htmlFor="email">Email</Field.Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field>
        <Field.Label htmlFor="password">Password</Field.Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>

      <Field>
        <Field.Label htmlFor="avatar">Avatar URL</Field.Label>
        <Input id="avatar" name="avatar" type="url" autoComplete="url" />
        <Field.Description>Optional.</Field.Description>
      </Field>

      <Field.Error id="sign-up-error">{state.error}</Field.Error>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Setting up…' : 'Setup'}
      </Button>

      <p className="text-center text-xs text-muted">
        Already configured?{' '}
        <Link href="/auth/sign-in" className="underline underline-offset-4">
          Sign In
        </Link>
      </p>
    </form>
  );
}
