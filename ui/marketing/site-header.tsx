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

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {headerLinks.map((link) => {
            if (link.label === 'Resources') {
              return (
                <div key={link.href} className="group relative">
                  <button
                    type="button"
                    aria-expanded="false"
                    aria-haspopup="menu"
                    className="flex items-center gap-1.5 px-3 py-2 text-[15px] font-normal text-[#33413B] hover:text-sage-500 transition-colors cursor-pointer focus:outline-none"
                  >
                    Resources
                    <svg className="h-3 w-3 text-[#33413B] transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    role="menu"
                    aria-label="Resources"
                    className="invisible absolute top-full left-0 mt-1 flex w-48 flex-col rounded-input bg-white p-2 shadow-raised opacity-0 transition-all group-hover:visible group-hover:opacity-100"
                  >
                    <Link role="menuitem" href="#blog" className="px-3 py-2 text-[15px] text-[#33413B] hover:bg-sage-50 hover:text-sage-600 rounded-input">
                      Blog
                    </Link>
                    <Link role="menuitem" href="#guides" className="px-3 py-2 text-[15px] text-[#33413B] hover:bg-sage-50 hover:text-sage-600 rounded-input">
                      Guides & Tools
                    </Link>
                  </div>
                </div>
              )
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-[15px] font-normal text-[#33413B] hover:text-sage-500 transition-colors"
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Button href={headerCtas.login.href} variant="ghost" size="sm" className="hidden lg:inline-flex text-[#1B4B38] hover:text-[#12291F]">
            {headerCtas.login.label}
          </Button>
          <Button href={headerCtas.signup.href} variant="accent" size="sm" className="hidden lg:inline-flex">
            {headerCtas.signup.label}
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}