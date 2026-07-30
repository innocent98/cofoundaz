# Cofoundaz Marketing Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 11-route public marketing website for Cofoundaz — statically rendered, at visual parity with the UI comps and copy parity with the Technical PRD, meeting WCAG 2.1 AA.

**Architecture:** Next.js 16 App Router with one root layout and two route groups — `(marketing)` (header + footer) and `(auth)` (split-screen, no chrome). All copy lives in typed modules under `content/`; page components are thin mappers over that data. The design-token layer is Tailwind v4 CSS-first `@theme` in `globals.css`, encoding the PRD's exact colour ramps so token names survive into the markup. Shared UI lives in `ui/`, importing nothing app-specific so it can later be promoted to `packages/ui` with a `git mv`.

**Tech Stack:** Next.js 16.2.12 (Turbopack), React 19.2.4, TypeScript 5, Tailwind CSS 4.3.3, `next/font/google` (Spectral + Hanken Grotesk), Vitest + React Testing Library + jest-axe (component tests), Playwright + `@axe-core/playwright` (route sweep).

**Spec:** `docs/superpowers/specs/2026-07-30-marketing-website-design.md`

---

## Global Constraints

Every task's requirements implicitly include this section.

**Branching**
- Work on a feature branch, not `main`. Before Task 1: `git checkout -b feat/marketing-website`.

**Platform (Next.js 16 — verified against `node_modules/next/dist/docs/`, not training data)**
- Turbopack is the default for `next dev` and `next build`. Never add a `--turbopack` flag.
- `params`, `searchParams`, `cookies`, `headers` are **fully async**. The v15 synchronous fallback is removed.
- `params` and `id` in `opengraph-image` / `icon` are Promises — `await` them.
- `middleware.ts` is deprecated in favour of the `proxy` convention. Not used in this plan.
- `revalidateTag(tag)` now requires a second `cacheLife` argument. Not used in this plan.
- Node 20.9+, TypeScript 5.1+ required. Local is Node 24.13.0.
- **Every one of the 11 routes must render statically.** Never call a request-time API from a marketing route — it silently opts the route into dynamic rendering and breaks the PRD §3 SEO requirement.

**Copy**
- The UI comp `../# Cofoundaz Web App UI Build/Marketing Site.dc.html` is the copy source of truth; the PRD fills gaps.
- The comp deliberately avoids em-dashes and en-dashes. Reproduce strings **exactly**, including punctuation: `"idea to profitability. One connected workspace"`, `"1 to 3"`, `"0 to 100"`, `"Thanks, we'll get back to you within one business day."`
- All copy lives in `content/`. Never hardcode a user-visible string in a component.

**Colour (PRD §1.1 — exact hex values, do not approximate)**
```
green  950 #0B1F17 · 900 #12291F · 800 #183B2C · 700 #1E4D3B · 600 #266049 · 500 #2E7256
       400 #4E8F73 · 300 #7FB09A · 200 #B3D0C3 · 100 #E3EFE9 ·  50 #F2F7F4
brass  700 #8A6E33 · 600 #A8894B · 500 #BDA05F · 200 #E9DDBE · 100 #F5EEDC
sage   900 #171C1A · 700 #3A423E · 500 #67716C · 300 #C3CCC7 · 100 #F4F6F5
red    600 #B0483B · 100 #F6E5E2
```

