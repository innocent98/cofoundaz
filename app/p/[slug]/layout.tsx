import type { Metadata } from 'next';

// Founders' test pages are not meant to be found by search.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
