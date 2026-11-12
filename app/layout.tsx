import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cofoundaz',
    template: '%s · Cofoundaz',
  },
  description:
    'The AI operating system for founders: one connected workspace, a bench of AI advisors, and a clear next step every day.',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}