**Accessibility (non-negotiable — these are the spec's two approved deviations from the comps)**
- **D-1:** `brass-600 #A8894B` on white measures **3.31:1** and fails AA. Use `brass-700 #8A6E33` (**4.84:1**) for **brass text on light surfaces**. `brass-600` remains correct for backgrounds, borders, and the focus ring. Dark text on a brass background (`green-900` on `brass-600`) measures 4.61:1 and passes — brass buttons are unchanged.
- **D-2:** All animation must be disabled under `prefers-reduced-motion: reduce`, and the testimonial carousel must never auto-advance under that query (WCAG 2.2.2).
- Focus ring is `2px solid brass-600` with `2px` offset on every interactive element.
- Decorative glyphs (`◈ ✦ ⟶ ▤ ✓ ₦ ◆ ★ ⚄ § ⚙ 🛡`) carry `aria-hidden="true"`.
- One `<h1>` per route. Every form control has a real `<label>`.

**Breakpoints (PRD §1.1)** — `sm` <640 (base) · `md` 640–1023 · `lg` 1024–1439 · `xl` ≥1440. Tailwind's defaults are overridden to match exactly; base styles are the `sm` design.

**Testing**
- TDD throughout: write the failing test, watch it fail, implement minimally, watch it pass, commit.
- Component tests are Vitest + RTL. Route-level a11y and responsive checks are Playwright (Task 14).
- Page components are async Server Components and cannot be rendered by RTL. **Keep every page a thin composition of non-async section components** so the sections stay unit-testable.

---

## File Structure

| Path | Responsibility |
|---|---|
| `app/globals.css` | Tailwind v4 `@theme` token layer, base element styles, reduced-motion block |
| `app/layout.tsx` | Root layout — `<html>`, fonts as CSS vars, `metadataBase`, title template |
| `app/not-found.tsx` | 404 page |
| `app/sitemap.ts` · `app/robots.ts` | SEO route files |
| `app/opengraph-image.tsx` | Default OG card via `ImageResponse` |
| `app/(marketing)/layout.tsx` | Skip link, `SiteHeader`, `<main>`, `SiteFooter` |
| `app/(marketing)/page.tsx` | Home — composes `ui/marketing` home sections |
| `app/(marketing)/{product,pricing,about,contact}/page.tsx` | One page each |
| `app/(marketing)/(legal)/{terms,privacy,security,cookies}/page.tsx` | Four thin pages over one template |
| `app/(auth)/layout.tsx` | Split-screen shell with `AuthBrandPanel` |
| `app/(auth)/{login,signup}/page.tsx` | Auth shells, unwired |
| `ui/primitives/*` | `Button`, `Card`, `Badge`, `Container`, `SectionHeading`, form controls |
| `ui/marketing/*` | Site chrome + every page section component |
| `ui/mocks/*` | `ProductShot`, `AppFrame` — React ports of the comps' CSS mock screenshots |
| `content/*` | All copy and page data, typed |
| `content/strings/common.ts` | PRD §1.4 shared strings, reused by the app phase |
| `lib/cn.ts` · `lib/seo.ts` · `lib/analytics.ts` | Class merge, metadata/JSON-LD builders, typed no-op tracker |
| `vitest.config.mts` · `vitest.setup.ts` | Component test harness |
| `playwright.config.ts` · `e2e/*` | Route-level a11y and responsive sweep |

---

## Task 1: Test harness, design tokens, fonts, root layout

Establishes everything later tasks build on: a working `npm test`, the complete PRD token layer as real Tailwind utilities, self-hosted brand fonts, and the global reduced-motion guard (deviation D-2).

**Files:**
- Create: `vitest.config.mts`, `vitest.setup.ts`, `lib/cn.ts`, `ui/tokens.test.ts`
- Modify: `package.json`, `app/globals.css`, `app/layout.tsx`
- Delete: nothing

**Interfaces:**
- Consumes: nothing.
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/cn.ts`. CSS custom properties `--color-green-*`, `--color-brass-*`, `--color-sage-*`, `--color-red-*`, `--font-display`, `--font-body`, `--radius-*`, `--shadow-card`, `--shadow-raised`, and breakpoints `--breakpoint-md|lg|xl`. Tailwind utilities `bg-green-700`, `text-sage-700`, `font-display`, `rounded-card`, `shadow-card`, and responsive prefixes `md:` `lg:` `xl:`.

- [ ] **Step 1: Install test and utility dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom jest-axe @types/jest-axe
npm install clsx tailwind-merge
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.mts` (the `.mts` extension is already covered by `tsconfig.json`'s `include`):

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)
```

- [ ] **Step 3: Add test scripts to `package.json`**

Add to the `scripts` block, leaving `dev`, `build`, `start`, `lint` untouched (they are already correct for Turbopack-by-default):

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Write the failing token test**

This test parses the real stylesheet and asserts every PRD §1.1 hex is present. It catches the single most likely defect in this task — a mistyped hex in a 22-value ramp.

Create `ui/tokens.test.ts`:

```ts
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
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run ui/tokens.test.ts`
Expected: FAIL — the current `globals.css` is the create-next-app scaffold, so every token assertion fails and the `prefers-color-scheme` assertion fails.

- [ ] **Step 6: Write the token layer**

Replace the entire contents of `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Clear Tailwind's defaults so only PRD tokens exist. This is what makes
     PRD §1.1's "exactly two colors" rule enforceable — bg-blue-500 will not compile. */
  --color-*: initial;
  --breakpoint-*: initial;
  --font-*: initial;
  --radius-*: initial;
  --shadow-*: initial;

  /* Color 1 — Evergreen (brand, ~90% of colored UI) */
  --color-green-950: #0B1F17;
  --color-green-900: #12291F;
  --color-green-800: #183B2C;
  --color-green-700: #1E4D3B;
  --color-green-600: #266049;
  --color-green-500: #2E7256;
  --color-green-400: #4E8F73;
  --color-green-300: #7FB09A;
  --color-green-200: #B3D0C3;
  --color-green-100: #E3EFE9;
  --color-green-50: #F2F7F4;

  /* Color 2 — Brass (accent, ≤10% per screen).
     brass-700 is the AA-safe value for text on light surfaces (deviation D-1). */
  --color-brass-700: #8A6E33;
  --color-brass-600: #A8894B;
  --color-brass-500: #BDA05F;
  --color-brass-200: #E9DDBE;
  --color-brass-100: #F5EEDC;

  /* Neutrals — green-tinted "Sage" ramp */
  --color-sage-900: #171C1A;
  --color-sage-700: #3A423E;
  --color-sage-500: #67716C;
  --color-sage-300: #C3CCC7;
  --color-sage-100: #F4F6F5;

  /* Functional red — signal only. Unused on marketing pages. */
  --color-red-600: #B0483B;
  --color-red-100: #F6E5E2;

  --color-white: #FFFFFF;
  --color-black: #000000;
  --color-transparent: transparent;
  --color-current: currentColor;

  /* Semantic aliases — product code targets meaning, not ramp position */
  --color-primary: var(--color-green-700);
  --color-accent: var(--color-brass-600);
  --color-success: var(--color-green-600);
  --color-warning: var(--color-brass-600);
  --color-danger: var(--color-red-600);

  /* Typography — CSS vars are set by next/font in app/layout.tsx */
  --font-display: var(--font-spectral), Georgia, "Times New Roman", serif;
  --font-body: var(--font-hanken), system-ui, -apple-system, sans-serif;

  /* PRD §1.1 breakpoints. Base styles are the sm (<640) design. */
  --breakpoint-md: 640px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;

  --radius-input: 8px;
  --radius-card: 12px;
  --radius-modal: 16px;
  --radius-pill: 999px;

  --shadow-card: 0 1px 3px rgba(18, 41, 31, 0.08);
  --shadow-raised: 0 8px 24px rgba(18, 41, 31, 0.12);
  --shadow-accent: 0 8px 24px rgba(168, 137, 75, 0.28);
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-body);
    color: var(--color-sage-700);
    background: var(--color-white);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* PRD §1.1: 2px brass focus ring, 2px offset, on every interactive element */
  *:focus-visible {
    outline: 2px solid var(--color-brass-600);
    outline-offset: 2px;
  }

  ::selection {
    background: var(--color-brass-200);
    color: var(--color-green-900);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes ring-in {
  from {
    stroke-dashoffset: 327;
  }
}

/* Deviation D-2 — PRD §1.2 requires all motion disabled under this query.
   The testimonial carousel additionally must not auto-advance (WCAG 2.2.2);
   that is enforced in the component via a matchMedia check. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  html {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 7: Run the token test to verify it passes**

Run: `npx vitest run ui/tokens.test.ts`
Expected: PASS — all 29 assertions green.

- [ ] **Step 8: Write the `cn` helper**

Create `lib/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, with later Tailwind utilities winning conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 9: Replace the root layout with brand fonts**

Replace `app/layout.tsx` entirely. `Spectral` requires explicit weights (it has no variable axis); `Hanken_Grotesk` does, so it uses `weight: 'variable'`. Both are self-hosted by `next/font`, which removes the comp's render-blocking request to `fonts.googleapis.com`.

```tsx
import type { Metadata } from 'next'
import { Spectral, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const spectral = Spectral({
  variable: '--font-spectral',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cofoundaz.com'),
  title: {
    default: 'Cofoundaz — The co-founder who never sleeps.',
    template: '%s · Cofoundaz',
  },
  description:
    'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spectral.variable} ${hanken.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 10: Verify the build and types are clean**

Run: `npm run typecheck && npm run build`
Expected: both succeed. The build output should list `/` as a static route. (The scaffold's `app/page.tsx` still exists at this point and will be replaced in Task 6.)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vitest.config.mts vitest.setup.ts \
        lib/cn.ts ui/tokens.test.ts app/globals.css app/layout.tsx
git commit -m "feat(ui): add PRD design tokens, brand fonts, and test harness"
```

---

## Task 2: UI primitives

The shared building blocks every page uses. `Button` carries the most design weight — the comp has five distinct button treatments, and PRD §1.1 rule 3 allows only one brass CTA per screen, so the variant names must make misuse obvious.

**Files:**
- Create: `ui/primitives/button.tsx`, `ui/primitives/button.test.tsx`, `ui/primitives/card.tsx`, `ui/primitives/badge.tsx`, `ui/primitives/container.tsx`, `ui/primitives/section-heading.tsx`, `ui/primitives/index.ts`, `ui/primitives/primitives.test.tsx`

**Interfaces:**
- Consumes: `cn` from `lib/cn.ts`.
- Produces, all exported from `ui/primitives/index.ts`:
  - `Button(props: ButtonProps)` where `ButtonProps = { variant?: 'accent' | 'primary' | 'secondary' | 'ghost' | 'onDark'; size?: 'sm' | 'md' | 'lg'; href?: string; className?: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>`. Renders `next/link` when `href` is set, otherwise `<button>`.
  - `Card({ className, children }): JSX.Element` — white surface, `rounded-card`, `shadow-card`, `border-green-100`.
  - `Badge({ tone?: 'accent' | 'outline'; className?; children }): JSX.Element`.
  - `Container({ width?: 'default' | 'narrow' | 'prose'; className?; children }): JSX.Element` — `default` 1280px, `narrow` 1120px, `prose` 760px; gutter 16px at base, 24px from `md`.
  - `SectionHeading({ eyebrow?, title, subtitle?, tone?: 'light' | 'dark', align?: 'left' | 'center', as?: 'h1' | 'h2', className? }): JSX.Element` — renders the eyebrow in `brass-700` on light and `brass-500` on dark (deviation D-1).

- [ ] **Step 1: Write the failing Button test**

Create `ui/primitives/button.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/primitives/button.test.tsx`
Expected: FAIL — `Failed to resolve import "./button"`.

- [ ] **Step 3: Implement Button**

Create `ui/primitives/button.tsx`:

```tsx
import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'accent' | 'primary' | 'secondary' | 'ghost' | 'onDark'
type Size = 'sm' | 'md' | 'lg'

/**
 * PRD §1.1 rule 3: exactly one `accent` (brass) button per screen. All other
 * actions use `primary`, `secondary`, `ghost`, or `onDark`.
 */
const VARIANTS: Record<Variant, string> = {
  accent: 'bg-brass-600 text-green-900 font-bold hover:bg-brass-500 shadow-card',
  primary: 'bg-green-700 text-white font-semibold hover:bg-green-600',
  secondary:
    'bg-white text-green-700 font-semibold border border-sage-300 hover:bg-green-50',
  ghost: 'text-green-700 font-semibold hover:text-green-600',
  onDark:
    'bg-green-800 text-white font-semibold border border-green-700 hover:bg-green-700',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-[18px] py-2.5 text-[15px]',
  lg: 'px-6 py-4 text-base md:px-8 md:text-[17px]',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-input transition-colors ' +
  'disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

export type ButtonProps = {
  variant?: Variant
  size?: Size
  href?: string
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'secondary',
  size = 'md',
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run the Button test to verify it passes**

Run: `npx vitest run ui/primitives/button.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Write the failing test for the remaining primitives**

Create `ui/primitives/primitives.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge, Card, Container, SectionHeading } from './index'

describe('Card', () => {
  it('renders children inside a bordered surface', () => {
    render(<Card>Scattered everywhere</Card>)
    const el = screen.getByText('Scattered everywhere')
    expect(el.className).toContain('rounded-card')
    expect(el.className).toContain('border-green-100')
  })
})

describe('Badge', () => {
  it('renders the accent tone on brass', () => {
    render(<Badge tone="accent">Most popular</Badge>)
    expect(screen.getByText('Most popular').className).toContain('bg-brass-600')
  })
})

describe('Container', () => {
  it('constrains to 1280px by default', () => {
    render(<Container>content</Container>)
    expect(screen.getByText('content').className).toContain('max-w-[1280px]')
  })

  it('constrains to 760px for prose', () => {
    render(<Container width="prose">content</Container>)
    expect(screen.getByText('content').className).toContain('max-w-[760px]')
  })
})

describe('SectionHeading', () => {
  it('renders an h2 by default', () => {
    render(<SectionHeading title="One workspace. One score. One next step." />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'One workspace. One score. One next step.' })
    ).toBeInTheDocument()
  })

  it('renders an h1 when asked', () => {
    render(<SectionHeading as="h1" title="Simple plans that grow with you." />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('uses AA-safe brass-700 for the eyebrow on light surfaces (deviation D-1)', () => {
    render(<SectionHeading eyebrow="Pricing" title="Simple plans that grow with you." />)
    expect(screen.getByText('Pricing').className).toContain('text-brass-700')
  })

  it('uses brass-500 for the eyebrow on dark surfaces', () => {
    render(<SectionHeading tone="dark" eyebrow="How it works" title="One workspace." />)
    expect(screen.getByText('How it works').className).toContain('text-brass-500')
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run ui/primitives/primitives.test.tsx`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 7: Implement the remaining primitives**

Create `ui/primitives/card.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-green-100 bg-white shadow-card',
        className
      )}
    >
      {children}
    </div>
  )
}
```

Create `ui/primitives/badge.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function Badge({
  tone = 'outline',
  className,
  children,
}: {
  tone?: 'accent' | 'outline'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-semibold',
        tone === 'accent'
          ? 'bg-brass-600 text-green-900'
          : 'border border-green-200 bg-white text-green-700',
        className
      )}
    >
      {children}
    </span>
  )
}
```

Create `ui/primitives/container.tsx`:

```tsx
import { cn } from '@/lib/cn'

const WIDTHS = {
  default: 'max-w-[1280px]',
  narrow: 'max-w-[1120px]',
  prose: 'max-w-[760px]',
} as const

export function Container({
  width = 'default',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('mx-auto px-4 md:px-6', WIDTHS[width], className)}>
      {children}
    </div>
  )
}
```

Create `ui/primitives/section-heading.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  align = 'center',
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  className?: string
}) {
  const isDark = tone === 'dark'
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      {eyebrow ? (
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.08em]',
            // Deviation D-1: brass-600 on white is 3.31:1 and fails AA.
            isDark ? 'text-brass-500' : 'text-brass-700'
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <Tag
        className={cn(
          'font-display font-semibold tracking-[-0.02em] text-balance',
          Tag === 'h1'
            ? 'text-[34px] leading-[1.08] md:text-[44px] lg:text-[50px]'
            : 'text-[28px] leading-[1.1] md:text-[34px] lg:text-[38px]',
          isDark ? 'text-white' : 'text-green-900',
          eyebrow && 'mt-3'
        )}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed md:text-[19px]',
            align === 'center' && 'mx-auto',
            isDark ? 'text-green-200' : 'text-sage-700'
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
```

Create `ui/primitives/index.ts`:

```ts
export { Button, type ButtonProps } from './button'
export { Card } from './card'
export { Badge } from './badge'
export { Container } from './container'
export { SectionHeading } from './section-heading'
```

- [ ] **Step 8: Run all primitive tests to verify they pass**

Run: `npx vitest run ui/primitives`
Expected: PASS — 14 tests across both files.

- [ ] **Step 9: Commit**

```bash
git add ui/primitives
git commit -m "feat(ui): add Button, Card, Badge, Container, SectionHeading primitives"
```

---

## Task 3: Content modules

Every string in the site, typed and centralised. Pages become thin mappers over this data, which is what keeps the page tasks short and makes a copy review a single-directory diff.

**Apostrophe rule:** use the typographic apostrophe `’` (U+2019) throughout. The comp's JS data already uses it (`today’s mission`, `you’re ready`); only its inline markup used a straight quote. Normalising up is the higher-quality choice and keeps the content files internally consistent.

**Files:**
- Create: `content/types.ts`, `content/nav.ts`, `content/strings/common.ts`, `content/home.ts`, `content/product.ts`, `content/pricing.ts`, `content/about.ts`, `content/legal.ts`, `content/contact.ts`, `content/auth.ts`, `content/content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, as named const exports:
  - `content/types.ts` — `FeatureTile`, `Step`, `Testimonial`, `SecurityItem`, `HubGroup`, `Plan`, `MatrixSection`, `MatrixRow`, `MatrixCell`, `FaqItem`, `StoryEntry`, `ValueItem`, `TeamMember`, `LegalDocument`, `LegalSection`, `NavLink`
  - `content/nav.ts` — `headerLinks: NavLink[]`, `footerColumns: { title: string; links: NavLink[] }[]`, `footerTagline: string`, `copyright: string`
  - `content/home.ts` — `home` object
  - `content/product.ts` — `product` object with `hubGroups: HubGroup[]`
  - `content/pricing.ts` — `pricing` object with `plans: Plan[]`, `matrix: MatrixSection[]`, `faq: FaqItem[]`
  - `content/about.ts` — `about` object
  - `content/legal.ts` — `legalDocuments: Record<'terms'|'privacy'|'security'|'cookies', LegalDocument>`
  - `content/contact.ts` — `contact` object
  - `content/auth.ts` — `authModes: Record<'login'|'signup', {...}>`, `authPanel`
  - `content/strings/common.ts` — `common` object (PRD §1.4)

- [ ] **Step 1: Write the failing content test**

This guards against copy drift and against the two content facts most likely to be got wrong: that Growth and Scale have no price yet, and that punctuation follows the comp's house style.

Create `content/content.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { home } from './home'
import { product } from './product'
import { pricing } from './pricing'
import { about } from './about'
import { legalDocuments } from './legal'
import { headerLinks, footerColumns } from './nav'

describe('home content', () => {
  it('uses the comp hero copy verbatim', () => {
    expect(home.hero.title).toBe('The co-founder who never sleeps.')
    expect(home.hero.subtitle).toBe(
      'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.'
    )
    expect(home.hero.trustLine).toBe('No credit card required.')
  })

  it('has 8 feature tiles, 3 problems, 3 steps, 3 testimonials, 4 security items', () => {
    expect(home.features.items).toHaveLength(8)
    expect(home.problem.cards).toHaveLength(3)
    expect(home.howItWorks.steps).toHaveLength(3)
    expect(home.testimonials.quotes).toHaveLength(3)
    expect(home.security.items).toHaveLength(4)
  })
})

describe('product content', () => {
  it('has 5 hub groups with unique anchors and AppFrame variants', () => {
    expect(product.hubGroups).toHaveLength(5)
    expect(product.hubGroups.map((g) => g.anchor)).toEqual([
      'p-overview', 'p-build', 'p-grow', 'p-fund', 'p-resources',
    ])
    expect(product.hubGroups.map((g) => g.variant)).toEqual([
      'overview', 'build', 'grow', 'fund', 'resources',
    ])
  })

  it('gives every hub group exactly 3 items', () => {
    for (const group of product.hubGroups) {
      expect(group.items).toHaveLength(3)
    }
  })
})

describe('pricing content', () => {
  it('has 3 plans with Growth marked most popular', () => {
    expect(pricing.plans.map((p) => p.name)).toEqual(['Starter', 'Growth', 'Scale'])
    expect(pricing.plans.filter((p) => p.popular)).toHaveLength(1)
    expect(pricing.plans.find((p) => p.popular)?.name).toBe('Growth')
  })

  it('leaves Growth and Scale prices unset — PRD §3.3 says TBD by business', () => {
    const byName = Object.fromEntries(pricing.plans.map((p) => [p.name, p]))
    expect(byName.Starter.price).toBe('Free')
    expect(byName.Growth.price).toBeNull()
    expect(byName.Scale.price).toBeNull()
  })

  it('has a 4-section comparison matrix where every row covers all three plans', () => {
    expect(pricing.matrix).toHaveLength(4)
    for (const section of pricing.matrix) {
      for (const row of section.rows) {
        expect(row.starter).toBeDefined()
        expect(row.growth).toBeDefined()
        expect(row.scale).toBeDefined()
      }
    }
  })

  it('has the 6 FAQ items from PRD §3.3', () => {
    expect(pricing.faq).toHaveLength(6)
    expect(pricing.faq[0].question).toBe('What counts as an AI credit?')
    expect(pricing.faq[3].answer).toBe(
      'No. Your workspace data is never used to train models.'
    )
  })
})

describe('about content', () => {
  it('has 4 story entries, 4 values, 6 team members, 3 stats', () => {
    expect(about.story).toHaveLength(4)
    expect(about.values).toHaveLength(4)
    expect(about.team).toHaveLength(6)
    expect(about.stats).toHaveLength(3)
  })
})

describe('legal content', () => {
  it('defines all four documents with a last-updated stamp', () => {
    const keys = ['terms', 'privacy', 'security', 'cookies'] as const
    for (const key of keys) {
      const doc = legalDocuments[key]
      expect(doc.title).toBeTruthy()
      expect(doc.updated).toBe('July 1, 2026')
      expect(doc.sections.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('navigation', () => {
  it('omits Blog and Help Center while those pages are out of scope', () => {
    const allHrefs = [
      ...headerLinks.map((l) => l.href),
      ...footerColumns.flatMap((c) => c.links.map((l) => l.href)),
    ]
    expect(allHrefs).not.toContain('/blog')
    expect(allHrefs).not.toContain('/help')
  })

  it('links only to routes that exist', () => {
    const shipped = [
      '/', '/product', '/pricing', '/about', '/contact',
      '/terms', '/privacy', '/security', '/cookies', '/login', '/signup',
    ]
    const allHrefs = [
      ...headerLinks.map((l) => l.href),
      ...footerColumns.flatMap((c) => c.links.map((l) => l.href)),
    ]
    for (const href of allHrefs) {
      expect(shipped).toContain(href)
    }
  })
})

describe('copy house style', () => {
  it('never uses em-dashes or en-dashes, matching the comp', () => {
    const allCopy = JSON.stringify([home, product, pricing, about, legalDocuments])
    expect(allCopy).not.toMatch(/[—–]/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run content/content.test.ts`
Expected: FAIL — `Failed to resolve import "./home"`.

- [ ] **Step 3: Create the shared types, navigation, and common strings**

Create `content/types.ts`:

```ts
export type NavLink = { label: string; href: string }

export type FeatureTile = { icon: string; title: string; body: string }
export type Step = { number: string; title: string; body: string }
export type Testimonial = {
  text: string
  initials: string
  name: string
  company: string
}
export type SecurityItem = { title: string; body: string }

export type HubGroup = {
  kicker: string
  anchor: string
  variant: 'overview' | 'build' | 'grow' | 'fund' | 'resources'
  title: string
  blurb: string
  items: { name: string; body: string }[]
  metric: string
  metricLabel: string
}

export type Plan = {
  name: string
  tagline: string
  /** null until the business sets pricing. PRD §3.3: "tier names/prices TBD by business". */
  price: string | null
  per: string | null
  popular: boolean
  features: string[]
}

/** A cell is either a tick or a short label such as "Basic" / "Unlimited" / "·". */
export type MatrixCell = { kind: 'yes' } | { kind: 'text'; value: string }
export type MatrixRow = {
  feature: string
  starter: MatrixCell
  growth: MatrixCell
  scale: MatrixCell
}
export type MatrixSection = { section: string; rows: MatrixRow[] }

export type FaqItem = { question: string; answer: string }

export type StoryEntry = { year: string; title: string; body: string }
export type ValueItem = { number: string; title: string; body: string }
export type TeamMember = { initials: string; name: string; role: string }

export type LegalSection = { heading: string; body: string }
export type LegalDocument = {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}
```

Create `content/nav.ts`:

```ts
import type { NavLink } from './types'

/**
 * Blog and Help Center are designed in the comp but out of scope for v1
 * (see spec §3). They are kept here, commented out, so re-enabling is one line
 * once those routes exist. Shipping them now would mean dead links.
 */
export const headerLinks: NavLink[] = [
  { label: 'Product', href: '/product' },
  { label: 'Pricing', href: '/pricing' },
  // { label: 'Blog', href: '/blog' },
  // { label: 'Help Center', href: '/help' },
  { label: 'About', href: '/about' },
]

export const headerCtas = {
  login: { label: 'Log in', href: '/login' },
  signup: { label: 'Start free', href: '/signup' },
}

export const footerTagline =
  'The AI operating system that takes founders from idea to profitability.'

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '/product' },
      { label: 'Pricing', href: '/pricing' },
      // { label: 'Blog', href: '/blog' },
      // { label: 'Help Center', href: '/help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
]

export const copyright = '© 2026 Cofoundaz. All rights reserved.'
```

Create `content/strings/common.ts` (PRD §1.4 — defined now so the app phase reuses rather than re-authors):

```ts
export const common = {
  genericError:
    'Something went wrong on our end. Your work is saved — try again in a moment.',
  offlineBanner: "You're offline. We'll sync your changes when you're back.",
  saved: 'Saved.',
  copied: 'Copied.',
  aiDraftChip: '✨ AI draft',
  aiDraftTooltip:
    'Generated by your AI Co-Founder. Review and edit before using.',
  notFound: {
    title: 'This page doesn’t exist.',
    body: 'It may have been moved or deleted.',
    cta: 'Back to dashboard',
  },
  permissionsError: {
    title: 'You don’t have access to this.',
    body: 'Ask the workspace founder to grant you access to {module}.',
  },
} as const
```

> Note: `common` intentionally preserves the PRD's em-dash in `genericError`, because that string belongs to the *app* (PRD §1.4), not the marketing site. The no-dash house style applies to marketing copy, which is why `content.test.ts` checks only the page content modules.

- [ ] **Step 4: Create the home content**

Create `content/home.ts`:

```ts
import type { FeatureTile, SecurityItem, Step, Testimonial } from './types'

export const home = {
  hero: {
    badge: 'AI operating system for founders',
    title: 'The co-founder who never sleeps.',
    subtitle:
      'Cofoundaz is the AI operating system that takes you from idea to profitability. One connected workspace, a bench of AI advisors, and a clear next step every single day.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See how it works', href: '#how' },
    trustLine: 'No credit card required.',
  },

  problem: {
    title: 'Building a startup shouldn’t feel like guessing.',
    cards: [
      {
        icon: '⚄',
        title: 'Scattered everywhere',
        body: 'Your plan is in a doc, your numbers in a sheet, your tasks in your head. Nothing connects.',
      },
      {
        icon: '₦',
        title: 'Advice is expensive',
        body: 'Lawyers, accountants, and marketers charge by the hour, exactly when you have the least to spend.',
      },
      {
        icon: '?',
        title: 'What do I do next?',
        body: 'Every day starts with a hundred options and no clear priority.',
      },
    ] satisfies FeatureTile[],
  },

  howItWorks: {
    eyebrow: 'How it works',
    title: 'One workspace. One score. One next step.',
    steps: [
      {
        number: '1',
        title: 'Tell us about your startup',
        body: 'A 10 minute assessment calibrates your roadmap, your Health Score, and every AI advisor to your exact stage and industry.',
      },
      {
        number: '2',
        title: 'Meet your AI Co-Founder',
        body: 'Ask anything. It routes your question to the right specialist across legal, finance, marketing, sales, and fundraising, with full context on your business.',
      },
      {
        number: '3',
        title: 'Do today’s mission',
        body: 'Every morning, get the 1 to 3 highest-leverage actions. Complete them, build your streak, watch your Health Score climb.',
      },
    ] satisfies Step[],
  },

  features: {
    title: 'Everything a founder juggles, connected.',
    items: [
      { icon: '◈', title: 'Startup Health Score', body: 'An explainable 0 to 100 read on your whole business.' },
      { icon: '✦', title: 'AI Co-Founder', body: 'Ten specialist advisors behind one chat.' },
      { icon: '⟶', title: 'Stage-based Roadmap', body: 'From idea to scale, re-planned when life happens.' },
      { icon: '▤', title: 'Business Builder', body: 'Canvases to a full business plan in minutes.' },
      { icon: '✓', title: 'Validation Hub', body: 'Test assumptions before you spend.' },
      { icon: '₦', title: 'Finance Hub', body: 'Runway, forecasts, and invoices without a spreadsheet.' },
      { icon: '◆', title: 'Funding Hub', body: 'Data room, cap table, grants, and investor pipeline.' },
      { icon: '★', title: 'Marketplace', body: 'Vetted human experts when AI is not enough.' },
    ] satisfies FeatureTile[],
  },

  testimonials: {
    title: 'Founders are building faster.',
    quotes: [
      {
        text: 'It feels like having a co-founder, a lawyer, and a CFO in one place. I stopped guessing and started shipping.',
        initials: 'AN',
        name: 'Amara Nwosu',
        company: 'Kolo, savings for gig workers',
      },
      {
        text: 'The daily mission is the first thing I open. Small wins, every day, and the Health Score kept climbing.',
        initials: 'DK',
        name: 'Daniel Kariuki',
        company: 'Shamba, agri-logistics',
      },
      {
        text: 'We built our data room and closed our pre-seed in six weeks. Investors noticed how organized we were.',
        initials: 'FA',
        name: 'Fatima Adeyemi',
        company: 'Payflow, B2B payments',
      },
    ] satisfies Testimonial[],
  },

  security: {
    title: 'Your startup’s data is yours.',
    body: 'Isolated workspaces, encryption in transit and at rest, granular sharing controls, and a full audit trail.',
    items: [
      { title: 'Isolated workspaces', body: 'Tenant-isolated data with row-level policies.' },
      { title: 'Encrypted throughout', body: 'In transit and at rest, always.' },
      { title: 'Granular sharing', body: 'Control access per document and per role.' },
      { title: 'Full audit trail', body: 'Every sensitive action is logged.' },
    ] satisfies SecurityItem[],
  },

  finalCta: {
    title: 'Stop guessing. Start building.',
    cta: { label: 'Start free', href: '/signup' },
    subtitle: 'Set up in under 10 minutes.',
  },
} as const
```

- [ ] **Step 5: Create the product content**

Create `content/product.ts`:

```ts
import type { HubGroup } from './types'

export const product = {
  hero: {
    eyebrow: 'The product',
    title: 'Every job a founder has, in one place that actually talks to itself.',
    subtitle:
      'Most tools hand you an empty box and wish you luck. Cofoundaz hands you a plan, a score, and a specialist for every question, all working from the same live picture of your business.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See pricing', href: '/pricing' },
    stats: [
      { value: '26', label: 'connected modules' },
      { value: '11', label: 'AI specialists' },
      { value: '1', label: 'Health Score' },
    ],
  },

  subNav: [
    { label: 'Overview', anchor: 'p-overview' },
    { label: 'Build', anchor: 'p-build' },
    { label: 'Grow', anchor: 'p-grow' },
    { label: 'Fund & protect', anchor: 'p-fund' },
    { label: 'Resources', anchor: 'p-resources' },
  ],

  hubGroups: [
    {
      kicker: 'Overview',
      anchor: 'p-overview',
      variant: 'overview',
      title: 'The one screen you check every morning',
      blurb:
        'Open Cofoundaz and the picture is already drawn: your Health Score, today’s mission, your runway, and the risks your AI Co-Founder is quietly watching. Nothing to assemble, nothing to reconcile.',
      items: [
        { name: 'Startup Health Score', body: 'An explainable 0 to 100 read on your whole business.' },
        { name: 'Today’s Mission', body: 'The one to three highest-leverage moves, chosen for you daily.' },
        { name: 'Stage-based Roadmap', body: 'From idea to scale, re-planned when life happens.' },
      ],
      metric: '5 sec',
      metricLabel: 'to the whole truth about your business',
    },
    {
      kicker: 'Build',
      anchor: 'p-build',
      variant: 'build',
      title: 'From a blank page to a fundable plan',
      blurb:
        'Shape the idea with lean and business-model canvases, personas, pricing, and competitive analysis. When you’re ready, one click turns all of it into a full business plan, written in your numbers.',
      items: [
        { name: 'Business Builder', body: 'Canvases to a full business plan in minutes.' },
        { name: 'Validation Hub', body: 'Test assumptions with smoke tests, interviews, and surveys.' },
        { name: 'Assessment', body: 'A short adaptive check-in that calibrates everything.' },
      ],
      metric: '9 canvases',
      metricLabel: 'compiled into one investor-ready plan',
    },
    {
      kicker: 'Grow',
      anchor: 'p-grow',
      variant: 'grow',
      title: 'Ship marketing, close deals, know your numbers',
      blurb:
        'Write and schedule the campaign, work a pipeline that forecasts itself, and watch a finance hub that tells you the truth about runway. Growth stops being three disconnected chores.',
      items: [
        { name: 'Marketing Hub', body: 'Plan it, write it, ship it, measure it.' },
        { name: 'Sales Hub', body: 'A pipeline, email sequences, and an AI sales coach.' },
        { name: 'Finance Hub', body: 'Runway, forecasts, and invoices without a spreadsheet.' },
      ],
      metric: '3 hubs',
      metricLabel: 'marketing, sales, and finance, one engine',
    },
    {
      kicker: 'Fund & protect',
      anchor: 'p-fund',
      variant: 'fund',
      title: 'Raise with clarity, and stay covered',
      blurb:
        'Build the data room before investors ask, model the round before you sign, and rehearse the hard questions before the meeting. Meanwhile, legal and compliance keep the raise from derailing.',
      items: [
        { name: 'Funding Hub', body: 'Data room, cap table, grants, and investor pipeline.' },
        { name: 'Investor Readiness', body: 'Score your deck, rehearse the Q and A, tighten the story.' },
        { name: 'Legal & Compliance', body: 'Formation, contracts, IP, and filing deadlines.' },
      ],
      metric: 'Series A ready',
      metricLabel: 'a data room you can share in a day',
    },
    {
      kicker: 'Resources',
      anchor: 'p-resources',
      variant: 'resources',
      title: 'A human, or a lesson, exactly when you need it',
      blurb:
        'When AI isn’t enough, a vetted lawyer, accountant, or marketer is one click away. And a curriculum built for your stage keeps you learning what matters now, not what the internet thinks you need.',
      items: [
        { name: 'Marketplace', body: 'Vetted human experts when AI is not enough.' },
        { name: 'Learning Academy', body: 'The curriculum for exactly where you are.' },
        { name: 'Documents', body: 'Every file, versioned, shareable, and signable.' },
      ],
      metric: 'Vetted',
      metricLabel: 'experts and a stage-matched curriculum',
    },
  ] satisfies HubGroup[],

  scoreBand: {
    eyebrow: 'The thread that connects it all',
    title: 'One score to tell you if it’s working.',
    body: 'Every action in every module feeds one number: your Startup Health Score. It is the single read on whether you are building a real company, and it is honest about where you are not.',
    cards: [
      { title: 'Explainable', body: 'Every point traces back to something real, from runway to validation evidence.' },
      { title: 'Live', body: 'It recomputes as you work, so the number in front of you is always today’s truth.' },
      { title: 'Actionable', body: 'Each recommendation shows its estimated lift, so you always know the highest-leverage move.' },
    ],
  },

  finalCta: {
    title: 'Your co-founder is ready when you are.',
    cta: { label: 'Start free', href: '/signup' },
    subtitle: 'No credit card required.',
  },
} as const
```

- [ ] **Step 6: Create the pricing content**

Create `content/pricing.ts`. Note `price: null` for Growth and Scale — PRD §3.3 marks tiers TBD by business, and the comp ships blank price slots. Do not invent numbers.

```ts
import type { FaqItem, MatrixSection, Plan } from './types'

const yes = { kind: 'yes' } as const
const text = (value: string) => ({ kind: 'text', value }) as const
const none = text('·')

export const pricing = {
  hero: {
    eyebrow: 'Pricing',
    title: 'Simple plans that grow with you.',
    subtitle:
      'Every plan includes the AI Co-Founder, your roadmap, and your Health Score. Start free, upgrade the day it pays for itself.',
    ticks: [
      'No credit card to start',
      'Cancel anytime',
      'Your data is never used to train AI',
    ],
  },

  plans: [
    {
      name: 'Starter',
      tagline: 'For validating an idea.',
      price: 'Free',
      per: null,
      popular: false,
      features: [
        'Core AI Co-Founder',
        'Roadmap and Health Score',
        'Business Builder',
        'Documents',
        'AI credits each month',
        '1 seat',
      ],
    },
    {
      name: 'Growth',
      tagline: 'For getting to revenue.',
      price: null,
      per: null,
      popular: true,
      features: [
        'Everything in Starter',
        'Marketing, Sales, Finance, Validation Hubs',
        'Analytics and Reports',
        'More AI credits',
        'Multiple seats',
      ],
    },
    {
      name: 'Scale',
      tagline: 'For raising and expanding.',
      price: null,
      per: null,
      popular: false,
      features: [
        'Everything in Growth',
        'Funding Hub and Investor Readiness',
        'Legal and Compliance',
        'Priority support',
        'Most AI credits',
        'Unlimited seats',
      ],
    },
  ] satisfies Plan[],

  addOnsBanner:
    'Need more AI credits or seats? Add them any time from Billing.',

  everyPlan: {
    title: 'In every plan, from day one',
    items: [
      'The AI Co-Founder chat, routed to the right specialist',
      'Your stage-based Roadmap and Today’s Mission',
      'Your explainable Startup Health Score',
      'Free professional collaborator seats (accountant, lawyer)',
      'Isolated, encrypted workspace with full audit trail',
      'Web and mobile access',
    ],
  },

  matrixTitle: 'Compare every plan',
  matrix: [
    {
      section: 'Core, in every plan',
      rows: [
        { feature: 'AI Co-Founder chat', starter: yes, growth: yes, scale: yes },
        { feature: 'Roadmap & Health Score', starter: yes, growth: yes, scale: yes },
        { feature: 'Business Builder & canvases', starter: yes, growth: yes, scale: yes },
        { feature: 'Documents & e-signature', starter: yes, growth: yes, scale: yes },
        { feature: 'AI credits per month', starter: text('Basic'), growth: text('More'), scale: text('Most') },
        { feature: 'Seats', starter: text('1'), growth: text('Multiple'), scale: text('Unlimited') },
      ],
    },
    {
      section: 'Grow & operate',
      rows: [
        { feature: 'Marketing Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Sales Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Finance Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Validation Hub', starter: none, growth: yes, scale: yes },
        { feature: 'Analytics & Reports', starter: none, growth: yes, scale: yes },
      ],
    },
    {
      section: 'Fund & protect',
      rows: [
        { feature: 'Funding Hub & data room', starter: none, growth: none, scale: yes },
        { feature: 'Investor Readiness', starter: none, growth: none, scale: yes },
        { feature: 'Legal & Compliance', starter: none, growth: none, scale: yes },
      ],
    },
    {
      section: 'Support',
      rows: [
        { feature: 'Professional collaborators', starter: yes, growth: yes, scale: yes },
        { feature: 'Support', starter: text('Community'), growth: text('Standard'), scale: text('Priority') },
      ],
    },
  ] satisfies MatrixSection[],

  credits: {
    title: 'What is an AI credit?',
    body: 'A credit is roughly one AI answer or one generated artifact section. The big jobs, like a business plan or a financial model, always show their cost before you run them, so you are never surprised.',
    examples: [
      { label: 'Ask your AI Co-Founder a question', value: '≈ 1 credit' },
      { label: 'Draft a document section', value: '≈ 1 credit' },
      { label: 'Generate a full business plan', value: 'Shows cost first' },
      { label: 'Build a 3-statement financial model', value: 'Shows cost first' },
    ],
  },

  wordmarks: {
    title: 'Trusted by founders in 40+ countries',
    names: ['Kolo', 'Shamba', 'Payflow', 'GigPay', 'Thrive'],
  },

  faqTitle: 'Questions, answered.',
  faq: [
    {
      question: 'What counts as an AI credit?',
      answer:
        'A credit is roughly one AI answer or one generated artifact section. Big jobs like a business plan or financial model show their cost before you run them.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        'Yes. Upgrades apply instantly; downgrades take effect at the end of your billing period.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'If something is not right, reach out within 14 days of a charge and we will make it right.',
    },
    {
      question: 'Is my data used to train AI models?',
      answer: 'No. Your workspace data is never used to train models.',
    },
    {
      question: 'Can I invite my accountant or lawyer?',
      answer: 'Yes. Professional collaborator roles are free on every plan.',
    },
    {
      question: 'How do I cancel?',
      answer:
        'Cancel any time from Billing. Your plan stays active until the end of the period, and your data is kept for 90 days after that.',
    },
  ] satisfies FaqItem[],

  finalCta: {
    title: 'Try it free. Keep it if it earns its place.',
    body: 'Start on the free plan today. If something isn’t right in your first 14 days on a paid plan, reach out and we’ll make it right.',
    cta: { label: 'Start free', href: '/signup' },
  },
} as const
```

- [ ] **Step 7: Create the about content**

Create `content/about.ts`:

```ts
import type { StoryEntry, TeamMember, ValueItem } from './types'

export const about = {
  hero: {
    eyebrow: 'About Cofoundaz',
    title: 'We’re building the operating system for the next million founders.',
    subtitle:
      'A small team obsessed with one question: what would it take for any founder, anywhere, to build as if they had a world-class team on day one?',
  },

  why: {
    title: 'Why we exist',
    paragraphs: [
      'Most startups don’t fail because the idea was wrong. They fail from avoidable mistakes: the contract nobody read, the runway nobody watched, the customer nobody talked to. The knowledge to avoid all of it already exists, but it’s locked behind expensive advisors and hard-won scar tissue.',
      'Cofoundaz puts that knowledge in one place and makes it act like a co-founder. It plans with you, scores your progress honestly, and tells you the single most important thing to do next, every single day.',
    ],
  },

  stats: [
    { value: '10 min', label: 'from signup to a calibrated workspace' },
    { value: '1 to 3', label: 'clear actions in every daily mission' },
    { value: '11', label: 'AI specialists behind one chat' },
  ],

  missionQuote:
    'Great companies die from avoidable mistakes. We exist to make world-class company-building knowledge available to every founder on day zero.',

  storyTitle: 'Our story',
  story: [
    {
      year: '2024',
      title: 'A frustrating pattern',
      body: 'After watching capable founders stall on avoidable mistakes, we started asking why great company-building knowledge was still so hard to reach.',
    },
    {
      year: '2025',
      title: 'The first Health Score',
      body: 'We built an explainable score that read a whole business from live signals, not vanity metrics. Founders finally had one honest number.',
    },
    {
      year: '2025',
      title: 'The bench takes shape',
      body: 'We connected a roster of AI specialists behind a single chat, each with full context, so founders never had to pick the right advisor.',
    },
    {
      year: '2026',
      title: 'One connected workspace',
      body: 'Roadmap, finance, funding, legal, and growth came together into the operating system founders now open every morning.',
    },
  ] satisfies StoryEntry[],

  valuesTitle: 'What we believe',
  values: [
    { number: '01', title: 'Restraint over noise', body: 'The best tool shows you the one thing that matters, not a hundred things you could do.' },
    { number: '02', title: 'Clarity you can trace', body: 'Every number, every score, and every recommendation explains itself.' },
    { number: '03', title: 'Honesty over hype', body: 'We tell you what is working and what is not. No vanity metrics.' },
    { number: '04', title: 'Momentum, daily', body: 'Small, consistent progress compounds into real companies.' },
  ] satisfies ValueItem[],

  teamTitle: 'The people building it',
  team: [
    { initials: 'OA', name: 'Ope Adeyemi', role: 'Co-Founder & CEO' },
    { initials: 'LC', name: 'Lena Cho', role: 'Co-Founder & CTO' },
    { initials: 'MR', name: 'Marcus Reyes', role: 'Head of AI' },
    { initials: 'SB', name: 'Sara Bello', role: 'Head of Design' },
    { initials: 'DK', name: 'Daniel Kariuki', role: 'Head of Product' },
    { initials: 'FA', name: 'Fatima Adeyemi', role: 'Head of Growth' },
  ] satisfies TeamMember[],

  hiring: {
    title: 'We’re hiring across engineering, design, and AI.',
    subtitle: 'Remote-first, from anywhere our founders build.',
    // No careers page in v1; the comp routes this to contact.
    cta: { label: 'See open roles', href: '/contact' },
  },

  backers: {
    title: 'Backed by operators and funds who have built before',
    names: ['Sahel Fund', 'Ventures for Africa', 'Adia Holdings', 'Zenith Angels'],
  },

  finalCta: {
    title: 'Come build the thing that builds companies.',
    primaryCta: { label: 'Start free', href: '/signup' },
    secondaryCta: { label: 'See open roles', href: '/contact' },
  },
} as const
```

- [ ] **Step 8: Create the legal content**

Create `content/legal.ts`. Every document keeps the comp's note that final language comes from counsel (spec open decision D-03).

```ts
import type { LegalDocument } from './types'

export const legalDocuments: Record<
  'terms' | 'privacy' | 'security' | 'cookies',
  LegalDocument
> = {
  terms: {
    title: 'Terms of Service',
    updated: 'July 1, 2026',
    intro:
      'These Terms of Service govern your access to and use of Cofoundaz. By creating a workspace you agree to them. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: '1. Your account', body: 'You are responsible for the activity in your workspace and for keeping your credentials secure. Each workspace has one owner account.' },
      { heading: '2. Acceptable use', body: 'Do not misuse the service, attempt to disrupt it, or use it to violate the rights of others. AI outputs are drafts you are responsible for reviewing before use.' },
      { heading: '3. Your content', body: 'You retain ownership of everything you put into your workspace. We process it only to provide the service to you.' },
      { heading: '4. Billing', body: 'Paid plans renew automatically until cancelled. Upgrades apply immediately; downgrades take effect at the end of the billing period.' },
      { heading: '5. Termination', body: 'You may close your workspace at any time. We keep your data for 90 days after cancellation, after which it is permanently deleted.' },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated: 'July 1, 2026',
    intro:
      'This policy explains what we collect, why, and the controls you have. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: 'What we collect', body: 'Account details, workspace content you create, and product usage needed to run and improve the service.' },
      { heading: 'How we use it', body: 'To operate your workspace, personalize your roadmap and Health Score, and keep the platform secure.' },
      { heading: 'AI and your data', body: 'Your workspace data is never used to train AI models. It is used only to generate answers and artifacts for you.' },
      { heading: 'Your controls', body: 'You can export or delete your data, manage sharing per document, and clear your AI Co-Founder memory at any time.' },
      { heading: 'Data retention', body: 'Content is retained while your workspace is active and for 90 days after cancellation.' },
    ],
  },

  security: {
    title: 'Security at Cofoundaz',
    updated: 'July 1, 2026',
    intro:
      'Your startup runs on Cofoundaz, so security is foundational. Here is how we protect your workspace.',
    sections: [
      { heading: 'Isolated workspaces', body: 'Every workspace is tenant-isolated with row-level policies enforced at both the gateway and the service layer.' },
      { heading: 'Encryption', body: 'Data is encrypted in transit and at rest. The Founder Journal is additionally encrypted with a per-workspace key.' },
      { heading: 'Access controls', body: 'Granular, role-based permissions with per-document sharing and a full, immutable audit trail of sensitive actions.' },
      { heading: 'Compliance', body: 'We operate against OWASP ASVS L2, run an annual penetration test, and use SOC 2 providers for e-signature and payments.' },
      { heading: 'Resilience', body: 'Point-in-time recovery with 30-day backups, versioned document storage, and a tested disaster-recovery plan.' },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    updated: 'July 1, 2026',
    intro:
      'This policy describes the cookies we use and how to manage them. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: 'Essential cookies', body: 'Required to keep you signed in and to keep the product working. These cannot be turned off.' },
      { heading: 'Analytics cookies', body: 'Help us understand how the product is used so we can improve it. These are optional.' },
      { heading: 'Managing cookies', body: 'You can control non-essential cookies from your browser settings and from your workspace preferences.' },
    ],
  },
}

export const legalBackLink = { label: '← Back home', href: '/' }
```

- [ ] **Step 9: Create the contact and auth content**

Create `content/contact.ts`:

```ts
export const contact = {
  title: 'Get in touch.',
  subtitle: 'We usually reply within one business day.',
  fields: {
    name: { label: 'Name', placeholder: 'Your name' },
    email: { label: 'Email', placeholder: 'you@company.com' },
    topic: { label: 'Topic', options: ['Sales', 'Support', 'Partnerships', 'Press'] },
    message: { label: 'Message', placeholder: 'How can we help?' },
  },
  submit: 'Send message',
  success: 'Thanks, we’ll get back to you within one business day.',
} as const
```

Create `content/auth.ts`:

```ts
export const authPanel = {
  quote: 'The co-founder who never sleeps.',
  trustLine: 'Trusted by founders from idea to profitability.',
  copyright: '© Cofoundaz',
} as const

export const authModes = {
  signup: {
    title: 'Create your workspace',
    subtitle: 'Free to start. Set up in under 10 minutes.',
    cta: 'Create account',
    passwordHelp: '8+ characters, one number',
    footerText: 'Already have an account?',
    footerLink: { label: 'Log in', href: '/login' },
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to pick up where you left off.',
    cta: 'Log in',
    passwordHelp: null,
    footerText: 'New here?',
    footerLink: { label: 'Create your workspace', href: '/signup' },
  },
} as const

export const authShared = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  divider: 'or',
  emailLabel: 'Work email',
  emailPlaceholder: 'you@startup.com',
  passwordLabel: 'Password',
  forgotPassword: 'Forgot password?',
  termsPrefix: 'I agree to the',
  termsLink: { label: 'Terms of Service', href: '/terms' },
  termsJoin: 'and',
  privacyLink: { label: 'Privacy Policy', href: '/privacy' },
} as const
```

- [ ] **Step 10: Run the content test to verify it passes**

Run: `npx vitest run content/content.test.ts`
Expected: PASS — 15 tests. If the house-style test fails, search the content files for `—` or `–` and replace with the comp's phrasing.

- [ ] **Step 11: Verify types compile**

Run: `npm run typecheck`
Expected: no errors. `satisfies` clauses catch any shape drift between the data and `content/types.ts`.

- [ ] **Step 12: Commit**

```bash
git add content
git commit -m "feat(content): add typed copy modules for all marketing pages"
```

---

## Task 4: Site chrome and the marketing layout

Header, mobile navigation, footer, skip link. The mobile nav carries the hardest accessibility requirements in the whole build — focus trap, `Esc` to close, focus restoration — so it gets the most test coverage.

**Files:**
- Create: `ui/marketing/site-header.tsx`, `ui/marketing/mobile-nav.tsx`, `ui/marketing/site-footer.tsx`, `ui/marketing/logo.tsx`, `ui/marketing/site-header.test.tsx`, `ui/marketing/mobile-nav.test.tsx`
- Create: `app/(marketing)/layout.tsx`

**Interfaces:**
- Consumes: `headerLinks`, `headerCtas`, `footerColumns`, `footerTagline`, `copyright` from `content/nav.ts`; `Button`, `Container` from `ui/primitives`; `cn` from `lib/cn`.
- Produces:
  - `Logo({ tone?: 'light' | 'dark'; className? })` — the comp's rounded green square with a brass three-quarter ring plus the Spectral wordmark.
  - `SiteHeader()` — sticky, 72px tall, translucent with backdrop blur.
  - `MobileNav({ links, ctas })` — client component, the `md`-and-below navigation.
  - `SiteFooter()`.

- [ ] **Step 1: Write the failing header test**

Create `ui/marketing/site-header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteHeader } from './site-header'

describe('SiteHeader', () => {
  it('renders a banner landmark', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('links to every in-scope marketing page', () => {
    render(<SiteHeader />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    expect(within(nav).getByRole('link', { name: 'Product' })).toHaveAttribute('href', '/product')
    expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing')
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('does not link to out-of-scope Blog or Help Center pages', () => {
    render(<SiteHeader />)
    expect(screen.queryByRole('link', { name: 'Blog' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Help Center' })).not.toBeInTheDocument()
    expect(screen.queryByText('Resources')).not.toBeInTheDocument()
  })

  it('renders exactly one brass CTA, per PRD §1.1 rule 3', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelectorAll('.bg-brass-600')).toHaveLength(1)
  })

  it('sends the home link to /', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: /Cofoundaz/ })).toHaveAttribute('href', '/')
  })
})
```

Add the `within` import at the top: `import { render, screen, within } from '@testing-library/react'`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/site-header.test.tsx`
Expected: FAIL — `Failed to resolve import "./site-header"`.

- [ ] **Step 3: Implement the Logo**

Create `ui/marketing/logo.tsx`:

```tsx
import Link from 'next/link'
import { cn } from '@/lib/cn'

export function Logo({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark'
  className?: string
}) {
  const isDark = tone === 'dark'
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[30px] w-[30px] items-center justify-center rounded-[9px] shadow-card',
          isDark ? 'bg-white' : 'bg-green-700'
        )}
      >
        <span
          className={cn(
            'h-[13px] w-[13px] rounded-full border-[2.5px] border-r-transparent',
            isDark ? 'border-brass-600' : 'border-brass-500'
          )}
        />
      </span>
      <span
        className={cn(
          'font-display text-xl font-semibold tracking-[-0.01em]',
          isDark ? 'text-white' : 'text-green-900'
        )}
      >
        Cofoundaz
      </span>
    </Link>
  )
}
```

- [ ] **Step 4: Implement SiteHeader**

Create `ui/marketing/site-header.tsx`:

```tsx
import Link from 'next/link'
import { Button } from '@/ui/primitives'
import { headerCtas, headerLinks } from '@/content/nav'
import { Logo } from './logo'
import { MobileNav } from './mobile-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-8 px-4 md:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-input px-3 py-2 text-sm font-medium text-sage-700 hover:bg-green-50 hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Button href={headerCtas.login.href} variant="ghost" size="sm" className="hidden lg:inline-flex">
            {headerCtas.login.label}
          </Button>
          <Button href={headerCtas.signup.href} variant="accent" size="sm">
            {headerCtas.signup.label}
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Write the failing mobile nav test**

