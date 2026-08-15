import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductShot } from './product-shot'
import { AppFrame, type AppFrameVariant } from './app-frame'

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

// One string unique to each variant's ported panel — verified against
// ui/mocks/app-frame.tsx to not appear in any of the other four panels'
// rendered output.
const VARIANT_MARKERS: Record<AppFrameVariant, string> = {
  overview: 'Good morning, Amara.',
  build: 'Business Model Canvas',
  grow: 'Pipeline',
  fund: 'Pre-seed round',
  resources: 'Marketplace',
}

const VARIANTS = Object.keys(VARIANT_MARKERS) as AppFrameVariant[]

describe('AppFrame', () => {
  it.each(VARIANTS)('renders the %s variant without crashing', (variant) => {
    const { container } = render(<AppFrame variant={variant} />)
    expect(container.firstChild).toBeTruthy()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it.each(VARIANTS)(
    "renders the %s variant's own content and none of the other variants'",
    (variant) => {
      const { container } = render(<AppFrame variant={variant} />)
      const text = container.textContent ?? ''

      expect(text).toContain(VARIANT_MARKERS[variant])

      for (const otherVariant of VARIANTS) {
        if (otherVariant === variant) continue
        expect(text).not.toContain(VARIANT_MARKERS[otherVariant])
      }
    }
  )
})
