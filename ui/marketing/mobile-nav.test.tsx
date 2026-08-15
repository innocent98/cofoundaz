import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileNav } from './mobile-nav'

// `usePathname` needs to be controllable so the "closes on route change"
// test can simulate a navigation without a real router. All other exports
// pass through untouched.
let mockPathname = '/'
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return { ...actual, usePathname: () => mockPathname }
})

describe('MobileNav', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('starts closed with aria-expanded false', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not steal focus from the page on initial render', () => {
    render(<MobileNav />)
    expect(document.activeElement).not.toBe(
      screen.getByRole('button', { name: /open menu/i })
    )
  })

  it('opens on click and exposes a labelled dialog', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    const trigger = screen.getByRole('button', { name: /open menu/i })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveFocus()
  })

  it('renders every header link plus the Start free and Log in CTAs when open', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Product')
    expect(dialog).toHaveTextContent('Pricing')
    expect(dialog).toHaveTextContent('About')
    // On mobile the header hides its accent CTA, so "Start free" lives here.
    expect(dialog).toHaveTextContent('Start free')
    expect(dialog).toHaveTextContent('Log in')
  })

  it('moves focus into the panel when opened', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement | null
    )
  })

  it('traps Tab within the panel, wrapping at both ends', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))

    const dialog = screen.getByRole('dialog')
    const focusables = within(dialog).getAllByRole('link')
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    // Focus starts on the first focusable element in the panel.
    expect(first).toHaveFocus()

    // Shift+Tab from the first element wraps to the last.
    await user.tab({ shift: true })
    expect(last).toHaveFocus()

    // Tab from the last element wraps back to the first.
    await user.tab()
    expect(first).toHaveFocus()
  })

  it('closes when the route changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    mockPathname = '/pricing'
    rerender(<MobileNav />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
