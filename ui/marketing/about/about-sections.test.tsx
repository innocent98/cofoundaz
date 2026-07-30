import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { WhySection } from './why-section'
import { StoryTimeline } from './story-timeline'
import { ValuesGrid } from './values-grid'
import { TeamGrid } from './team-grid'
import AboutPage from '@/app/(marketing)/about/page'
import { about } from '@/content/about'

describe('WhySection', () => {
  it('renders every paragraph and every stat', () => {
    render(<WhySection />)
    expect(screen.getByRole('heading', { name: about.why.title })).toBeInTheDocument()
    for (const paragraph of about.why.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    }
    for (const stat of about.stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument()
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
  })
})

describe('StoryTimeline', () => {
  it('renders an ordered list of the four entries', () => {
    render(<StoryTimeline />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(about.story.length)
    for (const entry of about.story) {
      expect(screen.getByRole('heading', { name: entry.title })).toBeInTheDocument()
    }
  })
})

describe('ValuesGrid', () => {
  it('renders all four values', () => {
    render(<ValuesGrid />)
    for (const value of about.values) {
      expect(screen.getByRole('heading', { name: value.title })).toBeInTheDocument()
    }
  })
})

describe('TeamGrid', () => {
  it('renders all six members and the hiring CTA', () => {
    render(<TeamGrid />)
    for (const member of about.team) {
      expect(screen.getByText(member.name)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '/contact')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TeamGrid />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AboutPage', () => {
  it('renders the hero as the sole h1', () => {
    const { container } = render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: about.hero.title })).toBeInTheDocument()
    expect(screen.getByText(about.hero.eyebrow)).toBeInTheDocument()
    expect(screen.getByText(about.hero.subtitle)).toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('renders the mission quote', () => {
    render(<AboutPage />)
    expect(screen.getByText(about.missionQuote)).toBeInTheDocument()
  })

  it('renders the backers title and every backer name', () => {
    render(<AboutPage />)
    expect(screen.getByText(about.backers.title)).toBeInTheDocument()
    for (const name of about.backers.names) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders the final CTA title and both button labels', () => {
    const { container } = render(<AboutPage />)
    // Scoped to the final-CTA section: its secondary label ("See open roles")
    // is shared with the hiring band above it, so an unscoped query is ambiguous.
    const finalCta = within(container.lastElementChild as HTMLElement)
    expect(screen.getByRole('heading', { name: about.finalCta.title })).toBeInTheDocument()
    expect(finalCta.getByRole('link', { name: about.finalCta.primaryCta.label })).toHaveAttribute(
      'href',
      about.finalCta.primaryCta.href
    )
    expect(finalCta.getByRole('link', { name: about.finalCta.secondaryCta.label })).toHaveAttribute(
      'href',
      about.finalCta.secondaryCta.href
    )
  })

  it('renders exactly one accent (brass) button on the whole page', () => {
    const { container } = render(<AboutPage />)
    expect(container.querySelectorAll('.bg-brass-600')).toHaveLength(1)
  })
})
