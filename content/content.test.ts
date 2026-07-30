import { describe, expect, it } from 'vitest'
import { home } from './home'
import { product } from './product'
import { pricing } from './pricing'
import { about } from './about'
import { legalDocuments } from './legal'
import { headerLinks, footerColumns } from './nav'

describe('home content', () => {
  it('uses the comp hero copy verbatim', () => {
    expect(home.hero.title).toBe('The co-founder who never sleeps.')
    expect(home.hero.subtitle).toBe(
      'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.'
    )
    expect(home.hero.trustLine).toBe('No credit card required.')
  })

  it('has 8 feature tiles, 3 problems, 3 steps, 3 testimonials, 4 security items', () => {
    expect(home.features.items).toHaveLength(8)
    expect(home.problem.cards).toHaveLength(3)
    expect(home.howItWorks.steps).toHaveLength(3)
    expect(home.testimonials.quotes).toHaveLength(3)
    expect(home.security.items).toHaveLength(4)
  })
})

describe('product content', () => {
  it('has 5 hub groups with unique anchors and AppFrame variants', () => {
    expect(product.hubGroups).toHaveLength(5)
    expect(product.hubGroups.map((g) => g.anchor)).toEqual([
      'p-overview', 'p-build', 'p-grow', 'p-fund', 'p-resources',
    ])
    expect(product.hubGroups.map((g) => g.variant)).toEqual([
      'overview', 'build', 'grow', 'fund', 'resources',
    ])
  })

  it('gives every hub group exactly 3 items', () => {
    for (const group of product.hubGroups) {
      expect(group.items).toHaveLength(3)
    }
  })
})

describe('pricing content', () => {
  it('has 3 plans with Growth marked most popular', () => {
    expect(pricing.plans.map((p) => p.name)).toEqual(['Starter', 'Growth', 'Scale'])
    expect(pricing.plans.filter((p) => p.popular)).toHaveLength(1)
    expect(pricing.plans.find((p) => p.popular)?.name).toBe('Growth')
  })

  it('leaves Growth and Scale prices unset — PRD §3.3 says TBD by business', () => {
    const byName = Object.fromEntries(pricing.plans.map((p) => [p.name, p]))
    expect(byName.Starter.price).toBe('Free')
    expect(byName.Growth.price).toBeNull()
    expect(byName.Scale.price).toBeNull()
  })

  it('has a 4-section comparison matrix where every row covers all three plans', () => {
    expect(pricing.matrix).toHaveLength(4)
    for (const section of pricing.matrix) {
      for (const row of section.rows) {
        expect(row.starter).toBeDefined()
        expect(row.growth).toBeDefined()
        expect(row.scale).toBeDefined()
      }
    }
  })

  it('has the 6 FAQ items from PRD §3.3', () => {
    expect(pricing.faq).toHaveLength(6)
    expect(pricing.faq[0].question).toBe('What counts as an AI credit?')
    expect(pricing.faq[3].answer).toBe(
      'No. Your workspace data is never used to train models.'
    )
  })
})

describe('about content', () => {
  it('has 4 story entries, 4 values, 6 team members, 3 stats', () => {
    expect(about.story).toHaveLength(4)
    expect(about.values).toHaveLength(4)
    expect(about.team).toHaveLength(6)
    expect(about.stats).toHaveLength(3)
  })
})

describe('legal content', () => {
  it('defines all four documents with a last-updated stamp', () => {
    const keys = ['terms', 'privacy', 'security', 'cookies'] as const
    for (const key of keys) {
      const doc = legalDocuments[key]
      expect(doc.title).toBeTruthy()
      expect(doc.updated).toBe('July 1, 2026')
      expect(doc.sections.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('navigation', () => {
  it('omits Blog and Help Center while those pages are out of scope', () => {
    const allHrefs = [
      ...headerLinks.map((l) => l.href),
      ...footerColumns.flatMap((c) => c.links.map((l) => l.href)),
    ]
    expect(allHrefs).not.toContain('/blog')
    expect(allHrefs).not.toContain('/help')
  })

  it('links only to routes that exist', () => {
    const shipped = [
      '/', '/product', '/pricing', '/about', '/contact',
      '/terms', '/privacy', '/security', '/cookies', '/login', '/signup',
    ]
    const allHrefs = [
      ...headerLinks.map((l) => l.href),
      ...footerColumns.flatMap((c) => c.links.map((l) => l.href)),
    ]
    for (const href of allHrefs) {
      expect(shipped).toContain(href)
    }
  })
})

describe('copy house style', () => {
  it('never uses em-dashes or en-dashes, matching the comp', () => {
    const allCopy = JSON.stringify([home, product, pricing, about, legalDocuments])
    expect(allCopy).not.toMatch(/[—–]/)
  })
})
