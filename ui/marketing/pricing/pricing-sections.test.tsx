import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { PricingCard } from './pricing-card'
import { ComparisonMatrix } from './comparison-matrix'
import { pricing } from '@/content/pricing'
import type { MatrixCell, MatrixSection } from '@/content/types'

const [starter, growth] = pricing.plans

/**
 * Every cell in the matrix, flattened. `pricing` is `as const`, so
 * `matrix[].rows` is a union of differently-shaped readonly tuples and a bare
 * `.flatMap` chain can't resolve a call signature — the explicit
 * `readonly MatrixSection[]` view is what makes it iterable as one list.
 */
function matrixCells(): MatrixCell[] {
  return (pricing.matrix as readonly MatrixSection[]).flatMap((section) =>
    section.rows.flatMap((row) => [row.starter, row.growth, row.scale])
  )
}

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

  it('gives "not included" cells an accessible text equivalent', () => {
    const negatives = matrixCells().filter((cell) => cell.kind === 'no').length
    expect(negatives).toBeGreaterThan(0)

    render(<ComparisonMatrix />)
    // One per negative cell — a bare "·" is announced as "middle dot", which a
    // screen-reader user cannot tell apart from an empty cell.
    expect(screen.getAllByText('Not included')).toHaveLength(negatives)
  })

  it('never renders a bare decorative dot as cell content', () => {
    const bareDots = matrixCells().filter(
      (cell) => cell.kind === 'text' && cell.value.trim() === '·'
    )
    expect(bareDots).toHaveLength(0)
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
