import { render, screen, within } from '@testing-library/react'
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

  it('does not link to out-of-scope Blog or Help Center pages', () => {
    render(<SiteHeader />)
    expect(screen.queryByRole('link', { name: 'Blog' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Help Center' })).not.toBeInTheDocument()
    expect(screen.queryByText('Resources')).not.toBeInTheDocument()
  })

  it('renders exactly one brass CTA, per PRD §1.1 rule 3', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelectorAll('.bg-brass-600')).toHaveLength(1)
  })

  it('sends the home link to /', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: /Cofoundaz/ })).toHaveAttribute('href', '/')
  })
})
