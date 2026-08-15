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
      // The pricing comparison matrix (ui/marketing/pricing/comparison-matrix.tsx)
      // is the one deliberate, internal horizontal scroller on the site: its
      // min-w-[560px] table is legitimately wider than the viewport at `sm`
      // and scrolls inside [data-matrix-scroll] (see "the comparison matrix
      // scrolls..." test below). That element previously leaked its width
      // into document.documentElement.scrollWidth — not just as a metric
      // artifact but as a real, user-reachable bug (confirmed with
      // `window.scrollTo` actually moving the viewport) — because
      // `overflow-x: auto` alone doesn't fully isolate layout containment in
      // Chromium for a table with an explicit min-width. The fix is
      // `contain-layout` on that one element, not a page-level overflow-x
      // clip (which would also break every `position: sticky` element on the
      // page — verified the hard way). With that fix in place this
      // assertion needs no numeric exception: every route, including
      // `/pricing`, must report zero page-level horizontal overflow.
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

// Scroll-time sticky checks. Nothing above scrolls the page before asserting
// visibility, which is exactly how a page-level `overflow-x: hidden` guard
// (tried and reverted — it silently forces `overflow-y: auto` on html/body
// per the CSS Overflow spec, which changes the sticky containing-block chain
// in Chromium and disables viewport-relative stickiness sitewide) shipped
// undetected. These scroll first, then measure.
test('the sticky header stays pinned after scrolling on /', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  // `behavior: 'instant'` matters: `html { scroll-behavior: smooth }` is active
  // (app/globals.css), so a plain scrollTo animates and the measurement below
  // can land mid-flight.
  await page.evaluate(() => window.scrollTo({ top: 1200, left: 0, behavior: 'instant' }))

  // The header is `sticky top-0`, so `top === 0` is true at scroll 0 as well —
  // on its own that assertion passes even with `position: sticky` deleted.
  // Proving the page actually moved is what gives it signal: the hero must have
  // scrolled off-screen while the header stayed put.
  const scrollY = await page.evaluate(() => window.scrollY)
  expect(scrollY).toBe(1200)
  const heroTop = await page.locator('h1').evaluate((el) => el.getBoundingClientRect().top)
  expect(heroTop).toBeLessThan(0)

  const top = await page.locator('header').evaluate((el) => el.getBoundingClientRect().top)
  expect(top).toBe(0)
})

test('the sticky header and product sub-nav stay pinned after scrolling on /product', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/product')
  await page.evaluate(() => window.scrollTo({ top: 1500, left: 0, behavior: 'instant' }))
  expect(await page.evaluate(() => window.scrollY)).toBe(1500)
  const headerTop = await page.locator('header').evaluate((el) => el.getBoundingClientRect().top)
  expect(headerTop).toBe(0)
  const subNavTop = await page
    .getByRole('navigation', { name: 'Product sections' })
    .evaluate((el) => el.getBoundingClientRect().top)
  expect(subNavTop).toBe(71)
})
