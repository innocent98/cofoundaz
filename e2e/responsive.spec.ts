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
      // `document.documentElement.scrollWidth` is a content-size metric, not
      // a scrollability one: it stays inflated by a wide descendant (here,
      // the pricing comparison matrix's intentional min-w-[560px] scroll
      // table, ui/marketing/pricing/comparison-matrix.tsx) even after
      // `overflow-x: hidden` is applied to html/body specifically to stop it
      // leaking into the page (app/globals.css). A scrollWidth-vs-clientWidth
      // comparison alone can't tell "wide content that's properly clipped"
      // apart from "wide content the user can actually scroll to" — and the
      // matrix is required to keep exactly the former by design (the
      // "comparison matrix scrolls rather than reflowing" test below). What
      // actually matters for this assertion is whether a real user can drag
      // the page sideways, so it's tested directly: attempt to scroll the
      // viewport hard right and confirm it doesn't move.
      const scrollX = await page.evaluate(() => {
        window.scrollTo(99_999, 0)
        return window.scrollX
      })
      expect(scrollX).toBe(0)
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