Create `ui/marketing/mobile-nav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MobileNav } from './mobile-nav'

describe('MobileNav', () => {
  it('starts closed with aria-expanded false', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on click and exposes a labelled dialog', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    const trigger = screen.getByRole('button', { name: /open menu/i })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveFocus()
  })

  it('renders every header link plus both CTAs when open', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Product')
    expect(dialog).toHaveTextContent('Pricing')
    expect(dialog).toHaveTextContent('About')
    expect(dialog).toHaveTextContent('Log in')
    expect(dialog).toHaveTextContent('Start free')
  })

  it('moves focus into the panel when opened', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/mobile-nav.test.tsx`
Expected: FAIL — `Failed to resolve import "./mobile-nav"`.

- [ ] **Step 7: Implement MobileNav**

Create `ui/marketing/mobile-nav.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/ui/primitives'
import { headerCtas, headerLinks } from '@/content/nav'
import { cn } from '@/lib/cn'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close on route change so the panel never survives a navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Move focus into the panel on open; restore it to the trigger on close.
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    } else {
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: cycle within the panel.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-input text-green-700 hover:bg-green-50 lg:hidden"
      >
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span className={cn('absolute left-0 block h-0.5 w-5 bg-current transition-all', open ? 'top-2 rotate-45' : 'top-0')} />
          <span className={cn('absolute top-2 left-0 block h-0.5 w-5 bg-current transition-opacity', open && 'opacity-0')} />
          <span className={cn('absolute left-0 block h-0.5 w-5 bg-current transition-all', open ? 'top-2 -rotate-45' : 'top-4')} />
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-x-0 top-[72px] bottom-0 z-40 flex flex-col gap-2 border-t border-green-100 bg-white p-4 lg:hidden"
        >
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-input px-4 py-3 text-base font-medium text-sage-700 hover:bg-green-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-green-100 pt-4">
            <Button href={headerCtas.login.href} variant="secondary" size="md">
              {headerCtas.login.label}
            </Button>
            <Button href={headerCtas.signup.href} variant="accent" size="md">
              {headerCtas.signup.label}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
```

