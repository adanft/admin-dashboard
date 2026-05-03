import Link from 'next/link';

export default function AccountPage() {
  return (
    <section className="px-6 py-8">
      <h1 className="text-3xl font-bold text-heading">My Account</h1>
      <p className="mt-4 max-w-prose text-foreground">
        Review your account details and manage active access from one place.
      </p>
      <Link className="mt-4 inline-block font-medium underline" href="/account/sessions">
        Manage my sessions
      </Link>
    </section>
  );
}
