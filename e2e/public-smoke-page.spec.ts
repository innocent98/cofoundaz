import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The hosted smoke-test page (/p/{slug}) is public and mobile-first. The API is
// mocked at the network edge so this runs without a backend.
const PAGE = {
  headline: 'Get paid the same day',
  subheadline: 'Instant settlement for market traders',
  cta_text: 'Join the waitlist',
  require_email: true,
  show_pricing: true,
  metric_type: 'email_signup',
  post_signup_message: "You're on the list, we'll be in touch soon.",
  powered_by: 'Powered by Cofoundaz',
}

test.use({ viewport: { width: 375, height: 812 } })

test('a live page renders, has no axe violations and does not scroll sideways', async ({ page }) => {
  await page.route('**/api/v1/validation/pages/novapay', (r) => r.fulfill({ json: { data: PAGE } }))
  await page.route('**/api/v1/validation/pages/novapay/events', (r) =>
    r.fulfill({ status: 201, json: { data: { received: true } } })
  )
  await page.goto('/p/novapay')
  await expect(page.getByRole('heading', { name: PAGE.headline })).toBeVisible()
  await expect(page.getByText('Powered by Cofoundaz')).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations).toEqual([])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('a bad email is caught on the page, a good one shows the message', async ({ page }) => {
  let signupCalls = 0
  await page.route('**/api/v1/validation/pages/novapay', (r) => r.fulfill({ json: { data: PAGE } }))
  await page.route('**/api/v1/validation/pages/novapay/events', (r) =>
    r.fulfill({ status: 201, json: { data: { received: true } } })
  )
  await page.route('**/api/v1/validation/pages/novapay/signups', (r) => {
    signupCalls += 1
    return r.fulfill({ status: 201, json: { data: { message: PAGE.post_signup_message } } })
  })
  await page.goto('/p/novapay')
  await page.getByLabel('Email address').fill('not-an-email')
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  expect(signupCalls).toBe(0)
  await page.getByLabel('Email address').fill('funke@example.com')
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.getByText(PAGE.post_signup_message)).toBeVisible()
  expect(signupCalls).toBe(1)
})

test('an unknown, draft or ended page says it is not available', async ({ page }) => {
  await page.route('**/api/v1/validation/pages/gone', (r) =>
    r.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.', field_errors: [] } } })
  )
  await page.goto('/p/gone')
  await expect(page.getByRole('heading', { name: "This page isn't available" })).toBeVisible()
})
