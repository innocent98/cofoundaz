import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestimonialCarousel } from './testimonial-carousel'
import { home } from '@/content/home'

const quotes = home.testimonials.quotes

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

/**
 * Whether quote `i` is the one on screen, by author name. Scoped to the quote
 * region so it can't be satisfied by the sr-only announcement, which repeats
 * the same text.
 */
function showing(i: number) {
  const region = document.querySelector('[data-carousel-quote]') as HTMLElement
  return within(region).queryByText(quotes[i].name) !== null
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('TestimonialCarousel', () => {
  beforeEach(() => mockReducedMotion(false))

  it('shows the first quote initially', () => {
    render(<TestimonialCarousel />)
    expect(showing(0)).toBe(true)
  })

  it('advances when a dot is activated', async () => {
    const user = userEvent.setup()
    render(<TestimonialCarousel />)
    await user.click(screen.getByRole('button', { name: /show quote 2/i }))
    expect(showing(1)).toBe(true)
  })

  it('marks the active dot with aria-current', async () => {
    const user = userEvent.setup()
    render(<TestimonialCarousel />)
    await user.click(screen.getByRole('button', { name: /show quote 3/i }))
    expect(screen.getByRole('button', { name: /show quote 3/i })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })



  it('auto-advances every 6 seconds when motion is allowed', () => {
    vi.useFakeTimers()
    render(<TestimonialCarousel />)
    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(showing(1)).toBe(true)
  })

  it('never auto-advances under prefers-reduced-motion (deviation D-2)', () => {
    mockReducedMotion(true)
    vi.useFakeTimers()
    render(<TestimonialCarousel />)
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(showing(0)).toBe(true)
  })



  it('restarts the 6 second dwell on any manual selection', () => {
    vi.useFakeTimers()
    render(<TestimonialCarousel />)

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    // Re-selects the quote already on screen: the index does not change, but
    // the dwell must still restart, so the pending 2s remainder is discarded.
    fireEvent.click(screen.getByRole('button', { name: /show quote 1/i }))
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(showing(0)).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(showing(1)).toBe(true)
  })

  it('does not make the auto-rotating quote a live region', () => {
    const { container } = render(<TestimonialCarousel />)
    const quoteRegion = container.querySelector('[data-carousel-quote]')
    expect(quoteRegion).not.toBeNull()
    expect(quoteRegion).not.toHaveAttribute('aria-live')
    expect(quoteRegion!.querySelector('[aria-live]')).toBeNull()
  })

  it('announces only user-initiated quote changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestimonialCarousel />)
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('')

    await user.click(screen.getByRole('button', { name: /show quote 2/i }))
    expect(live.textContent).toContain(quotes[1].text)
    expect(live.textContent).toContain(quotes[1].name)
  })

  it('announces nothing when the rotation advances on its own', () => {
    vi.useFakeTimers()
    const { container } = render(<TestimonialCarousel />)
    act(() => {
      vi.advanceTimersByTime(18000)
    })
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('')
  })
})
