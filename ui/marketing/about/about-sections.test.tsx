import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { WhySection } from './why-section'
import { StoryTimeline } from './story-timeline'
import { ValuesGrid } from './values-grid'
import { TeamGrid } from './team-grid'
import { about } from '@/content/about'

describe('WhySection', () => {
  it('renders both paragraphs and the three stats', () => {
    render(<WhySection />)
    expect(screen.getByRole('heading', { name: about.why.title })).toBeInTheDocument()
    expect(screen.getByText(about.why.paragraphs[0])).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
  })
})

describe('StoryTimeline', () => {
  it('renders an ordered list of the four entries', () => {
    render(<StoryTimeline />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(about.story.length)
    expect(screen.getByRole('heading', { name: 'A frustrating pattern' })).toBeInTheDocument()
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
