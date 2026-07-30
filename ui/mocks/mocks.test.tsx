import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductShot } from './product-shot'
import { AppFrame } from './app-frame'

describe('ProductShot', () => {
  it('is hidden from assistive tech as decorative product imagery', () => {
    const { container } = render(<ProductShot />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the mock dashboard content', () => {
    render(<ProductShot />)
    expect(screen.getByText('Good morning, Amara.')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
  })
})

describe('AppFrame', () => {
  it.each(['overview', 'build', 'grow', 'fund', 'resources'] as const)(
    'renders the %s variant without crashing',
    (variant) => {
      const { container } = render(<AppFrame variant={variant} />)
      expect(container.firstChild).toBeTruthy()
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    }
  )
})
