import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const globalsCss = readFileSync(path.join(root, 'app/globals.css'), 'utf8')
// Colour (and shadow) tokens live in their own file — the only place a colour literal may exist.
const colourCss = readFileSync(path.join(root, 'styles/colour-tokens.css'), 'utf8')
const css = `${globalsCss}\n${colourCss}`

const TOKENS: Record<string, string> = {
  'color-brand-950': '#051736', 'color-brand-900': '#072454',
  'color-brand-800': '#0A367F', 'color-brand-700': '#0D4FBC',
  'color-brand-600': '#0263F4', 'color-brand-500': '#0F6AFC',
  'color-brand-400': '#4F8FFA', 'color-brand-300': '#9CC2FF',
  'color-brand-200': '#C8DEFF', 'color-brand-100': '#E8F1FF',
  'color-brand-50': '#F6FAFF', 'color-neutral-900': '#181B20',
  'color-neutral-700': '#3B4048', 'color-neutral-500': '#686F79',
  'color-neutral-300': '#C4CAD4', 'color-neutral-100': '#F4F6F8',
  'color-danger-600': '#B0483B', 'color-danger-100': '#F6E5E2',
  'color-warning': '#9C5B34', 'color-ink': '#051736',
  'color-info': '#0E7490', 'color-success-text': '#137333',
  'color-success-50': '#EAF6EE', 'color-success-100': '#D4EDDC', 'color-success-500': '#1E9E50',
  'color-success-700': '#137333', 'color-success-800': '#0E5A28',
  'color-warning-50': '#FBF1EA', 'color-warning-100': '#F6E5D8', 'color-warning-500': '#C27A3E',
  'color-warning-700': '#9C5B34', 'color-warning-800': '#7A4526',
  'color-info-50': '#E3F4F8', 'color-info-700': '#0E7490',
}

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('semantic state tokens', () => {
  // text shade on white and on its own tints needs 4.5:1; the -500 graphic fill needs 3:1 on white
  const cases: Array<[string, string, number]> = [
    ['#137333', '#FFFFFF', 4.5], ['#137333', '#EAF6EE', 4.5], ['#0E5A28', '#D4EDDC', 4.5],
    ['#9C5B34', '#FFFFFF', 4.5], ['#9C5B34', '#FBF1EA', 4.5], ['#7A4526', '#F6E5D8', 4.5],
    ['#1E9E50', '#FFFFFF', 3], ['#C27A3E', '#FFFFFF', 3],
  ]
  it.each(cases)('%s on %s is at least %s:1', (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min)
  })
})

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

  it('keeps the accent ramp as aliases of the brand ramp (copper retired from UI chrome)', () => {
    expect(css).toMatch(/--color-accent-600:\s*var\(--color-brand-600\)/)
  })

  it('sets the brand-blue focus ring at 2px with 2px offset', () => {
    expect(css).toMatch(/outline:\s*2px solid var\(--color-focus\)/)
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
    brand: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    accent: ['100', '200', '500', '600', '700', '800', '900'],
    neutral: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    danger: ['50', '100', '200', '600', '700', '800'],
  }

  const COLOR_UTILITIES = [
    'bg', 'text', 'border', 'ring', 'outline', 'fill', 'stroke', 'from', 'via', 'to',
    'decoration', 'accent', 'caret', 'divide', 'placeholder', 'shadow',
  ]
  const utility = `(?:${COLOR_UTILITIES.join('|')})`

  /** Default palettes that `--color-*: initial` deletes outright. */
  const DEAD_PALETTES = [
    'slate', 'gray', 'zinc', 'stone', 'orange', 'amber', 'yellow', 'lime',
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
    const pattern = new RegExp(`\\b${utility}-(brand|accent|neutral|danger)-(\\d{2,3})\\b`, 'g')
    expect(scan(pattern, (m) => !RAMP_SHADES[m[1]].includes(m[2]))).toEqual([])
  })
})

/**
 * Colour-literal guard (D38).
 *
 * Every colour is a token defined in `styles/colour-tokens.css`; that file is the only
 * place a hex / rgb() / hsl() may appear, so the brand can be changed in one file.
 * A line that genuinely cannot use a token (canvas, Satori, a standalone print window)
 * carries a `colour-ok: <reason>` comment; a whole file can opt out with a
 * `colour-ok-file: <reason>` comment. Mirrored by scripts/precommit-checks.mjs.
 */
describe('no hard-coded colours outside styles/colour-tokens.css', () => {
  const DIRS = ['app', 'components', 'hooks', 'lib', 'ui', 'styles', 'content', 'types']
  const LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9A-Za-z_-])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g

  function walk(dir: string): string[] {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return []
    }
    return entries.flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      if (!/\.(tsx?|css)$/.test(entry.name) || /\.(test|spec)\.tsx?$/.test(entry.name)) return []
      return [full]
    })
  }

  it('finds no colour literal outside the token file', () => {
    const hits: string[] = []
    for (const file of DIRS.flatMap((d) => walk(path.join(root, d)))) {
      const rel = path.relative(root, file)
      if (rel === 'styles/colour-tokens.css') continue
      const text = readFileSync(file, 'utf8')
      if (text.includes('colour-ok-file')) continue
      text.split('\n').forEach((line, i) => {
        if (line.includes('colour-ok')) return
        for (const m of line.matchAll(LITERAL)) hits.push(`${rel}:${i + 1}  ${m[0]}`)
      })
    }
    expect(hits).toEqual([])
  })
})
