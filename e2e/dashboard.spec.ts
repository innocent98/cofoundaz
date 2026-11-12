import { test, expect, type Page } from '@playwright/test'

// Dashboard rows from docs/checklist/dashboard-rewalk.md (gaps 1, 4, 5, 6, 7, 10). The API is mocked with the shapes
// captured live in cofoundaz-api/docs/fe-integration-guide-dashboard-role-leaks.md.

const WS = '48469527-1d83-4ddf-afd0-b4df963e92e1'

const json = (data: unknown, meta: unknown = null) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data, meta }),
})

const me = (role: string) => ({
  user: { id: 'u1', email: 'placeholder@example.com' },
  profile: { full_name: 'Placeholder Person', role_title: 'Founder', country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role }],
  active_workspace_id: WS,
})

const restrictedBlock = { status: 'restricted', message: null, id: null, actions: [] }

const summary = (restricted: boolean) => ({
  greeting: { salutation: 'Good morning', first_name: 'Placeholder', startup_name: 'NovaPay' },
  health: { status: 'ok', score: 90, delta_7d: 1, summary: 'Your Health Score is 90.' },
  mission: restricted
    ? null
    : {
        mission_date: '2026-10-20',
        status: 'pending',
        streak: 0,
        tasks: [{ id: 't1', roadmap_task_id: 'r1', title: 'Run 10 customer interviews', reason: 'From your milestone.', effort: 'medium', status: 'todo', order: 0, completed_at: null, reject_reason: null, milestone: null }],
        empty_reason: null,
      },
  mission_status: restricted ? 'restricted' : 'ok',
  upcoming: [],
  kpis: {
    tasks_done_this_week: 2,
    metrics: {
      revenue: { status: restricted ? 'restricted' : 'no_data' },
      runway: { status: restricted ? 'restricted' : 'no_data' },
      pipeline: { status: 'not_built', value_minor: null, currency: null },
      campaign_ctr: { status: restricted ? 'restricted' : 'no_data' },
    },
  },
  calibration: { assessment_complete: true },
  briefing: restricted ? restrictedBlock : { status: 'ready', id: 'b1', message: 'NovaPay is at the idea stage.', actions: [] },
  risks: restricted ? { status: 'restricted', message: null, items: [] } : { status: 'ready', items: [] },
  opportunities: restricted ? { status: 'restricted', message: null, items: [] } : { status: 'ready', items: [] },
})

async function setup(page: Page, role: string) {
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  await page.route('**/api/v1/dashboard/summary', (route) => route.fulfill(json(summary(role !== 'founder' && role !== 'team_member'))))
  await page.route('**/api/v1/dashboard/activity**', (route) => route.fulfill(json({ items: [], next_cursor: null })))
  await page.route('**/api/v1/health-score', (route) =>
    route.fulfill(json({ status: 'ok', score: 90, band: 'healthy', delta_7d: 1, summary: 's', dimensions: [], top_recommendations: [] }))
  )
}

test.describe('Dashboard: mentor (mission_status restricted)', () => {
  test.beforeEach(async ({ page }) => setup(page, 'mentor'))

  test('no Mission card, no empty state, no Tasks tile, Pipeline tile has no link, footer says Mentor', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Startup Health')).toBeVisible()
    await expect(page.getByRole('heading', { name: "Today's Mission" })).toHaveCount(0)
    await expect(page.getByText(/kickoff assessment/)).toHaveCount(0)
    await expect(page.getByText('Tasks This Week')).toHaveCount(0)
    await expect(page.getByText('Pipeline Value')).toBeVisible()
    await expect(page.getByRole('link', { name: /Pipeline Value/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Mentor/ })).toBeVisible()
  })

  test('a section page has no fake + Invite', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Invite' })).toHaveCount(0)
  })
})

test.describe('Dashboard: founder', () => {
  test.beforeEach(async ({ page }) => setup(page, 'founder'))

  test('Mission card is shown, and Escape closes the AI drawer', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Run 10 customer interviews')).toBeVisible()
    await page.keyboard.press('Control+j')
    await expect(page.getByText('Open full view →')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Open full view →')).toHaveCount(0)
  })

  test('+ Invite on a section page opens the real invite modal', async ({ page }) => {
    await page.goto('/documents')
    await page.getByRole('button', { name: '+ Invite' }).click()
    await expect(page.getByText('Invite to NovaPay')).toBeVisible()
  })

  test('375px: the floating AI button is gone (the tab bar has AI) and nothing overflows', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    await expect(page.getByText('Run 10 customer interviews')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ask your AI Co-Founder' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'AI' })).toBeVisible()
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(overflows).toBe(false)
  })
})

test.describe('Dashboard: Team activity load more (gap 11)', () => {
  const row = (n: number) => ({
    id: `act-${n}`,
    actor: { name: 'Placeholder Person' },
    summary: `Placeholder Person did thing ${n}`,
    created_at: '2026-10-20T10:00:00Z',
  })

  test('Load more appends the next page, retries after a failure, and hides at the end', async ({ page }) => {
    await setup(page, 'founder')
    let failNext = true
    await page.route('**/api/v1/dashboard/activity**', (route) => {
      const cursor = new URL(route.request().url()).searchParams.get('cursor')
      if (!cursor) return route.fulfill(json({ items: [row(1), row(2)], next_cursor: 'c2' }))
      if (failNext) {
        failNext = false
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'boom' }) })
      }
      return route.fulfill(json({ items: [row(2), row(3)], next_cursor: null }))
    })
    await page.goto('/dashboard')
    await expect(page.getByText('Placeholder Person did thing 2')).toBeVisible()

    await page.getByRole('button', { name: 'Load more' }).click()
    await expect(page.getByText("Couldn't load more activity.")).toBeVisible()
    await expect(page.getByText('Placeholder Person did thing 1')).toBeVisible()

    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page.getByText('Placeholder Person did thing 3')).toBeVisible()
    await expect(page.getByText('Placeholder Person did thing 2')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  })
})
