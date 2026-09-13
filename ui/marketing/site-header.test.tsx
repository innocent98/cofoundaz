import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SiteHeader } from './site-header'

describe('SiteHeader', () => {
  it('renders a banner landmark', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('links to every in-scope marketing page', () => {
    render(<SiteHeader />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(within(nav).getByRole('link', { name: 'Product' })).toHaveAttribute('href', '/product')
    expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing')
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('renders a custom mustard CTA instead of copper', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelectorAll('a[href="/signup"]')).not.toHaveLength(0)
  })

  it('keeps the custom mustard CTA even with the mobile panel open', async () => {
    const user = userEvent.setup()
    const { container } = render(<SiteHeader />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(container.querySelectorAll('a[href="/signup"]')).not.toHaveLength(0)
  })

  it('sends the home link to /', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: /Cofoundaz/ })).toHaveAttribute('href', '/')
  })
})
