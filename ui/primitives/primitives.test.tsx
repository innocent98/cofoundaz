import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge, Card, Container, SectionHeading } from './index'

describe('Card', () => {
  it('renders children inside a bordered surface', () => {
    render(<Card>Scattered everywhere</Card>)
    const el = screen.getByText('Scattered everywhere')
    expect(el.className).toContain('rounded-card')
    expect(el.className).toContain('border-green-100')
  })
})

describe('Badge', () => {
  it('renders the accent tone on brass', () => {
    render(<Badge tone="accent">Most popular</Badge>)
    expect(screen.getByText('Most popular').className).toContain('bg-brass-600')
  })
})

describe('Container', () => {
  it('constrains to 1280px by default', () => {
    render(<Container>content</Container>)
    expect(screen.getByText('content').className).toContain('max-w-[1280px]')
  })

  it('constrains to 760px for prose', () => {
    render(<Container width="prose">content</Container>)
    expect(screen.getByText('content').className).toContain('max-w-[760px]')
  })
})

describe('SectionHeading', () => {
  it('renders an h2 by default', () => {
    render(<SectionHeading title="One workspace. One score. One next step." />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'One workspace. One score. One next step.' })
    ).toBeInTheDocument()
  })

  it('renders an h1 when asked', () => {
    render(<SectionHeading as="h1" title="Simple plans that grow with you." />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('uses AA-safe brass-700 for the eyebrow on light surfaces (deviation D-1)', () => {
    render(<SectionHeading eyebrow="Pricing" title="Simple plans that grow with you." />)
    expect(screen.getByText('Pricing').className).toContain('text-brass-700')
  })

  it('uses brass-500 for the eyebrow on dark surfaces', () => {
    render(<SectionHeading tone="dark" eyebrow="How it works" title="One workspace." />)
    expect(screen.getByText('How it works').className).toContain('text-brass-500')
  })
})
