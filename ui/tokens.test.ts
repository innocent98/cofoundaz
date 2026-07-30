import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')

const TOKENS: Record<string, string> = {
  'color-green-950': '#0B1F17', 'color-green-900': '#12291F',
  'color-green-800': '#183B2C', 'color-green-700': '#1E4D3B',
  'color-green-600': '#266049', 'color-green-500': '#2E7256',
  'color-green-400': '#4E8F73', 'color-green-300': '#7FB09A',
  'color-green-200': '#B3D0C3', 'color-green-100': '#E3EFE9',
  'color-green-50': '#F2F7F4',
  'color-brass-700': '#8A6E33', 'color-brass-600': '#A8894B',
  'color-brass-500': '#BDA05F', 'color-brass-200': '#E9DDBE',
  'color-brass-100': '#F5EEDC',
  'color-sage-900': '#171C1A', 'color-sage-700': '#3A423E',
  'color-sage-500': '#67716C', 'color-sage-300': '#C3CCC7',
  'color-sage-100': '#F4F6F5',
  'color-red-600': '#B0483B', 'color-red-100': '#F6E5E2',
}

describe('design tokens', () => {
  it.each(Object.entries(TOKENS))('defines --%s as %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`--${name}:\\s*${hex};`, 'i'))
  })

  it('overrides breakpoints to the PRD scale', () => {
    expect(css).toMatch(/--breakpoint-\*:\s*initial;/)
    expect(css).toMatch(/--breakpoint-md:\s*640px;/)
    expect(css).toMatch(/--breakpoint-lg:\s*1024px;/)
    expect(css).toMatch(/--breakpoint-xl:\s*1440px;/)
  })

  it('maps font tokens to the next/font CSS variables', () => {
    expect(css).toMatch(/--font-display:\s*var\(--font-spectral\)/)
    expect(css).toMatch(/--font-body:\s*var\(--font-hanken\)/)
  })

  it('sets the brass focus ring at 2px with 2px offset', () => {
    expect(css).toMatch(/outline:\s*2px solid var\(--color-brass-600\)/)
    expect(css).toMatch(/outline-offset:\s*2px/)
  })

  it('disables all motion under prefers-reduced-motion (deviation D-2)', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
  })

  it('has no leftover create-next-app dark-mode scaffold', () => {
    expect(css).not.toMatch(/prefers-color-scheme/)
    expect(css).not.toMatch(/--font-geist/)
  })
})
