'use client';

import Button from '@adanft/ui/button';
import Field from '@adanft/ui/field';
import Input from '@adanft/ui/input';
import Link from 'next/link';
import { useActionState } from 'react';

import { signInAction } from '@/features/auth/actions/sign-in-action';
import type { AuthActionState } from '@/server/auth/types';

const initialState: AuthActionState = {};

type SignInFormProps = {
  initialActionState?: AuthActionState;
};

export default function SignInForm({ initialActionState = initialState }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialActionState);
  const errorId = state.error ? 'sign-in-error' : undefined;

  return (
    <form action={formAction} aria-describedby={errorId} className="flex flex-col gap-5">
      <Field>
        <Field.Label htmlFor="identity">Username</Field.Label>
        <Input
          id="identity"
          name="identity"
          type="text"
          autoComplete="username"
          required
          aria-invalid={Boolean(state.error)}
        />
      </Field>

      <Field>
        <Field.Label htmlFor="password">Password</Field.Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error)}
        />
      </Field>

      <Field.Error id="sign-in-error">{state.error}</Field.Error>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-xs text-muted">
        Initial setup needed?{' '}
        <Link href="/auth/sign-up" className="underline underline-offset-4">
          Setup
        </Link>
      </p>
    </form>
  );
}
