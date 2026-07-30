import Link from 'next/link'
import { Button } from '@/ui/primitives'
import { headerCtas, headerLinks } from '@/content/nav'
import { Logo } from './logo'
import { MobileNav } from './mobile-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-8 px-4 md:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-input px-3 py-2 text-sm font-medium text-sage-700 hover:bg-green-50 hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Button href={headerCtas.login.href} variant="ghost" size="sm" className="hidden lg:inline-flex">
            {headerCtas.login.label}
          </Button>
          <Button href={headerCtas.signup.href} variant="accent" size="sm">
            {headerCtas.signup.label}
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
