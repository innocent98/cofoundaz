import { ResetPasswordForm } from '@/components/auth/reset-password-form';

// Target of the password-reset email link `/reset-password/{token}`. Next 16
// async `params` awaited here (server); the token is handed to the client form.
export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
