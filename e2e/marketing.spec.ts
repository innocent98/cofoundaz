import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

// Marketing PRD gap rows (FE half). The API is mocked with the shapes captured live in
// cofoundaz-api/docs/fe-integration-guide-marketing-prd.md; ids and names are placeholders.

const WS = '57829571-0f6c-4298-8e87-5cbc70631b58'
const C1 = '54a87848-c841-45e3-9eee-1fe502b6f646'
const E1 = '3eb508f6-15b8-4959-a0a1-06a8bea034e5'

const json = (data: unknown, meta: unknown = null) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data, meta }),
})

const me = (role: string) => ({
  user: { id: 'u1', email: 'placeholder@example.com' },
  profile: { full_name: 'Placeholder Person', role_title: null, country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role }],
  active_workspace_id: WS,
})

const campaign = {
  id: C1,
  startup_id: WS,
  name: 'Waitlist push',
  objective: 'launch',
  budget: 5000000,
  channel_mix: { email: 60.0, search: 40.0 },
  status: 'active',
  metrics: { impressions: 2000, clicks: 100, conversions: 10, spend: 20000, click_through_rate: 5.0, conversion_rate: 10.0 },
  segment_ids: [],
  period_start: '2026-10-20',
  period_end: '2026-11-03',
  launched_at: null,
  completed_at: null,
  created_at: '2026-10-20T18:14:36.793414Z',
  updated_at: '2026-10-20T18:14:36.793414Z',
}

const performance = {
  campaign_id: C1,
  name: 'Waitlist push',
  range: 'all',
  totals: { impressions: 2000, clicks: 100, conversions: 10, spend: 20000, click_through_rate: 5.0, conversion_rate: 10.0 },
  series: [
    { date: '2026-10-20', impressions: 1200, clicks: 60, conversions: 6, spend: 12000 },
    { date: '2026-10-22', impressions: 800, clicks: 40, conversions: 4, spend: 8000 },
  ],
  by_channel: [
    { channel: 'email', share_percent: 60.0, impressions: 1200, clicks: 60, conversions: 6, spend: 12000, estimated: true },
    { channel: 'search', share_percent: 40.0, impressions: 800, clicks: 40, conversions: 4, spend: 8000, estimated: true },
  ],
}

const readout = {
  id: '50d8a1e9-ddcc-47a2-8f02-ea3222a914b8',
  campaign_id: C1,
  week_start: '2026-10-19',
  status: 'ready',
  output: { headline: 'Clicks are up', summary: 'Email drove most of the clicks.', wins: ['Click-through rate is 5%'], watch: ['Spend is front loaded'], next_step: 'Shift budget toward email.' },
  error: null,
  created_at: '2026-10-20T18:32:44.580169Z',
}

function entry(over: Record<string, unknown> = {}) {
  const at = new Date()
  at.setDate(at.getDate() + 1)
  at.setHours(14, 30, 0, 0)
  return {
    id: E1,
    startup_id: WS,
    created_by: null,
    title: 'Waitlist teaser',
    channel: 'organic_social',
    status: 'scheduled',
    body: 'Something is coming.',
    media_ref: null,
    media_id: null,
    media: null,
    campaign_id: null,
    scheduled_at: at.toISOString(),
    published_at: null,
    created_at: '2026-10-20T18:14:36.875181Z',
    updated_at: '2026-10-20T18:14:36.875181Z',
    ...over,
  }
}

type Opts = { role?: string; entries?: unknown[] }