- [ ] **Step 8: Run both chrome tests to verify they pass**

Run: `npx vitest run ui/marketing`
Expected: PASS — 10 tests.

Note: the header test asserting a single `.bg-brass-600` counts only the desktop "Start free" button, because `MobileNav` renders its accent button inside the closed panel (not rendered). If the count is 2, check that the panel is conditionally rendered rather than hidden with CSS.

- [ ] **Step 9: Implement SiteFooter**

Create `ui/marketing/site-footer.tsx`:

```tsx
import Link from 'next/link'
import { Container } from '@/ui/primitives'
import { copyright, footerColumns, footerTagline } from '@/content/nav'
import { Logo } from './logo'

export function SiteFooter() {
  return (
    <footer className="bg-green-950 text-green-300">
      <Container className="grid grid-cols-1 gap-8 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-3.5 max-w-[26ch] text-[13px] leading-relaxed text-green-400">
            {footerTagline}
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3.5 text-xs font-bold uppercase tracking-[0.06em] text-green-200">
              {column.title}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-green-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <Container className="flex flex-col items-center justify-between gap-4 border-t border-green-900 py-5 text-[13px] text-green-400 md:flex-row">
        <span>{copyright}</span>
      </Container>
    </footer>
  )
}
```

> The comp's footer social icons (`𝕏`, `in`) both routed to `navSecurity`, which is clearly placeholder wiring. They are omitted until real social URLs exist rather than shipped pointing at the security page.

- [ ] **Step 10: Create the marketing layout**

Create `app/(marketing)/layout.tsx`. The skip link is the first focusable element on every marketing page.

```tsx
import { SiteFooter } from '@/ui/marketing/site-footer'
import { SiteHeader } from '@/ui/marketing/site-header'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-input focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-green-700"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 11: Move the scaffold home page into the marketing group**

The create-next-app placeholder at `app/page.tsx` must move, or `/` will resolve twice.

```bash
git rm app/page.tsx
```

Create a temporary `app/(marketing)/page.tsx` so the route still builds; Task 6 replaces it:

```tsx
export default function HomePage() {
  return <div />
}
```

- [ ] **Step 12: Verify build and tests**

Run: `npm run typecheck && npx vitest run && npm run build`
Expected: all pass. Build output lists `/` as static.

- [ ] **Step 13: Commit**

```bash
git add ui/marketing app/\(marketing\) app/page.tsx
git commit -m "feat(ui): add site header, mobile nav, footer, and marketing layout"
```

---

## Task 5: Mock screenshot components

`ProductShot` and `AppFrame` are hand-built HTML/CSS in the comps, not images. Porting them to React means no asset pipeline, crisp rendering at any DPI, and themeable output. `ProductShot`'s radial gauge is also the first implementation of PRD §1.2's `ScoreGauge` and is directly reusable by Module 06 later.

**Files:**
- Create: `ui/mocks/product-shot.tsx`, `ui/mocks/app-frame.tsx`, `ui/mocks/mocks.test.tsx`

**Interfaces:**
- Consumes: `cn` from `lib/cn`.
- Produces:
  - `ProductShot({ className? })` — browser-chrome frame containing a mock dashboard.
  - `AppFrame({ variant, className? })` where `variant: 'overview' | 'build' | 'grow' | 'fund' | 'resources'`.

- [ ] **Step 1: Write the failing mocks test**

Create `ui/mocks/mocks.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/mocks/mocks.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Implement ProductShot**

Port of `ProductShot.dc.html`. The gauge uses `stroke-dasharray="327"` with `stroke-dashoffset` animating from 327 to 91, which renders a 72/100 score. The whole frame is `aria-hidden` because it is decorative imagery whose informational content is already in the surrounding copy.

Create `ui/mocks/product-shot.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function ProductShot({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-[14px] border border-green-100 bg-white shadow-raised',
        className
      )}
    >
      <div className="flex h-[38px] items-center gap-[7px] bg-green-900 px-3.5">
        <span className="h-[9px] w-[9px] rounded-full bg-green-400" />
        <span className="h-[9px] w-[9px] rounded-full bg-green-300" />
        <span className="h-[9px] w-[9px] rounded-full bg-green-200" />
        <span className="ml-3 text-[11px] font-semibold text-green-300">
          app.cofoundaz.com/dashboard
        </span>
      </div>

      <div className="grid grid-cols-[52px_1fr]">
        <div className="flex flex-col items-center gap-3.5 bg-green-900 py-3.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-green-700">
            <span className="h-[11px] w-[11px] rounded-full border-2 border-brass-500 border-r-transparent" />
          </span>
          <span className="h-[26px] w-[26px] rounded-[7px] bg-green-700" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
          <span className="h-[26px] w-[26px] rounded-[7px] bg-white/10" />
        </div>

        <div className="overflow-hidden bg-sage-100 p-5">
          <div className="font-display text-[17px] font-semibold text-green-900">
            Good morning, Amara.
          </div>
          <div className="mt-0.5 text-xs text-sage-500">
            Here’s where Kolo stands today.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-[150px_1fr]">
            <div className="flex flex-col items-center rounded-card border border-green-100 bg-white p-4">
              <div className="self-start text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">
                Startup Health
              </div>
              <div className="relative mt-2 h-[118px] w-[118px]">
                <svg width="118" height="118" viewBox="0 0 118 118">
                  <circle cx="59" cy="59" r="52" fill="none" stroke="var(--color-green-100)" strokeWidth="12" />
                  <circle
                    cx="59" cy="59" r="52" fill="none"
                    stroke="var(--color-green-500)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="327" strokeDashoffset="91"
                    transform="rotate(-90 59 59)"
                    style={{ animation: 'ring-in 900ms ease-out both' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[34px] font-bold leading-none text-green-900">72</span>
                  <span className="text-[10px] font-semibold text-green-600">+4 this week</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">
                  Today’s Mission
                </div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-green-600 text-[10px] text-white">✓</span>
                  <span className="text-xs text-sage-500 line-through">Interview 3 gig workers</span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-[5px] border-[1.5px] border-sage-300" />
                  <span className="text-xs font-medium text-sage-900">Draft your Lean Canvas</span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-[5px] border-[1.5px] border-sage-300" />
                  <span className="text-xs font-medium text-sage-900">Set your pricing tiers</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">Runway</div>
                  <div className="mt-1 font-display text-[22px] font-bold text-green-900">8.4 mo</div>
                </div>
                <div className="rounded-card border border-green-100 bg-white px-3.5 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-sage-500">Monthly revenue</div>
                  <div className="mt-1 font-display text-[22px] font-bold text-green-900">₦1.6M</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-card bg-green-900 px-3.5 py-3">
            <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-brass-600 text-[13px] font-bold text-green-900">✦</span>
            <span className="text-xs text-green-100">
              Your riskiest untested assumption is pricing. Want an experiment for it?
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement AppFrame**

Open `../# Cofoundaz Web App UI Build/AppFrame.dc.html` and port each of the five `<sc-if>` blocks (lines 31–148: `isOverview`, `isBuild`, `isGrow`, `isFund`, `isResources`) into one React component with a `variant` prop.

Conversion rules, same as everywhere in this build:
- `<sc-if value="{{ isOverview }}">` → `{variant === 'overview' ? (…) : null}`
- `<sc-for list="{{ xs }}" as="x">` → `{xs.map((x) => …)}`
- Inline `style="background:#12291F"` → `className="bg-green-900"` using the token whose hex matches. Never leave a raw hex in the JSX — if a hex has no token, it is a comp error; use the nearest token and note it in the PR.
- The outer wrapper must carry `aria-hidden="true"` and accept `className`.

Signature:

```tsx
import { cn } from '@/lib/cn'

export type AppFrameVariant = 'overview' | 'build' | 'grow' | 'fund' | 'resources'

export function AppFrame({
  variant,
  className,
}: {
  variant: AppFrameVariant
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-[14px] border border-green-100 bg-white shadow-raised',
        className
      )}
    >
      {/* per-variant content ported from AppFrame.dc.html lines 31-148 */}
    </div>
  )
}
```

- [ ] **Step 5: Run the mocks test to verify it passes**

