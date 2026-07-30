import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestimonialCarousel } from './testimonial-carousel'
import { home } from '@/content/home'

function mockReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('TestimonialCarousel', () => {
  beforeEach(() => mockReducedMotion(false))

  it('shows the first quote initially', () => {
    render(<TestimonialCarousel />)
    expect(screen.getByText(new RegExp(home.testimonials.quotes[0].name))).toBeInTheDocument()
  })

  it('announces quote changes politely', () => {
    const { container } = render(<TestimonialCarousel />)
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('advances when a dot is activated', async () => {
    const user = userEvent.setup()
    render(<TestimonialCarousel />)
    await user.click(screen.getByRole('button', { name: /quote 2/i }))
    expect(screen.getByText(new RegExp(home.testimonials.quotes[1].name))).toBeInTheDocument()
  })

  it('marks the active dot with aria-current', async () => {
    const user = userEvent.setup()
    render(<TestimonialCarousel />)
    await user.click(screen.getByRole('button', { name: /quote 3/i }))
    expect(screen.getByRole('button', { name: /quote 3/i })).toHaveAttribute('aria-current', 'true')
  })

  it('auto-advances every 6 seconds when motion is allowed', () => {
    vi.useFakeTimers()
    render(<TestimonialCarousel />)
    vi.advanceTimersByTime(6000)
    expect(screen.getByText(new RegExp(home.testimonials.quotes[1].name))).toBeInTheDocument()
  })

  it('never auto-advances under prefers-reduced-motion (deviation D-2)', () => {
    mockReducedMotion(true)
    vi.useFakeTimers()
    render(<TestimonialCarousel />)
    vi.advanceTimersByTime(30000)
    expect(screen.getByText(new RegExp(home.testimonials.quotes[0].name))).toBeInTheDocument()
  })
})
