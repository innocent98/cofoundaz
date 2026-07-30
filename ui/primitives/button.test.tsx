import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Start free</Button>)
    expect(screen.getByRole('button', { name: 'Start free' })).toBeInTheDocument()
  })

  it('renders a link when href is provided', () => {
    render(<Button href="/signup">Start free</Button>)
    const link = screen.getByRole('link', { name: 'Start free' })
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('forwards arbitrary anchor props through the link branch', () => {
    // Regression: a caller must be able to pass onClick / aria-* / data-* alongside
    // href — a later task fires analytics from onClick on href-only CTAs.
    render(
      <Button href="/signup" data-testid="cta" aria-current="page">
        Start free
      </Button>
    )
    const link = screen.getByTestId('cta')
    expect(link).toHaveAttribute('href', '/signup')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('applies brass background and dark text for the accent variant', () => {
    render(<Button variant="accent">Start free</Button>)
    const el = screen.getByRole('button', { name: 'Start free' })
    expect(el.className).toContain('bg-brass-600')
    expect(el.className).toContain('text-green-900')
  })

  it('defaults to the secondary variant', () => {
    render(<Button>See how it works</Button>)
    expect(screen.getByRole('button').className).toContain('bg-white')
  })

  it('forwards native button attributes', () => {
    render(<Button type="submit" disabled>Send message</Button>)
    const el = screen.getByRole('button', { name: 'Send message' })
    expect(el).toHaveAttribute('type', 'submit')
    expect(el).toBeDisabled()
  })

  it('lets a caller className win a genuine conflict with a variant class', () => {
    // Unlike a non-conflicting class (e.g. w-full), bg-green-700 conflicts with
    // the accent variant's own bg-brass-600 — this exercises cn()'s twMerge
    // precedence, not just presence of the caller's class.
    render(
      <Button variant="accent" className="bg-green-700">
        Create account
      </Button>
    )
    const el = screen.getByRole('button')
    expect(el.className).toContain('bg-green-700')
    expect(el.className).not.toContain('bg-brass-600')
  })
})
