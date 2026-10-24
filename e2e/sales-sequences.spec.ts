import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page, type Route } from '@playwright/test'

// Sales Sequences, sending status and the public unsubscribe page. The API is mocked with the shapes
// captured live in cofoundaz-api/docs/fe-integration-guide-sales-sequences.md; ids, names and
// addresses are placeholders.

const WS = '57829571-0f6c-4298-8e87-5cbc70631b58'
const SEQ = '482c8701-2c1d-460f-99ca-4bf6e325053d'

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify({ data, meta: null }),
})
const err = (status: number, code: string, message: string, field?: string) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify({ error: { code, message, field_errors: field ? [{ field, message }] : [] } }),
})
const me = (role: string) => ({
  user: { id: 'u1', email: 'placeholder@example.com' },
  profile: { full_name: 'Placeholder Person', role_title: null, country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role }],
  active_workspace_id: WS,
})

const sequence = {
  id: SEQ,
  name: 'Cold intro',
  steps: [
    { body: 'Hi {{first_name}},\n\nWe help teams like {{company}} get paid faster.\n\n{{sender_name}}', subject: 'Quick idea for {{company}}', wait_days: 0 },
    { body: 'Hi {{first_name}}, bumping this in case it got buried.\n\n{{sender_name}}', subject: 'Re: Quick idea for {{company}}', wait_days: 3 },
  ],
  step_count: 2,
  stop_on_stage_change: false,
  status: 'active',
  active_enrollments: 1,
  total_enrollments: 1,
  reply_rate: 0.0,
  created_at: '2026-10-22T13:00:18.371790+00:00',
  updated_at: '2026-10-22T13:00:18.371790+00:00',
}
const enrollment = {
  id: '5ee5ab95-4a55-475f-b8af-1a57a5fe8098',
  sequence_id: SEQ,
  lead_id: null,
  contact_id: '7f0d5cfd-34ec-47b9-ac9c-c3d1749c053d',
  email: 'ada-placeholder@prospect.example',
  first_name: 'Ada',
  last_name: 'Test',
  company: '',
  sender_name: 'Placeholder Person',
  sender_email: 'placeholder@example.com',
  status: 'active',
  stopped_reason: null,
  current_step: 0,
  next_send_at: '2026-10-25T13:56:49.653129Z',
  created_at: '2026-10-22T13:56:49.528007Z',
}
const sending = (over: Record<string, unknown> = {}) => ({
  configured: false,
  reason: 'not_configured',
  domain: null,
  sent_today: 0,
  daily_cap: 100,
  hourly_cap: null,
  paused: false,
  paused_reason: null,
  paused_at: null,
  ...over,
})

async function setup(page: Page, opts: { role?: string; sending?: Record<string, unknown> } = {}) {
  const role = opts.role ?? 'founder'
  const calls = { created: [] as unknown[], replied: [] as string[], resumed: 0 }
  let state = { ...sequence }
  let en: Record<string, unknown> = { ...enrollment }
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  await page.route('**/api/v1/team/members', (route) =>
    route.fulfill(json([{ user_id: 'u1', name: 'Placeholder Person', email: 'placeholder@example.com', role }]))
  )
  const handler = async (route: Route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/v1/sales', '') || '/'
    const method = req.method()
    const body = req.postData() ? JSON.parse(req.postData()!) : {}
    if (role !== 'founder' && role !== 'team_member') return route.fulfill(err(403, 'FORBIDDEN', "You don't have permission to do that."))

    if (path === '/sending') return route.fulfill(json(sending(opts.sending)))
    if (path === '/sending/resume') {
      calls.resumed += 1
      return route.fulfill(json(sending({ configured: true, paused: false })))
    }
    if (path === '/sequences' && method === 'GET') return route.fulfill(json({ items: [state], total: 1, limit: 100, offset: 0 }))
    if (path === '/sequences' && method === 'POST') {
      calls.created.push(body)
      if (body.steps[0].subject.includes('{{nope}}')) {
        return route.fulfill(err(422, 'VALIDATION_ERROR', 'Unknown merge tag {{nope}}. Use first_name, last_name, company, sender_name.', 'steps.0.subject'))
      }
      return route.fulfill(json({ ...sequence, ...body, id: 'new-seq', step_count: body.steps.length, active_enrollments: 0, total_enrollments: 0 }, 201))
    }
    if (path === `/sequences/${SEQ}` && method === 'PATCH') {
      state = { ...state, ...body }
      return route.fulfill(json(state))
    }
    if (path === `/sequences/${SEQ}/enrollments`) return route.fulfill(json({ items: [en], total: 1, limit: 20, offset: 0 }))
    if (path === `/enrollments/${en.id}/replied`) {
      if (en.status !== 'active') return route.fulfill(err(409, 'ENROLLMENT_NOT_ACTIVE', 'This enrollment has already ended.'))
      calls.replied.push(String(en.id))
      en = { ...en, status: 'replied', stopped_reason: 'marked_replied', next_send_at: null }
      return route.fulfill(json(en))
    }
    return route.fulfill(json({}))
  }
  await page.route('**/api/v1/sales', handler)
  await page.route('**/api/v1/sales/**', handler)
  return calls
}