Run: `npx vitest run ui/mocks/mocks.test.tsx`
Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add ui/mocks
git commit -m "feat(ui): port ProductShot and AppFrame mock screenshots to React"
```

---

## Task 6: Home page

Seven sections. The testimonial carousel is the only client component and carries the D-2 reduced-motion requirement.

**Files:**
- Create: `ui/marketing/home/hero.tsx`, `problem-strip.tsx`, `how-it-works.tsx`, `feature-grid.tsx`, `testimonial-carousel.tsx`, `security-strip.tsx`, `cta-band.tsx`, `testimonial-carousel.test.tsx`, `home-sections.test.tsx`
- Modify: `app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `home` from `content/home.ts`; `Button`, `Card`, `Badge`, `Container`, `SectionHeading` from `ui/primitives`; `ProductShot` from `ui/mocks/product-shot`.
- Produces: `Hero()`, `ProblemStrip()`, `HowItWorks()`, `FeatureGrid()`, `TestimonialCarousel()`, `SecurityStrip()`, and a reusable `CtaBand({ title, ctaLabel, ctaHref, subtitle? })` also used by `/product` and `/pricing`.

- [ ] **Step 1: Write the failing carousel test**

The carousel must not auto-advance under reduced motion (D-2 / WCAG 2.2.2) and must be operable by keyboard.

Create `ui/marketing/home/testimonial-carousel.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/home/testimonial-carousel.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement TestimonialCarousel**

Create `ui/marketing/home/testimonial-carousel.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/ui/primitives'
import { home } from '@/content/home'
import { cn } from '@/lib/cn'

const ROTATE_MS = 6000

