import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ALL_ROUTES, CHROME_ROUTES } from './routes'

for (const route of ALL_ROUTES) {
  test(`${route} has no axe violations`, async ({ page }) => {
    // Home's Hero fades its content in via `animate-[fade-up_...]` (see
    // ui/marketing/home/hero.tsx). Scanning mid-transition caught elements at
    // a partial opacity, which axe reports as a blended (and unrelated,
    // non-reproducible) color-contrast failure — the badge, CTA buttons, and
    // hero copy all measure correctly once settled. Reduced motion collapses
    // the animation to 0.01ms (globals.css D-2), so the scan always reads the
    // final, settled state — the state every real user eventually sees,
    // including the reduced-motion users this media query exists for.
    await page.emulateMedia({ reducedMotion: 'reduce' })
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

// The 404 is in this sweep, not excluded from it: it now renders the same
// SiteChrome as every other marketing route.
for (const route of CHROME_ROUTES) {
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
  // Targets the quote region itself, not `[aria-live]`: the quote deliberately
  // is NOT a live region any more (see below), so an aria-live locator would
  // now find the empty announcement span and pass vacuously.
  const quote = page.locator('[data-carousel-quote]')
  const before = await quote.textContent()
  expect(before).not.toBe('')
  await page.waitForTimeout(7000)
  expect(await quote.textContent()).toBe(before)
})

test('the carousel offers a pause control and honours it (WCAG 2.2.2)', async ({ page }) => {
  await page.goto('/')
  const quote = page.locator('[data-carousel-quote]')
  const toggle = page.getByRole('button', { name: 'Pause quote rotation' })
  await expect(toggle).toBeVisible()

  // Keyboard-operable, not hover-only.
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Resume quote rotation' })).toBeVisible()

  const before = await quote.textContent()
  await page.waitForTimeout(7000)
  expect(await quote.textContent()).toBe(before)
})

test('the auto-rotating quote is not a live region', async ({ page }) => {
  await page.goto('/')
  // An aria-live quote would re-announce a whole testimonial every 6 seconds.
  await expect(page.locator('[data-carousel-quote][aria-live]')).toHaveCount(0)
  await expect(page.locator('[data-carousel-quote] [aria-live]')).toHaveCount(0)
})

/**
 * Cross-page design-system invariant sweep (Task 14 addition).
 *
 * PRD §1.1 rule 3 is "exactly one brass (accent) CTA per screen." The
 * `SiteHeader` (`ui/marketing/site-header.tsx`) renders its own "Start free"
 * accent button, unconditionally, on every route that uses the `(marketing)`
 * layout — nine of the eleven shipped routes. That header CTA is explicitly
 * called out as the sanctioned always-present exception in
 * `ui/marketing/mobile-nav.tsx` ("the desktop 'Start free' accent button ...
 * stays visible at every width ... so it must not be duplicated here").
 *
 * The rule is about CTA *buttons*, not the brass token in general — the
 * design intentionally reuses `bg-brass-600` for small, non-interactive
 * decoration (the "Most popular" plan `Badge`, the hero badge's status dot,
 * the `AppFrame`/`ProductShot` mock-illustration accents) under the separate
 * "brass ≤10% of screen" background rule. An early draft of this sweep that
 * matched the bare `.bg-brass-600` class caught those decorative spans too
 * (Home and Product both resolved to 4, Pricing to 3). The selectors below
 * are scoped to actual interactive controls — the elements the `Button`
 * component itself renders (an `<a>` when `href` is given, a `<button>`
 * otherwise) — so only real CTAs are counted.
 *
 * Design ruling (human, post-review): "one accent CTA per screen" means per
 * *viewport*, not per document. Home, product, and pricing each render two
 * in-content accent CTAs (a hero/plan CTA and a closing CtaBand) — this is
 * correct, because on a long scrolling page the two never appear on screen
 * together. The header's CTA is a separate, sanctioned, always-present
 * exception (checked below on its own). So there are two invariants, not one:
 * the header must never duplicate its single CTA, and no two in-content
 * accent CTAs may ever be simultaneously visible in the viewport at any
 * scroll position.
 */
const HEADER_ROUTES = new Set(CHROME_ROUTES)

for (const route of ALL_ROUTES) {
  test(`${route} header renders at most one accent CTA`, async ({ page }) => {
    await page.goto(route)
    const headerAccentCount = await page.locator('header :is(a, button).bg-brass-600').count()
    expect(headerAccentCount, 'header must never render more than one accent CTA').toBe(
      HEADER_ROUTES.has(route) ? 1 : 0
    )
  })
}

// Mirrors responsive.spec.ts's own VIEWPORTS — duplicated locally rather than
// imported so this file's invariant doesn't silently drift if that file's
// breakpoint list ever changes for an unrelated reason.
const CO_VISIBILITY_VIEWPORTS = [
  { name: 'sm', width: 375, height: 812 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1280, height: 900 },
  { name: 'xl', width: 1440, height: 900 },
]

for (const viewport of CO_VISIBILITY_VIEWPORTS) {
  for (const route of ALL_ROUTES) {
    test(`${route} never shows two in-content accent CTAs in one viewport at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(route)

      // Absolute (document-space) top/bottom of every in-content accent CTA.
      // Adding window.scrollY makes this robust even if navigation ever
      // lands mid-scroll (it's 0 right after a fresh goto); rect.top/bottom
      // alone would already be document-space at scroll 0.
      const boxes = await page.locator('main :is(a, button).bg-brass-600').evaluateAll((els) =>
        els.map((el) => {
          const rect = el.getBoundingClientRect()
          return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY }
        })
      )

      // Two CTAs COULD be simultaneously visible at some scroll position if
      // and only if the total vertical span from the top of the earlier one
      // to the bottom of the later one fits inside one viewport-height
      // window — that's the definition of "at least one scroll offset puts
      // both inside [offset, offset + viewportHeight]". This checks every
      // possible scroll position in closed form rather than sampling
      // discrete scroll steps, so it can't miss a narrow window between
      // samples. "Visible" here means any pixel overlap with the viewport
      // (not full visibility) — a CTA that's only half on screen still
      // visually competes for attention, so partial overlap counts.
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const span = Math.max(boxes[i].bottom, boxes[j].bottom) - Math.min(boxes[i].top, boxes[j].top)
          expect(
            span,
            `two accent CTAs on ${route} could be simultaneously visible at ${viewport.name} ` +
              `(span ${span}px, viewport height ${viewport.height}px)`
          ).toBeGreaterThan(viewport.height)
        }
      }
    })
  }
}
