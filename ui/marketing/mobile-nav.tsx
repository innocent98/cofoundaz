'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/ui/primitives'
import { headerCtas, headerLinks } from '@/content/nav'
import { cn } from '../lib/cn'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close on route change so the panel never survives a navigation. Adjusted
  // during render (React's documented "reset state when a prop changes"
  // pattern) rather than in an effect — an effect-based `setOpen` here would
  // fire an extra render pass on every navigation
  // (react-hooks/set-state-in-effect). This also catches navigations that
  // don't originate from a click inside the panel (back/forward, programmatic
  // pushes), which an onClick handler alone would miss.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  // Move focus into the panel on open; restore it to the trigger on close.
  // Skip the very first run: `open` starts `false`, so without this guard
  // the "restore to trigger" branch would fire on mount and steal focus
  // from the page before the user ever interacts with the menu.
  const hasMounted = useRef(false)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (open) {
      panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    } else {
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: cycle within the panel.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-input text-green-700 hover:bg-green-50 lg:hidden"
      >
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span className={cn('absolute left-0 block h-0.5 w-5 bg-current transition-all', open ? 'top-2 rotate-45' : 'top-0')} />
          <span className={cn('absolute top-2 left-0 block h-0.5 w-5 bg-current transition-opacity', open && 'opacity-0')} />
          <span className={cn('absolute left-0 block h-0.5 w-5 bg-current transition-all', open ? 'top-2 -rotate-45' : 'top-4')} />
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-x-0 top-[72px] bottom-0 z-40 flex flex-col gap-2 border-t border-green-100 bg-white p-4 lg:hidden"
        >
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-input px-4 py-3 text-base font-medium text-sage-700 hover:bg-green-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-green-100 pt-4">
            {/*
              The desktop "Start free" accent button in SiteHeader stays
              visible at every width (including under `lg`), so it must not
              be duplicated here — the design system permits exactly one
              brass (`accent`) button per screen.
            */}
            <Button href={headerCtas.login.href} variant="secondary" size="md">
              {headerCtas.login.label}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
