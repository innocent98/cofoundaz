import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kolo',
  description: 'Startup Dashboard',
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