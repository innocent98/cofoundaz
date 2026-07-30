import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MobileNav } from './mobile-nav'

describe('MobileNav', () => {
  it('starts closed with aria-expanded false', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

  it('renders every header link plus both CTAs when open', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Product')
    expect(dialog).toHaveTextContent('Pricing')
    expect(dialog).toHaveTextContent('About')
    expect(dialog).toHaveTextContent('Log in')
    expect(dialog).toHaveTextContent('Start free')
  })

  it('moves focus into the panel when opened', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement | null
    )
  })
})
