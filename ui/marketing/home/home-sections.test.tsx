import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Hero } from './hero'
import { ProblemStrip } from './problem-strip'
import { HowItWorks } from './how-it-works'
import { FeatureGrid } from './feature-grid'
import { SecurityStrip } from './security-strip'
import { CtaBand } from './cta-band'
import { home } from '@/content/home'

describe('Hero', () => {
  it('renders the single h1 with the comp headline', () => {
    render(<Hero />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'The co-founder who never sleeps.' })
    ).toBeInTheDocument()
  })

  it('links the primary CTA to signup and the secondary to the how-it-works anchor', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#how')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Hero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ProblemStrip', () => {
  it('renders all three problem cards', () => {
    render(<ProblemStrip />)
    for (const card of home.problem.cards) {
      expect(screen.getByRole('heading', { name: card.title })).toBeInTheDocument()
    }
  })

  it('hides decorative glyphs from assistive tech', () => {
    const { container } = render(<ProblemStrip />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('HowItWorks', () => {
  it('exposes the #how anchor targeted by the hero CTA', () => {
    const { container } = render(<HowItWorks />)
    expect(container.querySelector('#how')).toBeInTheDocument()
  })

  it('renders all three steps', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('heading', { name: 'Tell us about your startup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Do today’s mission' })).toBeInTheDocument()
  })
})

describe('FeatureGrid', () => {
  it('renders all eight tiles', () => {
    render(<FeatureGrid />)
    for (const tile of home.features.items) {
      expect(screen.getByRole('heading', { name: tile.title })).toBeInTheDocument()
    }
  })
})

describe('SecurityStrip', () => {
  it('renders the four security items', () => {
    render(<SecurityStrip />)
    for (const item of home.security.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })
})

describe('CtaBand', () => {
  it('renders the title, CTA, and subtitle', () => {
    render(<CtaBand title="Stop guessing. Start building." ctaLabel="Start free" ctaHref="/signup" subtitle="Set up in under 10 minutes." />)
    expect(screen.getByRole('heading', { name: 'Stop guessing. Start building.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
    expect(screen.getByText('Set up in under 10 minutes.')).toBeInTheDocument()
  })
})
