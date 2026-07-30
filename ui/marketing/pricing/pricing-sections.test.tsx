import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { PricingCard } from './pricing-card'
import { ComparisonMatrix } from './comparison-matrix'
import { pricing } from '@/content/pricing'

const [starter, growth] = pricing.plans

describe('PricingCard', () => {
  it('shows the price when one is set', () => {
    render(<PricingCard plan={starter} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders no price element when pricing is still TBD', () => {
    const { container } = render(<PricingCard plan={growth} />)
    expect(container.querySelector('[data-price]')).toBeNull()
  })

  it('badges the most popular plan', () => {
    render(<PricingCard plan={growth} />)
    expect(screen.getByText('Most popular')).toBeInTheDocument()
  })

  it('renders every feature with a decorative tick', () => {
    render(<PricingCard plan={starter} />)
    for (const feature of starter.features) {
      expect(screen.getByText(feature)).toBeInTheDocument()
    }
  })

  it('sends its CTA to signup', () => {
    render(<PricingCard plan={starter} />)
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
  })
})

describe('ComparisonMatrix', () => {
  it('renders a real table with a column per plan', () => {
    render(<ComparisonMatrix />)
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Starter' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Growth' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Scale' })).toBeInTheDocument()
  })

  it('gives tick cells an accessible text equivalent', () => {
    render(<ComparisonMatrix />)
    expect(screen.getAllByText('Included').length).toBeGreaterThan(0)
  })

  it('makes the horizontal scroll container keyboard reachable', () => {
    const { container } = render(<ComparisonMatrix />)
    const scroller = container.querySelector('[data-matrix-scroll]')
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller).toHaveAttribute('role', 'region')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ComparisonMatrix />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
