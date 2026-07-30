import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ProductHero } from './product-hero'
import { HubSection } from './hub-section'
import { ScoreBand } from './score-band'
import { product } from '@/content/product'

describe('ProductHero', () => {
  it('renders the h1 and the three stats', () => {
    render(<ProductHero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(product.hero.title)
    expect(screen.getByText('26')).toBeInTheDocument()
    expect(screen.getByText('connected modules')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ProductHero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('HubSection', () => {
  it('renders with the anchor id the sub-nav targets', () => {
    const group = product.hubGroups[0]
    const { container } = render(<HubSection group={group} index={0} />)
    expect(container.querySelector(`#${group.anchor}`)).toBeInTheDocument()
  })

  it('renders the kicker, title, three items, and metric', () => {
    const group = product.hubGroups[1]
    render(<HubSection group={group} index={1} />)
    expect(screen.getByText(group.kicker)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: group.title })).toBeInTheDocument()
    for (const item of group.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument()
    }
    expect(screen.getByText(group.metric)).toBeInTheDocument()
  })

  it('uses AA-safe brass-700 for the kicker on a light surface', () => {
    render(<HubSection group={product.hubGroups[0]} index={0} />)
    expect(screen.getByText('Overview').className).toContain('text-brass-700')
  })
})

describe('ScoreBand', () => {
  it('renders the three explainer cards', () => {
    render(<ScoreBand />)
    for (const card of product.scoreBand.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument()
    }
  })
})
