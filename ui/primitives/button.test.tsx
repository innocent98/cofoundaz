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

  it('merges a caller className over variant classes', () => {
    render(<Button className="w-full">Create account</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })
})