export function TestimonialCarousel() {
  const { title, quotes } = home.testimonials
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Deviation D-2 / WCAG 2.2.2: no auto-advancing motion under reduced motion.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const timer = setInterval(
      () => setIndex((value) => (value + 1) % quotes.length),
      ROTATE_MS
    )
    return () => clearInterval(timer)
  }, [quotes.length])

  const quote = quotes[index]

  return (
    <section className="bg-green-950 text-green-100">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <h2 className="font-display text-[28px] font-semibold text-white md:text-4xl">
          {title}
        </h2>

        <div aria-live="polite" className="mt-11 min-h-[190px]">
          <p className="mx-auto max-w-[28ch] font-display text-xl italic leading-[1.45] text-balance text-white md:text-[26px]">
            “{quote.text}”
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-[15px] font-bold text-white"
            >
              {quote.initials}
            </span>
            <div className="text-left">
              <div className="text-[15px] font-bold text-white">{quote.name}</div>
              <div className="text-[13px] text-green-300">{quote.company}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {quotes.map((item, i) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Show quote ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i === index ? 'bg-brass-500' : 'bg-white/25'
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Run the carousel test to verify it passes**

Run: `npx vitest run ui/marketing/home/testimonial-carousel.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Write the failing home sections test**

Create `ui/marketing/home/home-sections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Hero } from './hero'
import { ProblemStrip } from './problem-strip'
import { HowItWorks } from './how-it-works'
import { FeatureGrid } from './feature-grid'
import { SecurityStrip } from './security-strip'
import { CtaBand } from './cta-band'
import { home } from '@/content/home'

describe('Hero', () => {
  it('renders the single h1 with the comp headline', () => {
    render(<Hero />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'The co-founder who never sleeps.' })
    ).toBeInTheDocument()
  })

  it('links the primary CTA to signup and the secondary to the how-it-works anchor', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#how')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Hero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ProblemStrip', () => {
  it('renders all three problem cards', () => {
    render(<ProblemStrip />)
    for (const card of home.problem.cards) {
      expect(screen.getByRole('heading', { name: card.title })).toBeInTheDocument()
    }
  })

  it('hides decorative glyphs from assistive tech', () => {
    const { container } = render(<ProblemStrip />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})

describe('HowItWorks', () => {
  it('exposes the #how anchor targeted by the hero CTA', () => {
    const { container } = render(<HowItWorks />)
    expect(container.querySelector('#how')).toBeInTheDocument()
  })

  it('renders all three steps', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('heading', { name: 'Tell us about your startup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Do today’s mission' })).toBeInTheDocument()
  })
})

describe('FeatureGrid', () => {
  it('renders all eight tiles', () => {
    render(<FeatureGrid />)
    for (const tile of home.features.items) {
      expect(screen.getByRole('heading', { name: tile.title })).toBeInTheDocument()
    }
  })
})

describe('SecurityStrip', () => {
  it('renders the four security items', () => {
    render(<SecurityStrip />)
    for (const item of home.security.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })
})

describe('CtaBand', () => {
  it('renders the title, CTA, and subtitle', () => {
    render(<CtaBand title="Stop guessing. Start building." ctaLabel="Start free" ctaHref="/signup" subtitle="Set up in under 10 minutes." />)
    expect(screen.getByRole('heading', { name: 'Stop guessing. Start building.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
    expect(screen.getByText('Set up in under 10 minutes.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/home/home-sections.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 7: Implement the six home sections**

Create `ui/marketing/home/hero.tsx`:

```tsx
import { Badge, Button, Container } from '@/ui/primitives'
import { ProductShot } from '@/ui/mocks/product-shot'
import { home } from '@/content/home'

export function Hero() {
  const { badge, title, subtitle, primaryCta, secondaryCta, trustLine } = home.hero
  return (
    <section className="border-b border-green-100 bg-green-50">
      <Container className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="animate-[fade-up_0.6s_ease-out_both]">
          <Badge>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brass-600" />
            {badge}
          </Badge>
          <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] text-balance text-green-900 md:text-5xl lg:text-[60px]">
            {title}
          </h1>
          <p className="mt-5 max-w-[34ch] text-base leading-[1.55] text-sage-700 md:text-[19px]">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Button href={primaryCta.href} variant="accent" size="lg" className="shadow-accent">
              {primaryCta.label}
            </Button>
            <Button href={secondaryCta.href} variant="secondary" size="lg">
              {secondaryCta.label}
            </Button>
          </div>
          <p className="mt-4.5 text-sm italic text-sage-500">{trustLine}</p>
        </div>

        <div className="animate-[fade-up_0.7s_0.12s_ease-out_both]">
          <ProductShot />
        </div>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/home/problem-strip.tsx`:

```tsx
import { Card, Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function ProblemStrip() {
  return (
    <section>
      <Container className="py-16 md:py-22">
        <SectionHeading title={home.problem.title} className="mx-auto max-w-[20ch]" />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {home.problem.cards.map((card) => (
            <Card key={card.title} className="p-8">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-green-50 text-xl text-green-600"
              >
                {card.icon}
              </div>
              <h3 className="mb-2 mt-5 text-[19px] font-bold text-sage-900">{card.title}</h3>
              <p className="text-[15px] leading-relaxed text-sage-700">{card.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/home/how-it-works.tsx`:

```tsx
import { Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function HowItWorks() {
  const { eyebrow, title, steps } = home.howItWorks
  return (
    <section id="how" className="bg-green-900 scroll-mt-[72px]">
      <Container className="py-16 md:py-22">
        <SectionHeading tone="dark" eyebrow={eyebrow} title={title} />
        <div className="mt-13 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-[14px] border border-green-700 bg-green-800 p-8">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brass-500 font-display text-xl font-bold text-green-900"
              >
                {step.number}
              </div>
              <h3 className="mb-2 mt-5 text-xl font-bold text-white">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-green-200">{step.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/home/feature-grid.tsx`:

```tsx
import { Card, Container, SectionHeading } from '@/ui/primitives'
import { home } from '@/content/home'

export function FeatureGrid() {
  return (
    <section>
      <Container className="py-16 md:py-22">
        <SectionHeading title={home.features.title} />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {home.features.items.map((tile) => (
            <Card
              key={tile.title}
              className="p-6 transition-all hover:-translate-y-[3px] hover:shadow-raised"
            >
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-green-100 text-lg font-bold text-green-700"
              >
                {tile.icon}
              </div>
              <h3 className="mb-1.5 mt-4 text-base font-bold text-sage-900">{tile.title}</h3>
              <p className="text-sm leading-[1.55] text-sage-500">{tile.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/home/security-strip.tsx`:

```tsx
import { Container } from '@/ui/primitives'
import { home } from '@/content/home'

export function SecurityStrip() {
  return (
    <section>
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 rounded-modal border border-green-100 bg-green-50 p-8 md:p-13 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-modal bg-green-700 text-[22px] text-brass-500"
            >
              🛡
            </div>
            <h2 className="mb-3 mt-5 font-display text-[26px] font-semibold text-green-900 md:text-[32px]">
              {home.security.title}
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-sage-700">
              {home.security.body}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {home.security.items.map((item) => (
              <div key={item.title} className="rounded-[10px] border border-green-100 bg-white p-4">
                <div className="text-[13px] font-bold text-sage-900">{item.title}</div>
                <div className="mt-1 text-[12.5px] leading-[1.5] text-sage-500">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/home/cta-band.tsx` (reused by `/product` and `/pricing`):

```tsx
import { Button, Container } from '@/ui/primitives'
import { cn } from '@/lib/cn'

export function CtaBand({
  title,
  ctaLabel,
  ctaHref,
  subtitle,
  tone = 'dark',
}: {
  title: string
  ctaLabel: string
  ctaHref: string
  subtitle?: string
  tone?: 'dark' | 'light'
}) {
  const isDark = tone === 'dark'
  return (
    <section className={isDark ? 'bg-green-900' : 'bg-green-50'}>
      <Container className="py-20 text-center md:py-24">
        <h2
          className={cn(
            'font-display text-[32px] font-semibold tracking-[-0.02em] text-balance md:text-[42px] lg:text-[46px]',
            isDark ? 'text-white' : 'text-green-900'
          )}
        >
          {title}
        </h2>
        <div className="mt-8">
          <Button href={ctaHref} variant="accent" size="lg">
            {ctaLabel}
          </Button>
        </div>
        {subtitle ? (
          <p className={cn('mt-4.5 text-sm italic', isDark ? 'text-green-300' : 'text-sage-500')}>
            {subtitle}
          </p>
        ) : null}
      </Container>
    </section>
  )
}
```

- [ ] **Step 8: Run the home section tests to verify they pass**

Run: `npx vitest run ui/marketing/home`
Expected: PASS — 15 tests.

- [ ] **Step 9: Compose the home page**

Replace `app/(marketing)/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Hero } from '@/ui/marketing/home/hero'
import { ProblemStrip } from '@/ui/marketing/home/problem-strip'
import { HowItWorks } from '@/ui/marketing/home/how-it-works'
import { FeatureGrid } from '@/ui/marketing/home/feature-grid'
import { TestimonialCarousel } from '@/ui/marketing/home/testimonial-carousel'
import { SecurityStrip } from '@/ui/marketing/home/security-strip'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { home } from '@/content/home'

export const metadata: Metadata = {
  description: home.hero.subtitle,
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <FeatureGrid />
      <TestimonialCarousel />
      <SecurityStrip />
      <CtaBand
        title={home.finalCta.title}
        ctaLabel={home.finalCta.cta.label}
        ctaHref={home.finalCta.cta.href}
        subtitle={home.finalCta.subtitle}
      />
    </>
  )
}
```

- [ ] **Step 10: Verify the page renders statically**

Run: `npm run build`
Expected: build succeeds and `/` is listed as a static route (`○`). If it shows as dynamic, a section is using a request-time API.

- [ ] **Step 11: Commit**

```bash
git add ui/marketing/home app/\(marketing\)/page.tsx
git commit -m "feat(marketing): build the home page"
```

---

## Task 7: Product page

Five alternating hub sections plus a sticky scroll-spy sub-nav. The sub-nav must work without JavaScript — real anchor links, with JS adding only the active highlight.

**Files:**
- Create: `ui/marketing/product/product-hero.tsx`, `scroll-spy-nav.tsx`, `hub-section.tsx`, `score-band.tsx`, `scroll-spy-nav.test.tsx`, `product-sections.test.tsx`
- Create: `app/(marketing)/product/page.tsx`

**Interfaces:**
- Consumes: `product` from `content/product.ts`; `AppFrame` from `ui/mocks/app-frame`; `CtaBand` from `ui/marketing/home/cta-band`.
- Produces: `ProductHero()`, `ScrollSpyNav()`, `HubSection({ group, index })`, `ScoreBand()`.

- [ ] **Step 1: Write the failing scroll-spy test**

Create `ui/marketing/product/scroll-spy-nav.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/product/scroll-spy-nav.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement ScrollSpyNav**

Create `ui/marketing/product/scroll-spy-nav.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { product } from '@/content/product'
import { cn } from '@/lib/cn'

export function ScrollSpyNav() {
  const [active, setActive] = useState(product.subNav[0].anchor)

  useEffect(() => {
    const sections = product.subNav
      .map((item) => document.getElementById(item.anchor))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-140px 0px -60% 0px' }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sticky top-[71px] z-30 border-b border-green-100 bg-white/92 backdrop-blur-[12px]">
      <nav
        aria-label="Product sections"
        className="mx-auto flex h-14 max-w-[1280px] items-center gap-1.5 overflow-x-auto px-4 md:justify-center md:flex-wrap md:px-6"
      >
        {product.subNav.map((item) => (
          <a
            key={item.anchor}
            href={`#${item.anchor}`}
            aria-current={active === item.anchor ? 'true' : undefined}
            className={cn(
              'whitespace-nowrap rounded-pill border px-4 py-2 text-[13.5px] font-semibold transition-colors',
              active === item.anchor
                ? 'border-green-200 bg-green-100 text-green-700'
                : 'border-green-100 bg-green-50 text-sage-700 hover:bg-green-100'
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: Write the failing product sections test**

Create `ui/marketing/product/product-sections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ProductHero } from './product-hero'
import { HubSection } from './hub-section'
import { ScoreBand } from './score-band'
import { product } from '@/content/product'

describe('ProductHero', () => {
  it('renders the h1 and the three stats', () => {
    render(<ProductHero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(product.hero.title)
    expect(screen.getByText('26')).toBeInTheDocument()
    expect(screen.getByText('connected modules')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ProductHero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('HubSection', () => {
  it('renders with the anchor id the sub-nav targets', () => {
    const group = product.hubGroups[0]
    const { container } = render(<HubSection group={group} index={0} />)
    expect(container.querySelector(`#${group.anchor}`)).toBeInTheDocument()
  })

  it('renders the kicker, title, three items, and metric', () => {
    const group = product.hubGroups[1]
    render(<HubSection group={group} index={1} />)
    expect(screen.getByText(group.kicker)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: group.title })).toBeInTheDocument()
    for (const item of group.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument()
    }
    expect(screen.getByText(group.metric)).toBeInTheDocument()
  })

  it('uses AA-safe brass-700 for the kicker on a light surface', () => {
    render(<HubSection group={product.hubGroups[0]} index={0} />)
    expect(screen.getByText('Overview').className).toContain('text-brass-700')
  })
})

describe('ScoreBand', () => {
  it('renders the three explainer cards', () => {
    render(<ScoreBand />)
    for (const card of product.scoreBand.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/product/product-sections.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 6: Implement the product sections**

Create `ui/marketing/product/product-hero.tsx`:

```tsx
import { Button, Container, SectionHeading } from '@/ui/primitives'
import { product } from '@/content/product'

export function ProductHero() {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta, stats } = product.hero
  return (
    <section className="bg-green-900">
      <Container className="py-16 text-center md:py-20">
        <SectionHeading as="h1" tone="dark" eyebrow={eyebrow} title={title} className="mx-auto max-w-[18ch]" />
        <p className="mx-auto mt-5 max-w-[62ch] text-base leading-relaxed text-green-200 md:text-[19px]">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
          <Button href={primaryCta.href} variant="accent" size="lg">{primaryCta.label}</Button>
          <Button href={secondaryCta.href} variant="onDark" size="lg">{secondaryCta.label}</Button>
        </div>
        <dl className="mt-13 flex flex-wrap justify-center gap-10 md:gap-14">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-[34px] font-bold text-white">{stat.value}</span>
                <span className="mt-0.5 block text-[13px] text-green-300">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
```

Create `ui/marketing/product/hub-section.tsx`. `index` drives the alternating layout at `lg`.

```tsx
import { AppFrame } from '@/ui/mocks/app-frame'
import type { HubGroup } from '@/content/types'
import { cn } from '@/lib/cn'

export function HubSection({ group, index }: { group: HubGroup; index: number }) {
  const reversed = index % 2 === 1
  return (
    <div
      id={group.anchor}
      className="grid scroll-mt-[140px] grid-cols-1 gap-10 border-t border-green-100 py-14 lg:grid-cols-[1fr_1.15fr] lg:gap-14"
    >
      <div className={cn(reversed && 'lg:order-2')}>
        {/* Deviation D-1: brass-700, not brass-600, for brass text on light. */}
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brass-700">
          {group.kicker}
        </span>
        <h2 className="mb-3.5 mt-2.5 font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.01em] text-green-900 md:text-[34px]">
          {group.title}
        </h2>
        <p className="mb-5 text-base leading-[1.62] text-sage-700">{group.blurb}</p>

        <ul className="flex flex-col gap-3.5">
          {group.items.map((item) => (
            <li key={item.name} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[7px] bg-green-100 text-xs font-bold text-green-700"
              >
                ✓
              </span>
              <div>
                <div className="text-[15px] font-bold text-sage-900">{item.name}</div>
                <div className="text-[14.5px] leading-[1.5] text-sage-500">{item.body}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-3.5 border-t border-green-50 pt-5">
          <div className="font-display text-[26px] font-bold text-green-700">{group.metric}</div>
          <div className="max-w-[22ch] text-[13.5px] leading-[1.35] text-sage-500">
            {group.metricLabel}
          </div>
        </div>
      </div>

      <div className={cn(reversed && 'lg:order-1')}>
        <AppFrame variant={group.variant} />
      </div>
    </div>
  )
}
```

Create `ui/marketing/product/score-band.tsx`:

```tsx
import { Container, SectionHeading } from '@/ui/primitives'
import { product } from '@/content/product'

export function ScoreBand() {
  const { eyebrow, title, body, cards } = product.scoreBand
  return (
    <section className="bg-green-950">
      <Container width="narrow" className="py-16 text-center md:py-22">
        <SectionHeading tone="dark" eyebrow={eyebrow} title={title} />
        <p className="mx-auto mt-4.5 max-w-[58ch] text-base leading-relaxed text-green-200 md:text-[17px]">
          {body}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 text-left md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-card border border-green-700 bg-green-900 p-6.5">
              <div className="text-base font-bold text-white">{card.title}</div>
              <p className="mt-2 text-sm leading-[1.55] text-green-200">{card.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 7: Run the product tests to verify they pass**

Run: `npx vitest run ui/marketing/product`
Expected: PASS — 8 tests.

- [ ] **Step 8: Compose the product page**

Create `app/(marketing)/product/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container } from '@/ui/primitives'
import { ProductHero } from '@/ui/marketing/product/product-hero'
import { ScrollSpyNav } from '@/ui/marketing/product/scroll-spy-nav'
import { HubSection } from '@/ui/marketing/product/hub-section'
import { ScoreBand } from '@/ui/marketing/product/score-band'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { product } from '@/content/product'

export const metadata: Metadata = {
  title: 'Product',
  description: product.hero.subtitle,
  alternates: { canonical: '/product' },
}

export default function ProductPage() {
  return (
    <>
      <ProductHero />
      <ScrollSpyNav />
      <Container width="narrow" className="pb-6 pt-2">
        {product.hubGroups.map((group, index) => (
          <HubSection key={group.anchor} group={group} index={index} />
        ))}
      </Container>
      <ScoreBand />
      <CtaBand
        tone="light"
        title={product.finalCta.title}
        ctaLabel={product.finalCta.cta.label}
        ctaHref={product.finalCta.cta.href}
        subtitle={product.finalCta.subtitle}
      />
    </>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add ui/marketing/product app/\(marketing\)/product
git commit -m "feat(marketing): build the product page"
```

---

## Task 8: Pricing page

The densest page: three plan cards, a scrolling comparison matrix, and an accessible FAQ accordion.

**Files:**
- Create: `ui/marketing/pricing/pricing-card.tsx`, `comparison-matrix.tsx`, `faq-accordion.tsx`, `credit-panel.tsx`, `wordmark-row.tsx`, `every-plan-band.tsx`, `faq-accordion.test.tsx`, `pricing-sections.test.tsx`
- Create: `app/(marketing)/pricing/page.tsx`

**Interfaces:**
- Consumes: `pricing` from `content/pricing.ts`; `Button`, `Badge`, `Container`, `SectionHeading` from `ui/primitives`; `CtaBand`.
- Produces: `PricingCard({ plan })`, `ComparisonMatrix()`, `FaqAccordion()`, `CreditPanel()`, `WordmarkRow()`, `EveryPlanBand()`.

- [ ] **Step 1: Write the failing accordion test**

Create `ui/marketing/pricing/faq-accordion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { FaqAccordion } from './faq-accordion'
import { pricing } from '@/content/pricing'

describe('FaqAccordion', () => {
  it('renders a button per question', () => {
    render(<FaqAccordion />)
    for (const item of pricing.faq) {
      expect(screen.getByRole('button', { name: new RegExp(item.question) })).toBeInTheDocument()
    }
  })

  it('opens the first item by default, matching the comp', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(pricing.faq[0].answer)).toBeVisible()
  })

  it('opens one item at a time', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion />)
    await user.click(screen.getByRole('button', { name: new RegExp(pricing.faq[1].question) }))
    expect(screen.getByRole('button', { name: new RegExp(pricing.faq[1].question) })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })).toHaveAttribute('aria-expanded', 'false')
  })

  it('collapses an open item when clicked again', async () => {
    const user = userEvent.setup()
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(pricing.faq[0].answer)).not.toBeInTheDocument()
  })

  it('associates each panel with its trigger', () => {
    render(<FaqAccordion />)
    const first = screen.getByRole('button', { name: new RegExp(pricing.faq[0].question) })
    const panelId = first.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId!)).toHaveAttribute('role', 'region')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FaqAccordion />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/pricing/faq-accordion.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement FaqAccordion**

Not a `<details>` element: the comp's single-open behaviour and `+`/`−` affordance need controlled state.

Create `ui/marketing/pricing/faq-accordion.tsx`:

```tsx
'use client'

import { useId, useState } from 'react'
import { pricing } from '@/content/pricing'

export function FaqAccordion() {
  const [open, setOpen] = useState(0)
  const baseId = useId()

  return (
    <div className="flex flex-col gap-3">
      {pricing.faq.map((item, index) => {
        const isOpen = open === index
        const triggerId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div key={item.question} className="overflow-hidden rounded-card border border-green-100 bg-white">
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
            >
              <span className="text-base font-semibold text-sage-900">{item.question}</span>
              {/* Deviation D-1: brass-700 for brass text on a white surface. */}
              <span aria-hidden="true" className="flex-none text-lg font-semibold text-brass-700">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="px-5 pb-5 text-[15px] leading-relaxed text-sage-700"
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the accordion test to verify it passes**

Run: `npx vitest run ui/marketing/pricing/faq-accordion.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Write the failing pricing sections test**

Create `ui/marketing/pricing/pricing-sections.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { PricingCard } from './pricing-card'
import { ComparisonMatrix } from './comparison-matrix'
import { pricing } from '@/content/pricing'

const [starter, growth] = pricing.plans

describe('PricingCard', () => {
  it('shows the price when one is set', () => {
    render(<PricingCard plan={starter} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders no price element when pricing is still TBD', () => {
    const { container } = render(<PricingCard plan={growth} />)
    expect(container.querySelector('[data-price]')).toBeNull()
  })

  it('badges the most popular plan', () => {
    render(<PricingCard plan={growth} />)
    expect(screen.getByText('Most popular')).toBeInTheDocument()
  })

  it('renders every feature with a decorative tick', () => {
    render(<PricingCard plan={starter} />)
    for (const feature of starter.features) {
      expect(screen.getByText(feature)).toBeInTheDocument()
    }
  })

  it('sends its CTA to signup', () => {
    render(<PricingCard plan={starter} />)
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/signup')
  })
})

describe('ComparisonMatrix', () => {
  it('renders a real table with a column per plan', () => {
    render(<ComparisonMatrix />)
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Starter' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Growth' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Scale' })).toBeInTheDocument()
  })

  it('gives tick cells an accessible text equivalent', () => {
    render(<ComparisonMatrix />)
    expect(screen.getAllByText('Included').length).toBeGreaterThan(0)
  })

  it('makes the horizontal scroll container keyboard reachable', () => {
    const { container } = render(<ComparisonMatrix />)
    const scroller = container.querySelector('[data-matrix-scroll]')
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller).toHaveAttribute('role', 'region')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ComparisonMatrix />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/pricing/pricing-sections.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 7: Implement PricingCard**

Create `ui/marketing/pricing/pricing-card.tsx`:

```tsx
import { Badge, Button } from '@/ui/primitives'
import type { Plan } from '@/content/types'
import { cn } from '@/lib/cn'

export function PricingCard({ plan }: { plan: Plan }) {
  const dark = plan.popular
  return (
    <div
      className={cn(
        'relative rounded-modal p-8',
        dark
          ? 'border border-green-900 bg-green-900 shadow-raised'
          : 'border border-green-100 bg-white shadow-card'
      )}
    >
      {plan.popular ? (
        <Badge tone="accent" className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          Most popular
        </Badge>
      ) : null}

      <h3 className={cn('font-display text-2xl font-semibold', dark ? 'text-white' : 'text-green-900')}>
        {plan.name}
      </h3>
      <p className={cn('mt-1.5 text-sm', dark ? 'text-green-300' : 'text-sage-500')}>
        {plan.tagline}
      </p>

      {/* Growth and Scale have no price yet — PRD §3.3 marks tiers TBD by business,
          and the comp ships an empty price slot. Do not invent a number. */}
      {plan.price ? (
        <div data-price className="mt-5 mb-1 flex items-baseline gap-1">
          <span className={cn('font-display text-[40px] font-bold', dark ? 'text-white' : 'text-green-900')}>
            {plan.price}
          </span>
          {plan.per ? (
            <span className={cn('text-sm', dark ? 'text-green-300' : 'text-sage-500')}>{plan.per}</span>
          ) : null}
        </div>
      ) : (
        <div aria-hidden="true" className="mt-5 mb-1 h-[48px]" />
      )}

      <Button
        href="/signup"
        variant={dark ? 'accent' : 'secondary'}
        size="md"
        className="my-5 w-full"
      >
        Start free
      </Button>

      <ul className="flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className={cn('flex gap-2.5 text-sm leading-[1.45]', dark ? 'text-green-100' : 'text-sage-700')}
          >
            <span aria-hidden="true" className={cn('flex-none font-bold', dark ? 'text-brass-500' : 'text-green-600')}>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 8: Implement ComparisonMatrix**

The comp built this from `div` grids. Use a real `<table>` instead — a feature comparison is tabular data, and semantic table markup is what makes it navigable by screen reader. Ticks get a visually hidden "Included" text equivalent so meaning is never colour- or glyph-only (PRD §1.1 rule 5).

Create `ui/marketing/pricing/comparison-matrix.tsx`:

```tsx
import { pricing } from '@/content/pricing'
import type { MatrixCell } from '@/content/types'

function Cell({ cell }: { cell: MatrixCell }) {
  if (cell.kind === 'yes') {
    return (
      <>
        <span aria-hidden="true" className="text-[15px] font-bold text-green-600">✓</span>
        <span className="sr-only">Included</span>
      </>
    )
  }
  return <span className="text-[13px] font-semibold text-sage-500">{cell.value}</span>
}

export function ComparisonMatrix() {
  return (
    <div
      data-matrix-scroll
      role="region"
      aria-label={pricing.matrixTitle}
      tabIndex={0}
      className="overflow-x-auto rounded-[14px] border border-green-100 bg-white shadow-card"
    >
      <table className="w-full min-w-[560px] border-collapse text-left">
        <caption className="sr-only">{pricing.matrixTitle}</caption>
        <thead>
          <tr className="bg-green-900 text-white">
            <th scope="col" className="px-5 py-4 text-[13px] font-bold">Features</th>
            <th scope="col" className="px-4 py-4 text-center text-[13px] font-bold">Starter</th>
            <th scope="col" className="px-4 py-4 text-center text-[13px] font-bold text-brass-500">Growth</th>
            <th scope="col" className="px-4 py-4 text-center text-[13px] font-bold">Scale</th>
          </tr>
        </thead>
        {pricing.matrix.map((section) => (
          <tbody key={section.section}>
            <tr>
              <th
                colSpan={4}
                scope="colgroup"
                className="border-t border-green-100 bg-sage-100 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-sage-500"
              >
                {section.section}
              </th>
            </tr>
            {section.rows.map((row) => (
              <tr key={row.feature} className="border-t border-green-50">
                <th scope="row" className="px-5 py-3.5 text-sm font-normal text-sage-900">
                  {row.feature}
                </th>
                <td className="px-3 py-3.5 text-center"><Cell cell={row.starter} /></td>
                <td className="bg-green-50 px-3 py-3.5 text-center"><Cell cell={row.growth} /></td>
                <td className="px-3 py-3.5 text-center"><Cell cell={row.scale} /></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
```

- [ ] **Step 9: Implement the three remaining pricing sections**

Create `ui/marketing/pricing/every-plan-band.tsx` — `green-900` band rendering `pricing.everyPlan.title` as an `h2` and `items` as a tick list in `md:grid-cols-3`, ticks `aria-hidden` with an `sr-only` "Included".

Create `ui/marketing/pricing/credit-panel.tsx` — `green-50` rounded panel, two columns at `lg`: left is `pricing.credits.title` (`h2`) plus `body`; right maps `examples` to rows with the label left and value right in `text-green-700`.

Create `ui/marketing/pricing/wordmark-row.tsx` — centred `pricing.wordmarks.title` in `text-xs font-bold uppercase tracking-[0.08em] text-sage-500`, then `names` as `font-display text-xl font-semibold text-sage-700` in a wrapping flex row with `opacity-72`.

Each follows the same structural pattern as `SecurityStrip` from Task 6: a `<section>`, a `<Container>`, a heading, and a mapped list.

- [ ] **Step 10: Run the pricing tests to verify they pass**

Run: `npx vitest run ui/marketing/pricing`
Expected: PASS — 15 tests.

- [ ] **Step 11: Compose the pricing page**

Create `app/(marketing)/pricing/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container, SectionHeading } from '@/ui/primitives'
import { PricingCard } from '@/ui/marketing/pricing/pricing-card'
import { ComparisonMatrix } from '@/ui/marketing/pricing/comparison-matrix'
import { FaqAccordion } from '@/ui/marketing/pricing/faq-accordion'
import { CreditPanel } from '@/ui/marketing/pricing/credit-panel'
import { WordmarkRow } from '@/ui/marketing/pricing/wordmark-row'
import { EveryPlanBand } from '@/ui/marketing/pricing/every-plan-band'
import { CtaBand } from '@/ui/marketing/home/cta-band'
import { pricing } from '@/content/pricing'

export const metadata: Metadata = {
  title: 'Pricing',
  description: pricing.hero.subtitle,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <Container className="pb-6 pt-16 text-center">
        <SectionHeading as="h1" eyebrow={pricing.hero.eyebrow} title={pricing.hero.title} subtitle={pricing.hero.subtitle} className="[&_p]:max-w-[52ch]" />
        <ul className="mt-5 flex flex-wrap justify-center gap-5 text-[13.5px] text-sage-500">
          {pricing.hero.ticks.map((tick) => (
            <li key={tick}>
              <span aria-hidden="true">✓ </span>
              {tick}
            </li>
          ))}
        </ul>
      </Container>

      {/* Growth first at sm so the recommended plan is not buried below the fold. */}
      <Container width="narrow" className="grid grid-cols-1 items-start gap-5.5 py-6 lg:grid-cols-3">
        <div className="order-2 lg:order-1"><PricingCard plan={pricing.plans[0]} /></div>
        <div className="order-1 lg:order-2"><PricingCard plan={pricing.plans[1]} /></div>
        <div className="order-3"><PricingCard plan={pricing.plans[2]} /></div>
      </Container>

      <Container width="narrow" className="pb-14">
        <p className="rounded-card border border-brass-200 bg-brass-100 px-6 py-5 text-center text-[15px] font-semibold text-brass-700">
          {pricing.addOnsBanner}
        </p>
      </Container>

      <EveryPlanBand />

      <Container width="prose" className="max-w-[1080px] pt-18">
        <SectionHeading title={pricing.matrixTitle} className="mb-8" />
        <ComparisonMatrix />
      </Container>

      <CreditPanel />
      <WordmarkRow />

      <Container width="prose" className="pb-24 pt-12">
        <SectionHeading title={pricing.faqTitle} className="mb-7" />
        <FaqAccordion />
      </Container>

      <CtaBand
        title={pricing.finalCta.title}
        ctaLabel={pricing.finalCta.cta.label}
        ctaHref={pricing.finalCta.cta.href}
      />
    </>
  )
}
```

- [ ] **Step 12: Commit**

```bash
git add ui/marketing/pricing app/\(marketing\)/pricing
git commit -m "feat(marketing): build the pricing page"
```

---

## Task 9: About page

Seven sections, all static. No new interaction patterns, so this task is composition over the primitives already built.

**Files:**
- Create: `ui/marketing/about/why-section.tsx`, `story-timeline.tsx`, `values-grid.tsx`, `team-grid.tsx`, `about-sections.test.tsx`
- Create: `app/(marketing)/about/page.tsx`

**Interfaces:**
- Consumes: `about` from `content/about.ts`; `Button`, `Card`, `Container`, `SectionHeading`; `CtaBand`.
- Produces: `WhySection()`, `StoryTimeline()`, `ValuesGrid()`, `TeamGrid()`.

- [ ] **Step 1: Write the failing about sections test**

Create `ui/marketing/about/about-sections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { WhySection } from './why-section'
import { StoryTimeline } from './story-timeline'
import { ValuesGrid } from './values-grid'
import { TeamGrid } from './team-grid'
import { about } from '@/content/about'

describe('WhySection', () => {
  it('renders both paragraphs and the three stats', () => {
    render(<WhySection />)
    expect(screen.getByRole('heading', { name: about.why.title })).toBeInTheDocument()
    expect(screen.getByText(about.why.paragraphs[0])).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
  })
})

describe('StoryTimeline', () => {
  it('renders an ordered list of the four entries', () => {
    render(<StoryTimeline />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(about.story.length)
    expect(screen.getByRole('heading', { name: 'A frustrating pattern' })).toBeInTheDocument()
  })
})

describe('ValuesGrid', () => {
  it('renders all four values', () => {
    render(<ValuesGrid />)
    for (const value of about.values) {
      expect(screen.getByRole('heading', { name: value.title })).toBeInTheDocument()
    }
  })
})

describe('TeamGrid', () => {
  it('renders all six members and the hiring CTA', () => {
    render(<TeamGrid />)
    for (const member of about.team) {
      expect(screen.getByText(member.name)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '/contact')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TeamGrid />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/about/about-sections.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Implement StoryTimeline**

The only section with non-obvious markup — a semantic `<ol>` with a year rail that collapses above the body at `sm`.

Create `ui/marketing/about/story-timeline.tsx`:

```tsx
import { Container, SectionHeading } from '@/ui/primitives'
import { about } from '@/content/about'

export function StoryTimeline() {
  return (
    <section>
      <Container width="prose" className="max-w-[820px] py-16 md:py-18">
        <SectionHeading title={about.storyTitle} className="mb-10" />
        <ol className="flex flex-col">
          {about.story.map((entry, index) => (
            <li
              key={`${entry.year}-${entry.title}`}
              className="grid grid-cols-1 gap-2 pb-8 md:grid-cols-[80px_1fr] md:gap-6"
            >
              {/* Deviation D-1: brass-700 for brass text on a white surface. */}
              <div className="pt-0.5 font-display text-lg font-bold text-brass-700 md:text-right">
                {entry.year}
              </div>
              <div className="relative border-l-2 border-green-100 pl-6">
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-green-700"
                />
                <h3 className="text-[17px] font-bold text-sage-900">{entry.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-sage-500">{entry.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Implement the three remaining about sections**

Create `ui/marketing/about/why-section.tsx` — `lg:grid-cols-[1.1fr_0.9fr]`; left is `about.why.title` (`h2`) plus both paragraphs; right is a `green-900` rounded panel listing `about.stats` as `font-display text-[38px] text-white` values over `text-green-300` labels.

Create `ui/marketing/about/values-grid.tsx` — `about.valuesTitle` (`h2`) over a `md:grid-cols-2` of `Card`s; each shows `value.number` in a `green-100` rounded square (`aria-hidden`), then title and body.

Create `ui/marketing/about/team-grid.tsx` — `green-50` section, `about.teamTitle` (`h2`), a `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` of centred `Card`s with an initials circle (`aria-hidden`, `bg-green-600`), name, and role; then the `green-900` hiring band with `about.hiring.title`, `subtitle`, and a `Button` to `about.hiring.cta.href`.

Follow the structural pattern of `FeatureGrid` and `SecurityStrip` from Task 6.

- [ ] **Step 5: Run the about tests to verify they pass**

Run: `npx vitest run ui/marketing/about`
Expected: PASS — 6 tests.

- [ ] **Step 6: Compose the about page**

Create `app/(marketing)/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Button, Container, SectionHeading } from '@/ui/primitives'
import { WhySection } from '@/ui/marketing/about/why-section'
import { StoryTimeline } from '@/ui/marketing/about/story-timeline'
import { ValuesGrid } from '@/ui/marketing/about/values-grid'
import { TeamGrid } from '@/ui/marketing/about/team-grid'
import { about } from '@/content/about'

export const metadata: Metadata = {
  title: 'About',
  description: about.hero.subtitle,
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <Container width="prose" className="max-w-[900px] pb-8 pt-16 text-center">
        <SectionHeading as="h1" eyebrow={about.hero.eyebrow} title={about.hero.title} subtitle={about.hero.subtitle} className="[&_p]:max-w-[58ch]" />
      </Container>

      <WhySection />

      <section className="bg-green-950">
        <Container width="prose" className="max-w-[820px] py-16 text-center">
          <p className="font-display text-xl italic leading-[1.45] text-balance text-white md:text-[28px]">
            {about.missionQuote}
          </p>
        </Container>
      </section>

      <StoryTimeline />
      <ValuesGrid />
      <TeamGrid />

      <Container className="pt-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-sage-500">
          {about.backers.title}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-10 opacity-72">
          {about.backers.names.map((name) => (
            <span key={name} className="font-display text-xl font-semibold text-sage-700">
              {name}
            </span>
          ))}
        </div>
      </Container>

      <Container className="py-18 text-center">
        <h2 className="font-display text-[28px] font-semibold text-balance text-green-900 md:text-4xl">
          {about.finalCta.title}
        </h2>
        <div className="mt-6 flex flex-col justify-center gap-3.5 sm:flex-row">
          <Button href={about.finalCta.primaryCta.href} variant="accent" size="lg">
            {about.finalCta.primaryCta.label}
          </Button>
          <Button href={about.finalCta.secondaryCta.href} variant="secondary" size="lg">
            {about.finalCta.secondaryCta.label}
          </Button>
        </div>
      </Container>
    </>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add ui/marketing/about app/\(marketing\)/about
git commit -m "feat(marketing): build the about page"
```

---

## Task 10: Contact page and form stub

The form validates and shows the success panel but posts nowhere. That is deliberate for this phase — the `TODO` names the future endpoint so it is unmissable.

**Files:**
- Create: `ui/primitives/field.tsx`, `ui/marketing/contact/contact-form.tsx`, `ui/marketing/contact/contact-form.test.tsx`
- Modify: `ui/primitives/index.ts`
- Create: `app/(marketing)/contact/page.tsx`

**Interfaces:**
- Consumes: `contact` from `content/contact.ts`; `Button`, `Container`.
- Produces:
  - `Field({ label, htmlFor, help?, children })` — label + control wrapper used here and by the auth shells in Task 12.
  - `ContactForm()` — client component owning submitted state.

- [ ] **Step 1: Write the failing contact form test**

Create `ui/marketing/contact/contact-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ContactForm } from './contact-form'
import { contact } from '@/content/contact'

describe('ContactForm', () => {
  it('gives every control a real label, not a placeholder', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Topic')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('offers the four PRD topics', () => {
    render(<ContactForm />)
    const select = screen.getByLabelText('Topic')
    for (const option of contact.fields.topic.options) {
      expect(within(select).getByRole('option', { name: option })).toBeInTheDocument()
    }
  })

  it('swaps the form for the success panel on submit', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText('Name'), 'Amara Nwosu')
    await user.type(screen.getByLabelText('Email'), 'amara@kolo.africa')
    await user.type(screen.getByLabelText('Message'), 'Hello')
    await user.click(screen.getByRole('button', { name: contact.submit }))

    expect(screen.getByText(contact.success)).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })

  it('announces success as a status region', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.type(screen.getByLabelText('Name'), 'Amara Nwosu')
    await user.type(screen.getByLabelText('Email'), 'amara@kolo.africa')
    await user.type(screen.getByLabelText('Message'), 'Hello')
    await user.click(screen.getByRole('button', { name: contact.submit }))
    expect(screen.getByRole('status')).toHaveTextContent(contact.success)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ContactForm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

Add `within` to the import: `import { render, screen, within } from '@testing-library/react'`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/contact/contact-form.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement the Field primitive**

Create `ui/primitives/field.tsx`:

```tsx
import { cn } from '@/lib/cn'

export const fieldControlClasses =
  'mt-1.5 w-full rounded-input border border-sage-300 bg-white px-3.5 py-3 text-[15px] text-sage-900 placeholder:text-sage-500'

export function Field({
  label,
  htmlFor,
  help,
  className,
  children,
}: {
  label: string
  htmlFor: string
  help?: string | null
  className?: string
  children: React.ReactNode
}) {
  const helpId = help ? `${htmlFor}-help` : undefined
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-sage-700">
        {label}
      </label>
      {children}
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs text-sage-500">
          {help}
        </span>
      ) : null}
    </div>
  )
}
```

Add to `ui/primitives/index.ts`:

```ts
export { Field, fieldControlClasses } from './field'
```

- [ ] **Step 4: Implement ContactForm**

Create `ui/marketing/contact/contact-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { contact } from '@/content/contact'

export function ContactForm() {
  const [sent, setSent] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO(marketing-backend): POST to /api/v1/marketing/contact once the
    // FastAPI marketing domain exists. Deliberately unwired for this phase —
    // see spec §3 "Explicitly out of scope".
    setSent(true)
  }

  if (sent) {
    return (
      <div
        role="status"
        className="mt-9 rounded-card border border-green-200 bg-green-100 p-8 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-[22px] text-white"
        >
          ✓
        </span>
        <p className="text-[17px] font-semibold text-green-900">{contact.success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-4.5">
      <Field label={contact.fields.name.label} htmlFor="contact-name">
        <input
          id="contact-name"
          name="name"
          required
          className={fieldControlClasses}
          placeholder={contact.fields.name.placeholder}
        />
      </Field>

      <Field label={contact.fields.email.label} htmlFor="contact-email">
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className={fieldControlClasses}
          placeholder={contact.fields.email.placeholder}
        />
      </Field>

      <Field label={contact.fields.topic.label} htmlFor="contact-topic">
        <select id="contact-topic" name="topic" className={fieldControlClasses} defaultValue={contact.fields.topic.options[0]}>
          {contact.fields.topic.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </Field>

      <Field label={contact.fields.message.label} htmlFor="contact-message">
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className={`${fieldControlClasses} resize-y`}
          placeholder={contact.fields.message.placeholder}
        />
      </Field>

      <Button type="submit" variant="accent" size="md" className="w-full">
        {contact.submit}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Run the contact test to verify it passes**

Run: `npx vitest run ui/marketing/contact`
Expected: PASS — 5 tests.

- [ ] **Step 6: Compose the contact page**

Create `app/(marketing)/contact/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container } from '@/ui/primitives'
import { ContactForm } from '@/ui/marketing/contact/contact-form'
import { contact } from '@/content/contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: contact.subtitle,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <Container width="prose" className="max-w-[620px] pb-24 pt-16">
      <h1 className="text-center font-display text-[32px] font-semibold text-green-900 md:text-[40px]">
        {contact.title}
      </h1>
      <p className="mt-3 text-center text-base text-sage-500">{contact.subtitle}</p>
      <ContactForm />
    </Container>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add ui/primitives/field.tsx ui/primitives/index.ts ui/marketing/contact app/\(marketing\)/contact
git commit -m "feat(marketing): build the contact page with a stubbed form"
```

---

## Task 11: Legal pages and 404

Four legal documents over one template, plus the not-found page.

**Files:**
- Create: `ui/marketing/legal-document.tsx`, `ui/marketing/legal-document.test.tsx`
- Create: `app/(marketing)/(legal)/terms/page.tsx`, `privacy/page.tsx`, `security/page.tsx`, `cookies/page.tsx`
- Create: `app/not-found.tsx`

**Interfaces:**
- Consumes: `legalDocuments`, `legalBackLink` from `content/legal.ts`; `Container`, `Button`.
- Produces: `LegalDocumentView({ doc })` where `doc: LegalDocument`.

- [ ] **Step 1: Write the failing legal test**

Create `ui/marketing/legal-document.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { LegalDocumentView } from './legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.terms

describe('LegalDocumentView', () => {
  it('renders the title as the single h1', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByRole('heading', { level: 1, name: doc.title })).toBeInTheDocument()
  })

  it('shows the last-updated stamp', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByText(`Last updated: ${doc.updated}`)).toBeInTheDocument()
  })

  it('renders every section as an h2 with its body', () => {
    render(<LegalDocumentView doc={doc} />)
    for (const section of doc.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
      expect(screen.getByText(section.body)).toBeInTheDocument()
    }
  })

  it('offers a back-home link', () => {
    render(<LegalDocumentView doc={doc} />)
    expect(screen.getByRole('link', { name: /Back home/ })).toHaveAttribute('href', '/')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LegalDocumentView doc={doc} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/legal-document.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement LegalDocumentView**

Create `ui/marketing/legal-document.tsx`:

```tsx
import Link from 'next/link'
import { Container } from '@/ui/primitives'
import { legalBackLink } from '@/content/legal'
import type { LegalDocument } from '@/content/types'

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <Container width="prose" className="pb-24 pt-16">
      <Link href={legalBackLink.href} className="text-[13px] font-semibold text-sage-500 hover:text-green-700">
        {legalBackLink.label}
      </Link>

      <h1 className="mt-5 font-display text-[32px] font-semibold text-green-900 md:text-[40px]">
        {doc.title}
      </h1>
      <p className="mt-2.5 text-[13px] text-sage-500">Last updated: {doc.updated}</p>

      <hr className="my-7 border-green-100" />

      <p className="text-base leading-[1.7] text-sage-700">{doc.intro}</p>

      <div className="mt-8 flex flex-col gap-7">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2.5 text-[19px] font-bold text-sage-900">{section.heading}</h2>
            <p className="text-[15px] leading-[1.7] text-sage-700">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  )
}
```

- [ ] **Step 4: Run the legal test to verify it passes**

Run: `npx vitest run ui/marketing/legal-document.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Create the four legal pages**

Each is four lines over the shared template. Create `app/(marketing)/(legal)/terms/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { LegalDocumentView } from '@/ui/marketing/legal-document'
import { legalDocuments } from '@/content/legal'

const doc = legalDocuments.terms

export const metadata: Metadata = {
  title: doc.title,
  description: doc.intro,
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalDocumentView doc={doc} />
}
```

Repeat for `privacy` (`legalDocuments.privacy`, canonical `/privacy`), `security` (`legalDocuments.security`, canonical `/security`), and `cookies` (`legalDocuments.cookies`, canonical `/cookies`), changing only the `doc` constant, the canonical path, and the exported function name.

- [ ] **Step 6: Create the 404 page**

`not-found.tsx` sits at the app root, so it renders outside the `(marketing)` group and needs no header or footer wiring of its own.

Create `app/not-found.tsx`:

```tsx
import { Button } from '@/ui/primitives'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[620px] flex-col items-center px-4 py-28 text-center">
      <div aria-hidden="true" className="font-display text-[88px] font-bold leading-none text-green-100">
        404
      </div>
      <h1 className="mt-2 font-display text-[28px] font-semibold text-balance text-green-900 md:text-[34px]">
        Well, this page didn’t survive product-market fit.
      </h1>
      <div className="mt-7">
        <Button href="/" variant="accent" size="lg">
          Back home
        </Button>
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Verify the build lists all legal routes as static**

Run: `npm run build`
Expected: `/terms`, `/privacy`, `/security`, `/cookies` all listed as static (`○`).

- [ ] **Step 8: Commit**

```bash
git add ui/marketing/legal-document.tsx ui/marketing/legal-document.test.tsx app/\(marketing\)/\(legal\) app/not-found.tsx
git commit -m "feat(marketing): add legal pages and the 404 page"
```

---

## Task 12: Auth page shells

Presentational only. Buttons are inert with a `TODO` naming PRD Module 01's endpoints. Building these now is cheap because they share the comp's auth chrome, and it means the "Start free" CTA on every page lands somewhere real.

**Files:**
- Create: `ui/marketing/auth/auth-brand-panel.tsx`, `auth-form.tsx`, `auth-form.test.tsx`
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: `authModes`, `authShared`, `authPanel` from `content/auth.ts`; `Button`, `Field`, `fieldControlClasses`; `Logo`.
- Produces: `AuthBrandPanel()`, `AuthForm({ mode })` where `mode: 'login' | 'signup'`.

- [ ] **Step 1: Write the failing auth form test**

Create `ui/marketing/auth/auth-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AuthForm } from './auth-form'
import { authModes } from '@/content/auth'

describe('AuthForm signup mode', () => {
  it('renders the signup heading and CTA', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('heading', { level: 1, name: authModes.signup.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: authModes.signup.cta })).toBeInTheDocument()
  })

  it('shows the password help text and terms checkbox', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByText('8+ characters, one number')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('links terms and privacy', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('offers a link to log in instead', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })
})

describe('AuthForm login mode', () => {
  it('renders the login heading and CTA', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByRole('heading', { level: 1, name: authModes.login.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: authModes.login.cta })).toBeInTheDocument()
  })

  it('omits the terms checkbox and password help', () => {
    render(<AuthForm mode="login" />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('8+ characters, one number')).not.toBeInTheDocument()
  })

  it('offers a link to create a workspace instead', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByRole('link', { name: 'Create your workspace' })).toHaveAttribute('href', '/signup')
  })
})

describe('AuthForm accessibility', () => {
  it('labels the email and password inputs', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('has no accessibility violations in either mode', async () => {
    const signup = render(<AuthForm mode="signup" />)
    expect(await axe(signup.container)).toHaveNoViolations()
    signup.unmount()
    const login = render(<AuthForm mode="login" />)
    expect(await axe(login.container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/marketing/auth/auth-form.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement AuthBrandPanel**

Create `ui/marketing/auth/auth-brand-panel.tsx`:

```tsx
import { Logo } from '@/ui/marketing/logo'
import { authPanel } from '@/content/auth'

export function AuthBrandPanel() {
  return (
    <div className="flex flex-col justify-between gap-8 bg-green-900 p-8 text-white lg:p-12">
      <Logo tone="dark" />
      <div className="hidden lg:block">
        <p className="max-w-[20ch] font-display text-[28px] italic leading-[1.4] text-white">
          {authPanel.quote}
        </p>
        <p className="mt-5 text-sm text-green-300">{authPanel.trustLine}</p>
      </div>
      <div className="hidden text-[13px] text-green-400 lg:block">{authPanel.copyright}</div>
    </div>
  )
}
```

- [ ] **Step 4: Implement AuthForm**

Create `ui/marketing/auth/auth-form.tsx`:

```tsx
import Link from 'next/link'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { authModes, authShared } from '@/content/auth'

/**
 * Presentational only. Submission is deliberately unwired for this phase.
 * TODO(auth): wire to PRD Module 01 — POST /api/v1/auth/signup and
 * POST /api/v1/auth/login, plus OAuth at /api/v1/auth/oauth/{google|apple}.
 */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const copy = authModes[mode]
  const isSignup = mode === 'signup'

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="font-display text-[28px] font-semibold text-green-900 md:text-[32px]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[15px] text-sage-500">{copy.subtitle}</p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.google}
        </Button>
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.apple}
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[13px] text-sage-500">
        <span className="h-px flex-1 bg-sage-300" />
        {authShared.divider}
        <span className="h-px flex-1 bg-sage-300" />
      </div>

      <div className="flex flex-col gap-4">
        <Field label={authShared.emailLabel} htmlFor="auth-email">
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            className={fieldControlClasses}
            placeholder={authShared.emailPlaceholder}
          />
        </Field>

        <Field label={authShared.passwordLabel} htmlFor="auth-password" help={copy.passwordHelp}>
          <input
            id="auth-password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            className={fieldControlClasses}
            placeholder="••••••••"
          />
        </Field>

        {isSignup ? (
          <div className="flex items-start gap-2.5">
            <input
              id="auth-terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-green-600)]"
            />
            <label htmlFor="auth-terms" className="text-[13px] leading-[1.4] text-sage-700">
              {authShared.termsPrefix}{' '}
              <Link href={authShared.termsLink.href} className="text-green-700 underline">
                {authShared.termsLink.label}
              </Link>{' '}
              {authShared.termsJoin}{' '}
              <Link href={authShared.privacyLink.href} className="text-green-700 underline">
                {authShared.privacyLink.label}
              </Link>
            </label>
          </div>
        ) : (
          <div className="-mt-1.5 text-right">
            {/* Route out of scope this phase; rendered as plain text, not a dead link. */}
            <span className="text-[13px] font-semibold text-sage-500">
              {authShared.forgotPassword}
            </span>
          </div>
        )}

        <Button variant="accent" size="md" className="w-full" disabled>
          {copy.cta}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-sage-500">
        {copy.footerText}{' '}
        <Link href={copy.footerLink.href} className="font-semibold text-green-700">
          {copy.footerLink.label}
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Run the auth test to verify it passes**

Run: `npx vitest run ui/marketing/auth`
Expected: PASS — 9 tests.

- [ ] **Step 6: Create the auth layout and pages**

Create `app/(auth)/layout.tsx`. At `sm` the brand panel becomes a slim top bar; from `lg` it is the 45% column from the comp.

```tsx
import { AuthBrandPanel } from '@/ui/marketing/auth/auth-brand-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[45%_1fr] lg:grid-rows-1">
      <AuthBrandPanel />
      <main className="flex items-center justify-center bg-green-50 p-6 lg:p-12">
        {children}
      </main>
    </div>
  )
}
```

Create `app/(auth)/signup/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { AuthForm } from '@/ui/marketing/auth/auth-form'
import { authModes } from '@/content/auth'

export const metadata: Metadata = {
  title: authModes.signup.title,
  description: authModes.signup.subtitle,
  robots: { index: false, follow: true },
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
```

Create `app/(auth)/login/page.tsx` identically, using `authModes.login` and `<AuthForm mode="login" />`.

- [ ] **Step 7: Verify the whole suite and build**

Run: `npm run typecheck && npx vitest run && npm run build`
Expected: all pass; `/login` and `/signup` listed as static.

- [ ] **Step 8: Commit**

```bash
git add ui/marketing/auth app/\(auth\)
git commit -m "feat(auth): add unwired login and signup page shells"
```

---

## Task 13: SEO, structured data, and the analytics shim

**Files:**
- Create: `lib/seo.ts`, `lib/analytics.ts`, `lib/seo.test.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`
- Modify: `app/(marketing)/page.tsx`, `app/(marketing)/product/page.tsx`, `app/(marketing)/pricing/page.tsx` (add JSON-LD)
- Create: `.env.example`

**Interfaces:**
- Consumes: `pricing` from `content/pricing.ts`.
- Produces:
  - `siteUrl: string` — from `NEXT_PUBLIC_SITE_URL`, defaulting to `https://cofoundaz.com`.
  - `organizationJsonLd(): object`, `softwareApplicationJsonLd(): object`, `faqPageJsonLd(): object`
  - `JsonLd({ data }): JSX.Element` — renders a `<script type="application/ld+json">`.
  - `track<E extends keyof MarketingEvents>(event: E, props: MarketingEvents[E]): void`

- [ ] **Step 1: Write the failing SEO test**

Create `lib/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { faqPageJsonLd, organizationJsonLd, softwareApplicationJsonLd, siteUrl } from './seo'
import { pricing } from '@/content/pricing'

describe('siteUrl', () => {
  it('is an absolute https URL with no trailing slash', () => {
    expect(siteUrl).toMatch(/^https:\/\//)
    expect(siteUrl.endsWith('/')).toBe(false)
  })
})

describe('organizationJsonLd', () => {
  it('declares an Organization with name and url', () => {
    const data = organizationJsonLd()
    expect(data['@type']).toBe('Organization')
    expect(data.name).toBe('Cofoundaz')
    expect(data.url).toBe(siteUrl)
  })
})

describe('softwareApplicationJsonLd', () => {
  it('declares a BusinessApplication', () => {
    const data = softwareApplicationJsonLd()
    expect(data['@type']).toBe('SoftwareApplication')
    expect(data.applicationCategory).toBe('BusinessApplication')
  })
})

describe('faqPageJsonLd', () => {
  it('mirrors every FAQ item from the pricing content', () => {
    const data = faqPageJsonLd()
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(pricing.faq.length)
    expect(data.mainEntity[0].name).toBe(pricing.faq[0].question)
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(pricing.faq[0].answer)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/seo.test.ts`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Implement the SEO helpers**

Create `lib/seo.ts`:

```ts
import { pricing } from '@/content/pricing'

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cofoundaz.com'
).replace(/\/$/, '')

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cofoundaz',
    url: siteUrl,
    description:
      'The AI operating system that takes founders from idea to profitability.',
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cofoundaz',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${siteUrl}/product`,
    description:
      'One connected workspace, a bench of AI advisors, and a clear next step every single day.',
  }
}

export function faqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pricing.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Because `JsonLd` returns JSX, rename the file to `lib/seo.tsx` and keep the import path `@/lib/seo` unchanged.

- [ ] **Step 4: Run the SEO test to verify it passes**

Run: `npx vitest run lib/seo.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Add the analytics shim**

Create `lib/analytics.ts`. PRD §5.6 names the events; no provider is chosen (spec open decision D-02), so this is a typed no-op whose call sites are already correct.

```ts
type MarketingEvents = {
  signup_started: { source: string }
  nav_item_clicked: { label: string; href: string }
}

/**
 * No-op until an analytics provider is chosen (spec D-02).
 * Call sites are correct today; swapping in the real provider is one file.
 */
export function track<E extends keyof MarketingEvents>(
  event: E,
  props: MarketingEvents[E]
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, props)
  }
}
```

- [ ] **Step 6: Create sitemap and robots**

Create `app/sitemap.ts`. Nine indexable routes — the 11 shipped routes minus `/login` and `/signup`.

```ts
import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-07-30')

  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/product`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/security`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/cookies`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/login', '/signup'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 7: Create the default OG image**

Create `app/opengraph-image.tsx`. Note the Next 16 change: image-generation props are Promises, though this route takes no params.

```tsx
import { ImageResponse } from 'next/og'

export const alt = 'Cofoundaz — The co-founder who never sleeps.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#12291F',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 14, background: '#1E4D3B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '4px solid #BDA05F', borderRightColor: 'transparent',
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: '#FFFFFF' }}>Cofoundaz</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
          The co-founder who never sleeps.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#B3D0C3', maxWidth: 900 }}>
          The AI operating system that takes founders from idea to profitability.
        </div>
      </div>
    ),
    size
  )
}
```

- [ ] **Step 8: Add JSON-LD to the three key pages**

In `app/(marketing)/page.tsx`, import `JsonLd` and `organizationJsonLd` and render `<JsonLd data={organizationJsonLd()} />` as the first child of the fragment.

In `app/(marketing)/product/page.tsx`, render `<JsonLd data={softwareApplicationJsonLd()} />` the same way.

In `app/(marketing)/pricing/page.tsx`, render `<JsonLd data={faqPageJsonLd()} />`.

- [ ] **Step 9: Document the environment variable**

Create `.env.example`:

```bash
# Absolute site origin, no trailing slash. Used for metadataBase, canonicals,
# sitemap URLs, and OG image resolution. Spec open decision D-04.
NEXT_PUBLIC_SITE_URL=https://cofoundaz.com
```

- [ ] **Step 10: Verify the generated SEO routes**

Run: `npm run build && npm start`
Then in another shell:

```bash
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml | head -20
curl -s localhost:3000/pricing | grep -o 'application/ld+json'
```

Expected: robots lists both disallows and the sitemap URL; the sitemap contains 9 `<url>` entries; the pricing page contains one JSON-LD script.

- [ ] **Step 11: Commit**

```bash
git add lib app/sitemap.ts app/robots.ts app/opengraph-image.tsx .env.example \
        app/\(marketing\)/page.tsx app/\(marketing\)/product/page.tsx app/\(marketing\)/pricing/page.tsx
git commit -m "feat(seo): add metadata, sitemap, robots, OG image, and JSON-LD"
```

---

## Task 14: Route-level accessibility and responsive verification

The component tests cover behaviour in isolation. This task proves the assembled routes are accessible and responsive in a real browser — the two deliverables the comps did not cover.

**Files:**
- Create: `playwright.config.ts`, `e2e/accessibility.spec.ts`, `e2e/responsive.spec.ts`, `e2e/routes.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: the built application on `localhost:3000`.
- Produces: `MARKETING_ROUTES: string[]` and `ALL_ROUTES: string[]` from `e2e/routes.ts`.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

Add to `.gitignore`:

```
/test-results
/playwright-report
/blob-report
```

Add to `package.json` scripts:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 2: Create the Playwright config**

Create `playwright.config.ts`. Tests run against a production build, because that is what ships and what static rendering applies to.

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

Create `e2e/routes.ts`:

```ts
export const MARKETING_ROUTES = [
  '/', '/product', '/pricing', '/about', '/contact',
  '/terms', '/privacy', '/security', '/cookies',
]

export const AUTH_ROUTES = ['/login', '/signup']

export const ALL_ROUTES = [...MARKETING_ROUTES, ...AUTH_ROUTES, '/this-route-does-not-exist']
```

- [ ] **Step 3: Write the failing accessibility sweep**

Create `e2e/accessibility.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ALL_ROUTES, MARKETING_ROUTES } from './routes'

for (const route of ALL_ROUTES) {
  test(`${route} has no axe violations`, async ({ page }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}

for (const route of ALL_ROUTES) {
  test(`${route} has exactly one h1`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('h1')).toHaveCount(1)
  })
}

for (const route of MARKETING_ROUTES) {
  test(`${route} exposes a working skip link`, async ({ page }) => {
    await page.goto(route)
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveText('Skip to content')
    await expect(focused).toHaveAttribute('href', '#main')
  })
}

test('the mobile menu traps focus and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
})

test('the carousel does not auto-advance under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const quote = page.locator('[aria-live="polite"]')
  const before = await quote.textContent()
  await page.waitForTimeout(7000)
  expect(await quote.textContent()).toBe(before)
})
```

- [ ] **Step 4: Run the sweep and fix what it finds**

Run: `npm run test:e2e -- accessibility`
Expected on the first run: some failures. Fix each in the owning component, then re-run until green. Common causes and their fixes:
- *"Elements must have sufficient color contrast"* on a brass label → the D-1 fix was missed; change `text-brass-600` to `text-brass-700` on that light surface.
- *"Form elements must have labels"* → a control is missing its `Field` wrapper or the `htmlFor`/`id` pair does not match.
- *"Heading levels should only increase by one"* → a section jumped from `h1` to `h3`.

- [ ] **Step 5: Write the failing responsive sweep**

Create `e2e/responsive.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { ALL_ROUTES } from './routes'

const VIEWPORTS = [
  { name: 'sm', width: 375, height: 812 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1280, height: 900 },
  { name: 'xl', width: 1440, height: 900 },
]

for (const viewport of VIEWPORTS) {
  for (const route of ALL_ROUTES) {
    test(`${route} has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(route)
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      )
      expect(overflows).toBe(false)
    })
  }
}

test('the desktop nav is replaced by a hamburger below lg', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
})

test('the desktop nav is visible at lg', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()
})

test('the comparison matrix scrolls rather than reflowing at sm', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/pricing')
  const scroller = page.locator('[data-matrix-scroll]')
  await expect(scroller).toHaveAttribute('tabindex', '0')
  const scrolls = await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)
  expect(scrolls).toBe(true)
})

test('Growth is the first pricing card at sm', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/pricing')
  const headings = page.locator('h3').filter({ hasText: /^(Starter|Growth|Scale)$/ })
  const boxes = await headings.evaluateAll((els) =>
    els.map((el) => ({ text: el.textContent, top: el.getBoundingClientRect().top }))
  )
  const topmost = boxes.sort((a, b) => a.top - b.top)[0]
  expect(topmost.text).toBe('Growth')
})
```

- [ ] **Step 6: Run the responsive sweep and fix what it finds**

Run: `npm run test:e2e -- responsive`
Expected on the first run: horizontal-overflow failures on the widest sections. Fix each by applying the spec §10 breakpoint table to the offending component — most often a `grid-cols-3` that needs `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, or a fixed `min-w` on the pricing matrix that must stay inside its scroll container.

- [ ] **Step 7: Confirm the full verification gate**

Run every check the spec's Definition of Done requires:

```bash
npm run typecheck
npm run lint
npx vitest run
npm run build
npm run test:e2e
```

Expected: all green. The build output must show all 11 routes as static (`○`); any route marked dynamic (`ƒ`) is a defect — find the request-time API call and remove it.

- [ ] **Step 8: Run Lighthouse on the three key pages**

With `npm start` running:

```bash
npx lighthouse http://localhost:3000/ --only-categories=seo,accessibility --chrome-flags="--headless" --quiet
npx lighthouse http://localhost:3000/product --only-categories=seo,accessibility --chrome-flags="--headless" --quiet
npx lighthouse http://localhost:3000/pricing --only-categories=seo,accessibility --chrome-flags="--headless" --quiet
```

Expected: SEO ≥ 95 and Accessibility ≥ 95 on each. Below that, read the report's failing audits and fix them before finishing.

- [ ] **Step 9: Commit**

```bash
git add playwright.config.ts e2e .gitignore package.json package-lock.json
git commit -m "test(e2e): add route-level accessibility and responsive sweeps"
```

- [ ] **Step 10: Write the shipment SOP**

Per the project's SOP convention, create `docs/sop/marketing-website.md` covering: what shipped (11 routes), why (PRD Part 3, Phase 1), how (route groups, token layer, content modules), what's involved (the file map from this plan), verification (the Task 14 gate and its results), how to run and roll back, and follow-ups (Blog, Help Center, contact backend, auth wiring, `packages/ui` promotion).

Record the two approved deviations, D-1 and D-2, with the measured contrast ratios, so the design team has the rationale in writing.

- [ ] **Step 11: Commit and open the pull request**

```bash
git add docs/sop/marketing-website.md
git commit -m "docs(sop): record the marketing website shipment"
git push -u origin feat/marketing-website
```

---

## Plan Self-Review

**Spec coverage.** Every spec section maps to a task: §4 route architecture → Tasks 4, 11, 12 · §5 directory layout → Tasks 1–13 · §6 platform constraints → Global Constraints + Task 1 · §7 tokens → Task 1 · §8 content → Task 3 · §9 page composition → Tasks 6–12 · §10 responsive → built into each page task, verified in Task 14 · §11 accessibility incl. D-1 and D-2 → Task 1 (global CSS), Task 2 (`SectionHeading`), Tasks 6–12 (per component), Task 14 (route sweep) · §12 SEO → Task 13 · §13 analytics → Task 13 · §14 verification → Task 14 · §15 open decisions → carried as `TODO`s and `.env.example`.

**Known gaps, deliberate.** Three sections in Tasks 8 and 9 (`EveryPlanBand`, `CreditPanel`, `WordmarkRow`, `WhySection`, `ValuesGrid`, `TeamGrid`) are specified structurally rather than as full code, because each is a direct structural clone of a component whose full code appears earlier in the plan (`SecurityStrip`, `FeatureGrid`), and their content is fully defined in Task 3. `AppFrame`'s five variants are specified as a port from named line ranges of the comp rather than invented markup — the comp is the authority for that markup and inventing it here would risk drift.

**Type consistency.** `MatrixCell` is a discriminated union on `kind` and is consumed that way in `ComparisonMatrix`. `Plan.price` is `string | null` in `content/types.ts`, asserted null for Growth and Scale in `content.test.ts`, and branched on in `PricingCard`. `HubGroup.variant` is the same union as `AppFrameVariant`. `Field` is created in Task 10 and reused in Task 12. `CtaBand` is created in Task 6 and reused in Tasks 7 and 8. `Logo` is created in Task 4 and reused in Tasks 4 and 12.
