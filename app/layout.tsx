import type { Metadata } from 'next'
import { Spectral, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const spectral = Spectral({
  variable: '--font-spectral',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cofoundaz.com'),
  title: {
    default: 'Cofoundaz — The co-founder who never sleeps.',
    template: '%s · Cofoundaz',
  },
  description:
    'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spectral.variable} ${hanken.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
