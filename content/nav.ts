import type { NavLink } from './types'

/**
 * Blog and Help Center are designed in the comp but out of scope for v1
 * (see spec §3). They are kept here, commented out, so re-enabling is one line
 * once those routes exist. Shipping them now would mean dead links.
 */
export const headerLinks: NavLink[] = [
  { label: 'Product', href: '/product' },
  { label: 'Pricing', href: '/pricing' },
  // { label: 'Blog', href: '/blog' },
  // { label: 'Help Center', href: '/help' },
  { label: 'About', href: '/about' },
]

export const headerCtas = {
  login: { label: 'Log in', href: '/login' },
  signup: { label: 'Start free', href: '/signup' },
}

export const footerTagline =
  'The AI operating system that takes founders from idea to profitability.'

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '/product' },
      { label: 'Pricing', href: '/pricing' },
      // { label: 'Blog', href: '/blog' },
      // { label: 'Help Center', href: '/help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
]

export const copyright = '© 2026 Cofoundaz. All rights reserved.'
