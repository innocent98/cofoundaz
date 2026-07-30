import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollSpyNav } from './scroll-spy-nav'
import { product } from '@/content/product'

beforeEach(() => {
  // jsdom has no IntersectionObserver; the component must still render usable links.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  )
})

describe('ScrollSpyNav', () => {
  it('renders one real anchor link per hub group so it works without JS', () => {
    render(<ScrollSpyNav />)
    for (const item of product.subNav) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        `#${item.anchor}`
      )
    }
  })

  it('labels itself for assistive tech', () => {
    render(<ScrollSpyNav />)
    expect(screen.getByRole('navigation', { name: /sections/i })).toBeInTheDocument()
  })
})
