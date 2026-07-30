import Link from 'next/link'
import { Container } from '@/ui/primitives'
import { copyright, footerColumns, footerTagline } from '@/content/nav'
import { Logo } from './logo'

export function SiteFooter() {
  return (
    <footer className="bg-green-950 text-green-300">
      <Container className="grid grid-cols-1 gap-8 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-3.5 max-w-[26ch] text-[13px] leading-relaxed text-green-400">
            {footerTagline}
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3.5 text-xs font-bold uppercase tracking-[0.06em] text-green-200">
              {column.title}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-green-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <Container className="flex flex-col items-center justify-between gap-4 border-t border-green-900 py-5 text-[13px] text-green-400 md:flex-row">
        <span>{copyright}</span>
      </Container>
    </footer>
  )
}
