import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const css = readFileSync(path.join(root, 'app/globals.css'), 'utf8')

const TOKENS: Record<string, string> = {
  'color-green-950': '#0B1F17', 'color-green-900': '#12291F',
  'color-green-800': '#183B2C', 'color-green-700': '#1E4D3B',
  'color-green-600': '#266049', 'color-green-500': '#2E7256',
  'color-green-400': '#4E8F73', 'color-green-300': '#7FB09A',
  'color-green-200': '#B3D0C3', 'color-green-100': '#E3EFE9',
  'color-green-50': '#F2F7F4',
  'color-copper-700': '#8A5330', 'color-copper-600': '#9C5B34',
  'color-copper-500': '#D89A6E', 'color-copper-200': '#EAD5C6',
  'color-copper-100': '#F6EAE1',
  'color-sage-900': '#171C1A', 'color-sage-700': '#3A423E',
  'color-sage-500': '#67716C', 'color-sage-300': '#C3CCC7',
  'color-sage-100': '#F4F6F5',
  'color-red-600': '#B0483B', 'color-red-100': '#F6E5E2',
}

describe('design tokens', () => {
  it.each(Object.entries(TOKENS))('defines --%s as %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`--${name}:\\s*${hex};`, 'i'))
  })

  it('clears every Tailwind default namespace it replaces', () => {
    // `--color-*: initial` is the line that makes `bg-blue-500` refuse to
    // compile at all; without it the whole "exactly two colors" rule is
    // unenforceable. The other four are what make `rounded-lg`, `shadow-md`,
    // `font-sans`, and `sm:` silently render nothing.
    for (const namespace of ['color', 'breakpoint', 'font', 'radius', 'shadow']) {
      expect(css, `--${namespace}-*: initial must be present`).toMatch(
        new RegExp(`--${namespace}-\\*:\\s*initial;`)
      )
    }
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

  it('sets the copper focus ring at 2px with 2px offset', () => {
    expect(css).toMatch(/outline:\s*2px solid var\(--color-copper-600\)/)
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

/**
 * Cleared-namespace guard.
 *
 * `app/globals.css` sets `--color-*`, `--breakpoint-*`, `--font-*`,
 * `--radius-*` and `--shadow-*` to `initial`, so a class in one of those
 * namespaces that isn't a PRD token compiles to *nothing* — the element
 * renders silently unstyled. Typecheck, ESLint, the unit tests and
 * `next build` are all blind to it, and the defect shipped four separate
 * times during this build. This is the only thing that catches it.
 */
describe('cleared Tailwind namespaces are never referenced in source', () => {
  const SCAN_DIRS = ['app', 'ui', 'lib', 'content']

  /** Shades that actually exist on each PRD ramp. Anything else compiles to nothing. */
  const RAMP_SHADES: Record<string, readonly string[]> = {
    green: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    copper: ['100', '200', '500', '600', '700', '800', '900'],
    sage: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    red: ['50', '100', '200', '600', '700', '800'],
  }

  const COLOR_UTILITIES = [
    'bg', 'text', 'border', 'ring', 'outline', 'fill', 'stroke', 'from', 'via', 'to',
    'decoration', 'accent', 'caret', 'divide', 'placeholder', 'shadow',
  ]
  const utility = `(?:${COLOR_UTILITIES.join('|')})`

  /** Default palettes that `--color-*: initial` deletes outright. */
  const DEAD_PALETTES = [
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'orange', 'amber', 'yellow', 'lime',
    'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose',
  ]

  function walk(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        out.push(...walk(full))
        continue
      }
      if (!/\.tsx?$/.test(entry.name)) continue
      // Test files are skipped: this guard's own source necessarily contains
      // the fragments it hunts for, and no test file is ever rendered.
      if (/\.test\.tsx?$/.test(entry.name)) continue
      out.push(full)
    }
    return out
  }

  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(root, dir)))

  function scan(pattern: RegExp, keep: (match: RegExpMatchArray) => boolean = () => true) {
    const hits: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        for (const match of line.matchAll(pattern)) {
          if (keep(match)) hits.push(`${path.relative(root, file)}:${i + 1}  ${match[0]}`)
        }
      })
    }
    return hits
  }

  it('scans the whole source tree', () => {
    expect(files.length).toBeGreaterThan(40)
  })

  it('never uses a cleared radius (only rounded-input/card/modal/pill/full and rounded-[Npx] compile)', () => {
    expect(scan(/\brounded-(?:sm|md|lg|xl|2xl|3xl|4xl)\b/g)).toEqual([])
  })

  it('never uses a cleared shadow (only shadow-card/raised/accent compile)', () => {
    expect(scan(/\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)\b/g)).toEqual([])
  })

  it('never uses a cleared font family (only font-display and font-body compile)', () => {
    expect(scan(/\bfont-(?:sans|serif|mono)\b/g)).toEqual([])
  })

  it('never uses an sm: prefix (there is no sm: — base styles ARE the small-screen design)', () => {
    // The lookahead is what separates a Tailwind variant (`sm:px-4`, no space,
    // utility follows) from an object key that happens to be named `sm`
    // (`sm: 'px-4 py-2'` in Button's SIZES record — the component's own size
    // prop, nothing to do with breakpoints).
    expect(scan(/\bsm:(?=[a-z[!-])/g)).toEqual([])
  })

  it('never uses a deleted default palette', () => {
    expect(scan(new RegExp(`\\b${utility}-(?:${DEAD_PALETTES.join('|')})-\\d{2,3}\\b`, 'g'))).toEqual([])
  })

  it('never uses a shade that does not exist on a PRD ramp', () => {
    const pattern = new RegExp(`\\b${utility}-(green|copper|sage|red)-(\\d{2,3})\\b`, 'g')
    expect(scan(pattern, (m) => !RAMP_SHADES[m[1]].includes(m[2]))).toEqual([])
  })
})
