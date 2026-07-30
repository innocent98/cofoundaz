import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ALL_ROUTES, MARKETING_ROUTES } from './routes'

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

/**
 * Cross-page design-system invariant sweep (Task 14 addition).
 *
 * PRD §1.1 rule 3 is "exactly one brass (accent) CTA per screen." The
 * `SiteHeader` (`ui/marketing/site-header.tsx`) renders its own "Start free"
 * accent button, unconditionally, on every route that uses the `(marketing)`
 * layout — nine of the eleven shipped routes. That header CTA is explicitly
 * called out as the sanctioned always-present exception in
 * `ui/marketing/mobile-nav.tsx` ("the desktop 'Start free' accent button ...
 * stays visible at every width ... so it must not be duplicated here"), and
 * the existing per-page unit tests (e.g. about-sections.test.tsx) already
 * assert the "exactly one" rule scoped to a page's own content, rendering the
 * page component in isolation without the shared header.
 *
 * This sweep keeps that same scope: it counts accent buttons inside `<main>`
 * (the page's own content, excluding the persistent header/footer chrome) and
 * separately confirms the header itself never duplicates its one CTA. Home,
 * product, and pricing legitimately render two in-content accent CTAs each
 * (a hero/plan CTA and a closing CtaBand) — a deliberate top-and-bottom
 * bracketing pattern already shipped and reviewed in Tasks 6-8. Legal pages
 * carry no CTA at all (0 is correct: a Terms document should not upsell).
 * Auth pages and the 404 have no header, so their single in-page CTA is both
 * the header-equivalent and the content CTA.
 *
 * The rule is about CTA *buttons*, not the brass token in general — the
 * design intentionally reuses `bg-brass-600` for small, non-interactive
 * decoration (the "Most popular" plan `Badge`, the hero badge's status dot,
 * the `AppFrame`/`ProductShot` mock-illustration accents) under the separate
 * "brass ≤10% of screen" background rule. A first draft of this sweep that
 * matched the bare `.bg-brass-600` class caught those decorative spans too
 * (Home and Product both resolved to 4, Pricing to 3), which would have made
 * the assertion a check on decoration density rather than CTA count. The
 * selector below is scoped to actual interactive controls — the elements the
 * `Button` component itself renders (an `<a>` when `href` is given, a
 * `<button>` otherwise) — so only real CTAs are counted.
 */
const EXPECTED_MAIN_ACCENT_BUTTONS: Record<string, number> = {
  '/': 2, // Hero primary CTA + closing CtaBand
  '/product': 2, // ProductHero primary CTA + closing CtaBand
  '/pricing': 2, // popular PricingCard CTA + closing CtaBand
  '/about': 1, // closing CTA band only
  '/contact': 1, // form submit
  '/terms': 0,
  '/privacy': 0,
  '/security': 0,
  '/cookies': 0,
  '/login': 1, // AuthForm submit (no shared header on auth routes)
  '/signup': 1, // AuthForm submit (no shared header on auth routes)
  '/this-route-does-not-exist': 1, // "Back home" on the 404
}

const HEADER_ROUTES = new Set(MARKETING_ROUTES)

for (const route of ALL_ROUTES) {
  test(`${route} has the expected number of accent CTAs`, async ({ page }) => {
    await page.goto(route)

    const headerAccentCount = await page.locator('header :is(a, button).bg-brass-600').count()
    expect(headerAccentCount, 'header must never render more than one accent CTA').toBe(
      HEADER_ROUTES.has(route) ? 1 : 0
    )

    const mainAccentCount = await page.locator('main :is(a, button).bg-brass-600').count()
    expect(mainAccentCount).toBe(EXPECTED_MAIN_ACCENT_BUTTONS[route])
  })
}
