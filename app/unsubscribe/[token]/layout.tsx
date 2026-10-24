import type { Metadata } from 'next';

// A signed link from an email: never indexed, and the token must not leak through a referrer.
export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
