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

  it('renders each stat label exactly once, as a valid dt/dd pair', () => {
    const { container } = render(<ProductHero />)
    for (const stat of product.hero.stats) {
      expect(screen.getAllByText(stat.label)).toHaveLength(1)
    }
    const dl = container.querySelector('dl')
    expect(dl?.querySelectorAll('dt')).toHaveLength(product.hero.stats.length)
    expect(dl?.querySelectorAll('dd')).toHaveLength(product.hero.stats.length)
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

  it('uses AA-safe copper-700 for the kicker on a light surface', () => {
    render(<HubSection group={product.hubGroups[0]} index={0} />)
    expect(screen.getByText('Overview').className).toContain('text-copper-700')
  })

  it('alternates the lg column order per index, across every hub group', () => {
    for (const [index, group] of product.hubGroups.entries()) {
      const { container, unmount } = render(<HubSection group={group} index={index} />)
      const [textCol, frameCol] = container.firstElementChild?.children ?? []
      if (index % 2 === 1) {
        expect(textCol).toHaveClass('lg:order-2')
        expect(frameCol).toHaveClass('lg:order-1')
      } else {
        expect(textCol?.className).not.toContain('lg:order')
        expect(frameCol?.className).not.toContain('lg:order')
      }
      unmount()
    }
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
