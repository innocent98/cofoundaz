import { VerifyEmailClient } from '@/components/auth/verify-email-client';

// Target of the verification email link `/verify-email/{token}`. In Next 16
// dynamic `params` is async, so await it here (server) and hand the token to
// the client component that calls the API.
export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <VerifyEmailClient token={token} />;
}