async function setup(page: Page, o: Opts = {}) {
  const role = o.role ?? 'founder'
  const patches: { id: string; body: Record<string, unknown> }[] = []
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  await page.route('**/api/v1/marketing/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/v1/marketing', '')
    const method = req.method()
    if (role !== 'founder' && role !== 'team_member') {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 'FORBIDDEN', message: "You don't have permission to do that.", field_errors: [] } }) })
    }
    if (path === '/calendar-entries' && method === 'GET') return route.fulfill(json({ entries: o.entries ?? [] }))
    if (path === `/calendar-entries/${E1}` && method === 'GET') return route.fulfill(json(entry()))
    if (path.startsWith('/calendar-entries/') && method === 'PATCH') {
      const body = req.postDataJSON() as Record<string, unknown>
      patches.push({ id: path.split('/').pop() as string, body })
      return route.fulfill(json({ ...entry(), ...body }))
    }
    if (path === '/campaigns') return route.fulfill(json({ campaigns: [campaign] }))
    if (path === `/campaigns/${C1}`) return route.fulfill(json(campaign))
    if (path === `/campaigns/${C1}/performance`) return route.fulfill(json(performance))
    if (path === `/campaigns/${C1}/readouts`) return route.fulfill(json({ readouts: [readout] }))
    if (path === '/copy/platforms') return route.fulfill(json({ platforms: [{ key: 'x', label: 'X', limit: 280, kind: 'hard' }] }))
    if (path === '/copy/generations') return route.fulfill(json({ generations: [] }))
    if (path === '/media') return route.fulfill(json({ media: [] }))
    if (path === '/analytics') {
      return route.fulfill(json({
        range: '30d',
        traffic_by_week: [{ week_start: '2026-10-19', visits: 300 }],
        cac_by_channel: [{ channel: 'email', spend: 17000, conversions: 11, cac: 1545, attributed_spend: 12000, attributed_conversions: 6, estimated: true }],
        funnel: { impressions: 2000, clicks: 100, conversions: 15, click_through_rate: 5.0, conversion_rate: 15.0 },
        leaderboard: [{ campaign_id: C1, name: 'Waitlist push', clicks: 100, conversions: 10, spend: 20000, cac: 2000 }],
      }))
    }
    if (path === '/metrics') {
      return route.fulfill(json({
        metrics: [{ id: 'm1', ts: '2026-10-20', metric: 'conversions', value: 5, channel: 'email', campaign_id: null, campaign_name: null, created_at: '2026-10-20T18:14:39.358900Z' }],
        total: 1, limit: 25, offset: 0,
      }))
    }
    if (path === '/segments/attributes') return route.fulfill(json({ text: [], channel_acquired: [], behaviour_tags: { max_tags: 10, max_length: 30 } }))
    if (path === '/segments') return route.fulfill(json({ segments: [] }))
    return route.fulfill(json({}))
  })
  return { patches }
}

