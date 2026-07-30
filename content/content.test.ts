import { describe, expect, it } from 'vitest'
import { home } from './home'
import { product } from './product'
import { pricing } from './pricing'
import { about } from './about'
import { legalDocuments } from './legal'
import {
  headerLinks,
  headerCtas,
  footerTagline,
  footerColumns,
  copyright,
} from './nav'
import { contact } from './contact'
import { authModes, authShared, authPanel } from './auth'
import { common } from './strings/common'

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

  it('never attributes a testimonial to someone on the team', () => {
    // Live, that reads as the same person being both a customer and staff.
    const team = new Set(about.team.map((member) => member.name))
    for (const quote of home.testimonials.quotes) {
      expect(team.has(quote.name), `${quote.name} is both a customer and staff`).toBe(false)
    }
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

  it('carries the counsel disclaimer on every document, security included', () => {
    // /security shipped without it, and it is the page making unqualified
    // factual claims (OWASP ASVS L2, annual pen test, SOC 2 providers, 30-day
    // PITR) for a product with no backend yet.
    const keys = ['terms', 'privacy', 'security', 'cookies'] as const
    for (const key of keys) {
      expect(legalDocuments[key].intro).toContain(
        'This is a v1 layout; final language is provided by counsel.'
      )
    }
  })
})

describe('contact content', () => {
  it('has the topic options and success copy from the brief', () => {
    expect(contact.fields.topic.options).toEqual([
      'Sales', 'Support', 'Partnerships', 'Press',
    ])
    expect(contact.success).toBe(
      'Thanks, we’ll get back to you within one business day.'
    )
  })
})

describe('auth content', () => {
  it('has the signup and login copy from the brief, including the deliberate passwordHelp asymmetry', () => {
    expect(authModes.signup.title).toBe('Create your workspace')
    expect(authModes.signup.cta).toBe('Create account')
    expect(authModes.signup.footerLink.href).toBe('/login')
    expect(authModes.signup.passwordHelp).toBe('8+ characters, one number')

    expect(authModes.login.title).toBe('Welcome back')
    expect(authModes.login.cta).toBe('Log in')
    expect(authModes.login.footerLink.href).toBe('/signup')
    expect(authModes.login.passwordHelp).toBeNull()
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
    // `common.genericError` is the one deliberate exception: it is app copy for
    // the authenticated product (PRD shared strings), not marketing copy, and
    // its em-dash is verbatim from the PRD. Excluding that single field rather
    // than the whole module keeps the other six strings under the guard.
    const { genericError, ...commonMarketingSafe } = common
    expect(genericError).toMatch(/—/)

    const allCopy = JSON.stringify([
      home,
      product,
      pricing,
      about,
      legalDocuments,
      headerLinks,
      headerCtas,
      footerTagline,
      footerColumns,
      copyright,
      contact,
      authModes,
      authShared,
      authPanel,
      commonMarketingSafe,
    ])
    expect(allCopy).not.toMatch(/[—–]/)
  })
})