test.describe('Sales sequences at 1440', () => {
  test('lists the sequence, says sending is not set up, and edits are validated then saved', async ({ page }) => {
    await setup(page)
    await page.goto('/sales/sequences')
    await expect(page.getByRole('heading', { name: 'Email sequences' })).toBeVisible()
    await expect(page.getByText("Sending isn't set up yet")).toBeVisible()
    await expect(page.getByLabel('Sequence name').first()).toHaveValue('Cold intro')
    await expect(page.getByText('1 active · 1 enrolled · 0% reply rate')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    await page.getByLabel('Stop when deal moves stage').check()
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })

  test('creating a sequence validates locally, posts the form, and shows the API field error', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/sequences')
    await page.getByRole('button', { name: '+ New sequence' }).first().click()
    const form = page.locator('main form').first()
    await form.getByRole('button', { name: 'Create sequence' }).click()
    await expect(page.getByText('Name this sequence.')).toBeVisible()

    await form.getByPlaceholder('Name this sequence').fill('Follow-ups')
    await form.getByRole('button', { name: '+ Add step' }).click()
    await form.locator('input[id^=subject-]').nth(1).fill('Second touch')
    await form.locator('textarea[id^=body-]').nth(1).fill('Checking in.')
    await form.getByRole('button', { name: 'Create sequence' }).click()
    await expect.poll(() => calls.created.length).toBe(1)
    expect(calls.created[0]).toMatchObject({ name: 'Follow-ups', stop_on_stage_change: false })
    expect((calls.created[0] as { steps: unknown[] }).steps).toHaveLength(2)
  })

  test('People: Mark replied updates the row, and a second click gets the API 409 message', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/sequences')
    await page.getByRole('button', { name: 'People (1)' }).click()
    await expect(page.getByText('ada-placeholder@prospect.example')).toBeVisible()
    await page.getByRole('button', { name: 'Mark Ada Test as replied' }).click()
    await expect.poll(() => calls.replied.length).toBe(1)
    await expect(page.getByText('Marked as replied').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark Ada Test as replied' })).toHaveCount(0)
  })

  test('a paused workspace shows the banner with Resume for a founder only', async ({ page }) => {
    const calls = await setup(page, { sending: { configured: true, paused: true, paused_reason: 'bounces', domain: 'mail.example.test' } })
    await page.goto('/sales/sequences')
    await expect(page.getByText('Sales emails are paused')).toBeVisible()
    await page.getByRole('button', { name: 'Resume sending' }).click()
    await expect.poll(() => calls.resumed).toBe(1)
  })

  test('a team member sees the pause banner but no Resume button', async ({ page }) => {
    await setup(page, { role: 'team_member', sending: { configured: true, paused: true, paused_reason: 'bounces' } })
    await page.goto('/sales/sequences')
    await expect(page.getByText('Ask a founder to resume sending.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Resume sending' })).toHaveCount(0)
  })

  test('has no axe violations', async ({ page }) => {
    await setup(page)
    await page.goto('/sales/sequences')
    await expect(page.getByLabel('Sequence name').first()).toHaveValue('Cold intro')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('Sales sequences at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test('fits the viewport with the editor and People list open', async ({ page }) => {
    await setup(page)
    await page.goto('/sales/sequences')
    await page.getByRole('button', { name: 'People (1)' }).click()
    await expect(page.getByText('ada-placeholder@prospect.example')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376)
  })
})

test.describe('Public unsubscribe page', () => {
  const route = async (page: Page, state: { unsubscribed: boolean; bad?: boolean }) => {
    await page.route('**/api/v1/public/sales/unsubscribe/**', async (r) => {
      if (state.bad) return r.fulfill(err(404, 'NOT_FOUND', 'Not found.'))
      if (r.request().method() === 'POST') state.unsubscribed = true
      return r.fulfill(json({ email: 'a***@prospect.example', sender: 'NovaPay', unsubscribed: state.unsubscribed }))
    })
  }

  test('reads first, unsubscribes on the button, and is idempotent on reload', async ({ page }) => {
    await route(page, { unsubscribed: false })
    await page.goto('/unsubscribe/placeholder-token')
    await expect(page.getByRole('heading', { name: 'Unsubscribe from NovaPay?' })).toBeVisible()
    await expect(page.getByText('a***@prospect.example').first()).toBeVisible()
    await page.getByRole('button', { name: 'Unsubscribe' }).click()
    await expect(page.getByRole('heading', { name: "You won't hear from NovaPay again" })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: "You're already unsubscribed" })).toBeVisible()
  })

  test('a forged link shows the plain invalid page', async ({ page }) => {
    await route(page, { unsubscribed: false, bad: true })
    await page.goto('/unsubscribe/forged')
    await expect(page.getByRole('heading', { name: 'This link does not work' })).toBeVisible()
  })

  test('has no axe violations', async ({ page }) => {
    await route(page, { unsubscribed: false })
    await page.goto('/unsubscribe/placeholder-token')
    await expect(page.getByRole('heading', { name: 'Unsubscribe from NovaPay?' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations).toEqual([])
  })
})
