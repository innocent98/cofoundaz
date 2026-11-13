import { redirect } from 'next/navigation';

// Old route. The verification mail links to /verify-email/{token} and the
// "Check your inbox" page lives at /verify-email (PRD §01.2); keep old links working.
export default async function LegacyVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  redirect(token ? `/verify-email/${encodeURIComponent(token)}` : '/verify-email');
}