test.describe('Marketing: founder at 1440', () => {
  test('top bar, PRD empty state, month and week views, drawer extras', async ({ page }) => {
    await setup(page)
    await page.goto('/marketing/calendar')
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Invite' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'An empty calendar is a silent brand.' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Plan my first week/ }).first()).toBeVisible()
    await expect(page.getByRole('group', { name: /month view/ })).toBeVisible()
    await page.getByRole('group', { name: 'Calendar view' }).getByRole('button', { name: 'week' }).click()
    await expect(page.getByRole('group', { name: 'Week view' })).toBeVisible()
    await page.getByRole('button', { name: '+ New post' }).click()
    const dialog = page.getByRole('dialog', { name: 'New post' })
    await expect(dialog.getByRole('button', { name: 'Write with AI' })).toBeVisible()
    await expect(dialog.getByText('Upload an image')).toBeVisible()
    await expect(dialog.getByText(/Status only, not posted to a platform/)).toBeVisible()
    // The floating AI button must not cover the Save button (z-order): the drawer sits above it.
    const save = dialog.getByRole('button', { name: 'Add post' })
    const box = (await save.boundingBox())!
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="dialog"]') !== null, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    expect(hit).toBe(true)
  })

  test('Month to Week opens on the week of today, and the plan button no longer says first week', async ({ page }) => {
    const today = new Date()
    today.setHours(14, 30, 0, 0)
    await setup(page, { entries: [entry({ scheduled_at: today.toISOString() })] })
    await page.goto('/marketing/calendar')
    await expect(page.getByRole('button', { name: 'Plan another week' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Plan my first week/ })).toHaveCount(0)
    await page.getByRole('group', { name: 'Calendar view' }).getByRole('button', { name: 'week' }).click()
    await expect(page.getByRole('group', { name: 'Week view' }).getByRole('button', { name: /Waitlist teaser/ })).toBeVisible()
  })

  test('segment name error clears once a name is typed', async ({ page }) => {
    await setup(page)
    await page.goto('/marketing/segments')
    await page.getByRole('button', { name: /New segment|Create your first segment/ }).first().click()
    await page.getByRole('button', { name: 'Save segment' }).click()
    await expect(page.getByText('Give the segment a name.')).toBeVisible()
    await page.getByLabel('Segment name').fill('Lagos merchants')
    await expect(page.getByText('Give the segment a name.')).toHaveCount(0)
  })

  test('CAC uses two decimals on the cards and the leaderboard', async ({ page }) => {
    await setup(page)
    await page.goto('/marketing/analytics')
    await expect(page.getByText('₦15.45').first()).toBeVisible()
    await expect(page.getByText('₦20.00').first()).toBeVisible()
  })

  test('dragging a post to another day keeps its time and PATCHes scheduled_at', async ({ page }) => {
    const { patches } = await setup(page, { entries: [entry()] })
    await page.goto('/marketing/calendar')
    const chip = page.getByRole('button', { name: /Waitlist teaser/ })
    await expect(chip).toBeVisible()
    const original = new Date(entry().scheduled_at)
    const target = new Date(original)
    target.setDate(original.getDate() + 2)
    // Day cells hold an "Add a post on {Month} {day}" button; its parent cell is the drop target.
    const label = `Add a post on ${target.toLocaleString('en-US', { month: 'long' })} ${target.getDate()}`
    await chip.dragTo(page.getByRole('button', { name: label }).locator('xpath=..'))
    await expect.poll(() => patches.length).toBe(1)
    const sent = new Date(patches[0].body.scheduled_at as string)
    expect([sent.getDate(), sent.getHours(), sent.getMinutes()]).toEqual([target.getDate(), 14, 30])
  })

  test('notification deep link opens that post in the drawer', async ({ page }) => {
    await setup(page)
    await page.goto(`/marketing/calendar?entry=${E1}`)
    const dialog = page.getByRole('dialog', { name: 'Edit post' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Title')).toHaveValue('Waitlist teaser')
    await expect(page).toHaveURL(/\/marketing\/calendar$/)
  })

  test('campaign detail: readout card, totals, per-day and estimated channel charts', async ({ page }) => {
    await setup(page)
    await page.goto(`/marketing/campaigns/${C1}`)
    await expect(page.getByRole('heading', { name: 'Waitlist push', level: 1 })).toBeVisible()
    await expect(page.getByText('Clicks are up')).toBeVisible()
    await expect(page.getByText(/Week of October 19, 2026/)).toBeVisible()
    await expect(page.getByText('5.0%').first()).toBeVisible()
    await expect(page.getByRole('img', { name: /Clicks per day/ })).toBeVisible()
    await expect(page.getByRole('img', { name: /Estimated spend by channel/ })).toBeVisible()
    await expect(page.getByText(/Nothing syncs from an ad platform/)).toBeVisible()
  })

  test('completing a campaign asks first', async ({ page }) => {
    await setup(page)
    await page.goto(`/marketing/campaigns/${C1}`)
    await page.getByRole('button', { name: 'Complete' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Completing a campaign is final')
    await page.getByRole('button', { name: 'Keep it running' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })

  for (const route of ['/marketing/calendar', `/marketing/campaigns/${C1}`, '/marketing/campaigns', '/marketing/copy', '/marketing/analytics']) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await setup(page, { entries: [entry()] })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations).toEqual([])
    })
  }
})

test.describe('Marketing: 375', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('calendar is a dated agenda, not a truncated grid, and the page does not scroll sideways', async ({ page }) => {
    await setup(page, { entries: [entry()] })
    await page.goto('/marketing/calendar')
    await expect(page.getByRole('list', { name: 'Agenda' })).toBeVisible()
    await expect(page.getByRole('group', { name: /month view/ })).toBeHidden()
    await expect(page.getByRole('button', { name: /Waitlist teaser/ })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })

  test('analytics: the recorded entries table scrolls inside its card, never the page', async ({ page }) => {
    await setup(page)
    await page.goto('/marketing/analytics')
    await expect(page.getByRole('region', { name: 'Recorded entries' })).toBeVisible()
    await expect(page.getByText('Estimated', { exact: true })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })

  test('campaigns are cards, with the status and actions visible without sideways scrolling', async ({ page }) => {
    await setup(page)
    await page.goto('/marketing/campaigns')
    const list = page.getByRole('list', { name: 'Campaigns' })
    await expect(list).toBeVisible()
    await expect(list.getByText('active', { exact: true })).toBeVisible()
    await expect(list.getByRole('button', { name: 'Pause' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })
})

test.describe('Marketing: roles', () => {
  test('a team member keeps full access (D-MKT-1)', async ({ page }) => {
    await setup(page, { role: 'team_member' })
    await page.goto('/marketing/campaigns')
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ New campaign' })).toBeVisible()
  })

  test('a mentor gets a clean denial, not a broken page', async ({ page }) => {
    await setup(page, { role: 'mentor' })
    await page.goto('/marketing')
    await expect(page.getByText("You don't have access to this page.")).toBeVisible()
  })
})
