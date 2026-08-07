import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/lib/actions';
import { getSessionUser } from '@/lib/session';
import { storefrontConfig } from '@/lib/config';
import Container from '@/theme/Container';
import SubmitButton from '@/components/SubmitButton';

export const metadata: Metadata = { title: 'Sign In' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  if (await getSessionUser()) redirect('/account');
  const hasError = rawParams.error === '1';
  const back = typeof rawParams.back === 'string' ? rawParams.back : '/account';

  return (
    <Container size="md" className="login-page py-12">
      <h1 className="login-title text-3xl font-bold">Sign In</h1>
      <p className="login-hint mt-2 text-sm text-gray-600">
        Demo account: <code className="login-hint-code rounded bg-mist px-1.5 py-0.5">AmandaRCole@example.org</code> /{' '}
        <code className="login-hint-code rounded bg-mist px-1.5 py-0.5">demo123</code>
      </p>

      {hasError && (
        <p role="alert" className="login-error mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Invalid email or password.
        </p>
      )}

      <form action={loginAction} className="login-form mt-6 space-y-4">
        <input type="hidden" name="back" value={back} className="login-back" />
        <label className="login-field block text-sm">
          <span className="login-field-label mb-1 block font-medium">Email</span>
          <input
            type="email" name="email" required autoComplete="email"
            className="login-field-input w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="login-field block text-sm">
          <span className="login-field-label mb-1 block font-medium">Password</span>
          <input
            type="password" name="password" required autoComplete="current-password"
            className="login-field-input w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
          />
        </label>
        <SubmitButton
          className="login-submit w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          pendingText="Signing in…"
        >
          Log In
        </SubmitButton>
      </form>

      {storefrontConfig.checkout.allowGuest && back.startsWith('/checkout') && (
        <p className="login-guest mt-6 border-t border-mist pt-5 text-center text-sm">
          <Link href="/checkout" className="login-guest-link font-semibold text-brand-600 underline">
            Continue as guest →
          </Link>
        </p>
      )}
    </Container>
  );
}
