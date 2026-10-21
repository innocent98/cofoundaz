import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page, type Route } from '@playwright/test'

// Sales AI Coach (role-play, call prep) and Analytics. The API is mocked with the shapes captured live in
// cofoundaz-api/docs/fe-integration-guide-sales-coach-analytics.md; ids, names and text are placeholders.

const WS = '57829571-0f6c-4298-8e87-5cbc70631b58'
const DEAL = '75dacf34-13a8-4443-bad7-7d1156873ade'
const SESSION = 'c023d44e-4c1f-4dfa-b72b-5e1c662fd4b5'

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify({ data, meta: null }),
})
const err = (status: number, code: string, message: string) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify({ error: { code, message, field_errors: [] } }),
})
const me = (role: string) => ({
  user: { id: 'u1', email: 'placeholder@example.com' },
  profile: { full_name: 'Placeholder Person', role_title: null, country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role }],
  active_workspace_id: WS,
})

const deal = {
  id: DEAL,
  name: 'Acme fleet payments',
  account_id: null,
  account_name: 'Acme Logistics',
  contact_id: null,
  contact_name: null,
  value_minor: 250000000,
  currency: 'NGN',
  stage_id: 'st1',
  next_step: null,
  next_step_due: null,
  closed_reason: null,
  closed_note: null,
  closed_at: null,
  owner_id: null,
  last_activity_at: '2026-10-21T11:58:05.379020Z',
  is_stalled: false,
  days_inactive: 0,
  created_at: '2026-10-21T11:58:05.374886Z',
}

const msg = (id: string, role: 'user' | 'assistant', status: string, content: string) => ({
  id,
  role,
  status,
  content,
  created_at: '2026-10-21T12:30:33.257655+00:00',
})
const sessionBase = {
  id: SESSION,
  mode: 'roleplay',
  deal_id: DEAL,
  deal_name: 'Acme fleet payments',
  scenario: null,
  persona: 'Skeptical CFO',
  difficulty: 'tough',
  scorecard: null,
  scorecard_error: null,
  created_at: '2026-10-21T12:30:33.243880+00:00',
  ended_at: null,
}

const funnelStage = (id: string, name: string, kind: string, reached: number, pct: number | null) => ({
  stage_id: id,
  name,
  kind,
  reached,
  conversion_from_previous_pct: pct,
})
const analytics = {
  from: '2026-09-22',
  to: '2026-10-21',
  currency: 'NGN',
  funnel: {
    deals_created: 3,
    stages: [
      funnelStage('a', 'New', 'open', 3, null),
      funnelStage('b', 'Contacted', 'open', 3, 100.0),
      funnelStage('c', 'Qualified', 'open', 3, 100.0),
      funnelStage('d', 'Proposal', 'open', 3, 100.0),
      funnelStage('e', 'Negotiation', 'open', 2, 66.7),
      funnelStage('f', 'Closed Won', 'won', 1, 50.0),
    ],
  },
  avg_cycle_days: 12.0,
  won: { count: 1, value_minor: 40000000 },
  win_loss: { won: 1, lost: 1, win_rate_pct: 50.0, loss_reasons: [{ reason: 'price', count: 1, value_minor: 9000000 }] },
  leaderboard: [
    { user_id: 'u1', name: 'Ada Founder', total: 3, calls: 2, emails: 1, meetings: 0, notes: 0 },
    { user_id: 'u2', name: 'tm@example.com', total: 0, calls: 0, emails: 0, meetings: 0, notes: 0 },
  ],
  monthly_revenue: [
    ...['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map((month) => ({ month, value_minor: 0, deal_count: 0 })),
    { month: '2026-09', value_minor: 15000000, deal_count: 1 },
    { month: '2026-10', value_minor: 40000000, deal_count: 1 },
  ],
}

interface Calls {
  created: Record<string, unknown>[]
  turns: string[]
  ends: number
  preps: number
  analyticsQueries: string[]
}
interface Opts {
  role?: string
  overBudget?: boolean
  /** Buyer replies that fail instead of landing (first N turns). */
  failFirstReply?: boolean
  scorecardFails?: boolean
  prepFails?: boolean
  noDeals?: boolean
}

async function setup(page: Page, o: Opts = {}) {
  const role = o.role ?? 'founder'
  const calls: Calls = { created: [], turns: [], ends: 0, preps: 0, analyticsQueries: [] }
  // The buyer turn stays `generating` for the first poll, then lands.
  let replyPolls = 0
  let turnCount = 0
  let ended = false
  let scorePolls = 0
  let prepPolls = 0
  let prepRequested = false

  const thread = () => {
    const out = [msg('m1', 'user', 'ready', 'Hi, thanks for making time.')]
    if (turnCount >= 1) {
      out.push(
        replyPolls < 1
          ? msg('b1', 'assistant', 'generating', '')
          : o.failFirstReply && turnCount === 1
            ? msg('b1', 'assistant', 'failed', '')
            : msg('b1', 'assistant', 'ready', 'Mostly cash, kept at home. What happens on withdrawal?')
      )
    }
    return out
  }
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  await page.route('**/api/v1/team/members', (route) =>
    route.fulfill(json([{ user_id: 'u1', name: 'Placeholder Person', email: 'placeholder@example.com', role }]))
  )
  await page.route('**/api/v1/ai/status', (route) =>
    route.fulfill(
      json({ tokens_used_today: o.overBudget ? 100000 : 100, daily_budget: 100000, over_budget: !!o.overBudget, resets_at: '2026-10-22T00:00:00+00:00', recent_enrichment_failures: [] })
    )
  )
  const handler = async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname.replace('/api/v1/sales', '') || '/'
    const method = req.method()
    const body = req.postData() ? JSON.parse(req.postData()!) : {}
    if (role !== 'founder' && role !== 'team_member') return route.fulfill(err(403, 'FORBIDDEN', "You don't have permission to do that."))

    if (path === '/deals' && method === 'GET') {
      const items = o.noDeals ? [] : [deal]
      return route.fulfill(json({ items, total: items.length, limit: 200, offset: 0 }))
    }
    if (path === '/coach/sessions' && method === 'GET') return route.fulfill(json([]))
    if (path === '/coach/sessions' && method === 'POST') {
      calls.created.push(body)
      turnCount = body.message ? 1 : 0
      replyPolls = 0
      ended = false
      return route.fulfill(json({ ...sessionBase, persona: body.persona, difficulty: body.difficulty, status: 'active', messages: thread() }, 201))
    }
    if (path === `/coach/sessions/${SESSION}` && method === 'GET') {
      if (turnCount >= 1 && replyPolls < 1) replyPolls++
      if (ended) {
        scorePolls++
        if (scorePolls < 2) return route.fulfill(json({ ...sessionBase, status: 'scoring', ended_at: 'x', messages: thread() }))
        if (o.scorecardFails) return route.fulfill(json({ ...sessionBase, status: 'ended', scorecard_error: 'over_budget', messages: thread() }))
        return route.fulfill(
          json({
            ...sessionBase,
            status: 'ended',
            scorecard: { scores: { discovery: 6, objection_handling: 8, next_step_close: 3 }, overall: 5.7, feedback: ['Ask what a missed payout costs them.', 'Name a date for the next step.'] },
            messages: thread(),
          })
        )
      }
      return route.fulfill(json({ ...sessionBase, status: 'active', messages: thread() }))
    }
    if (path === `/coach/sessions/${SESSION}/messages` && method === 'POST') {
      calls.turns.push(body.content)
      turnCount++
      replyPolls = 0
      return route.fulfill(json(msg('b1', 'assistant', 'generating', ''), 202))
    }
    if (path === `/coach/sessions/${SESSION}/end` && method === 'POST') {
      calls.ends++
      ended = true
      scorePolls = 0
      return route.fulfill(json({ ...sessionBase, status: 'scoring', ended_at: 'x', messages: thread() }, 202))
    }
    if (path === `/deals/${DEAL}/call-prep` && method === 'GET') {
      if (!prepRequested) return route.fulfill(json(null))
      prepPolls++
      const base = { id: 'p1', deal_id: DEAL, created_at: '2026-10-21T12:30:34.243166+00:00' }
      if (prepPolls < 2) return route.fulfill(json({ ...base, status: 'generating', output: null, error: null }))
      if (o.prepFails) return route.fulfill(json({ ...base, status: 'failed', output: null, error: 'over_budget' }))
      return route.fulfill(
        json({
          ...base,
          status: 'ready',
          output: {
            context: 'Proposal sent last week; the buyer has not replied.',
            call_goal: 'Agree a pilot start date.',
            objections: [{ objection: 'Riders will not trust an app.', response: 'Lead with the licensed partner bank.' }],
            discovery_questions: ['How do riders save today?', 'What does a missed payout cost?', 'Who signs off?'],
          },
          error: null,
        })
      )
    }
    if (path === `/deals/${DEAL}/call-prep` && method === 'POST') {
      calls.preps++
      prepRequested = true
      prepPolls = 0
      return route.fulfill(json({ id: 'p1', deal_id: DEAL, status: 'generating', output: null, error: null, created_at: '2026-10-21T12:30:34.243166+00:00' }, 202))
    }
    if (path === '/analytics') {
      calls.analyticsQueries.push(url.search)
      return route.fulfill(json(analytics))
    }
    return route.fulfill(json({}))
  }
  await page.route('**/api/v1/sales', handler)
  await page.route('**/api/v1/sales/**', handler)
  return calls
}

const SLOW = { timeout: 12_000 }

test.describe('Sales coach: role-play at 1440', () => {
  test('setup, live chat, End session, scorecard, Practice this again', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/coach')
    await expect(page.getByText('Rehearse here, win out there.')).toBeVisible()

    // validation first
    await page.getByRole('button', { name: 'Start role-play' }).click()
    await expect(page.getByText('Pick a deal or describe a scenario.')).toBeVisible()

    await page.getByLabel('Practise on a deal').selectOption(DEAL)
    await page.getByRole('radio', { name: 'Tough' }).click()
    await page.getByLabel('Your opening line (optional)').fill('Hi, thanks for making time.')
    await page.getByRole('button', { name: 'Start role-play' }).click()
    expect(calls.created[0]).toEqual({ deal_id: DEAL, persona: 'Skeptical CFO', difficulty: 'tough', message: 'Hi, thanks for making time.' })

    // the buyer's reply is generating, input and End session are locked, then it lands
    await expect(page.getByText('The buyer is replying...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'End session' })).toBeDisabled()
    await expect(page.getByText('Mostly cash, kept at home. What happens on withdrawal?')).toBeVisible(SLOW)
    await expect(page.getByLabel('Your response to the buyer')).toBeEnabled()

    await page.getByLabel('Your response to the buyer').fill('Withdrawals are instant.')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect.poll(() => calls.turns).toEqual(['Withdrawals are instant.'])

    await expect(page.getByRole('button', { name: 'End session' })).toBeEnabled(SLOW)
    await page.getByRole('button', { name: 'End session' }).click()
    await expect(page.getByText('Scoring your call')).toBeVisible()
    await expect(page.getByText('Session scorecard')).toBeVisible(SLOW)
    await expect(page.getByText('6/10')).toBeVisible()
    await expect(page.getByText('8/10')).toBeVisible()
    await expect(page.getByText('3/10')).toBeVisible()
    await expect(page.getByText('Name a date for the next step.')).toBeVisible()

    await page.getByRole('button', { name: 'Practice this again' }).click()
    await expect.poll(() => calls.created.length).toBe(2)
    expect(calls.created[1]).toEqual({ deal_id: DEAL, persona: 'Skeptical CFO', difficulty: 'tough' })
    await expect(page.getByText('Practice call')).toBeVisible()
  })

  test('a buyer turn that fails is not a dead session', async ({ page }) => {
    await setup(page, { failFirstReply: true })
    await page.goto('/sales/coach')
    await page.getByLabel('Describe the call').fill('Cold call to a bakery chain')
    await page.getByLabel('Your opening line (optional)').fill('Hello')
    await page.getByRole('button', { name: 'Start role-play' }).click()
    await expect(page.getByText("The buyer couldn't reply. Try sending again.")).toBeVisible(SLOW)
    await expect(page.getByLabel('Your response to the buyer')).toBeEnabled()
  })

  test('a scorecard that fails says why and offers Try again', async ({ page }) => {
    const calls = await setup(page, { scorecardFails: true })
    await page.goto('/sales/coach')
    await page.getByLabel('Describe the call').fill('Cold call to a bakery chain')
    await page.getByLabel('Your opening line (optional)').fill('Hello')
    await page.getByRole('button', { name: 'Start role-play' }).click()
    await expect(page.getByRole('button', { name: 'End session' })).toBeEnabled(SLOW)
    await page.getByRole('button', { name: 'End session' }).click()
    await expect(page.getByText("We couldn't score this call")).toBeVisible(SLOW)
    await expect(page.getByText(/daily AI limit/)).toBeVisible()
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect.poll(() => calls.ends).toBe(2)
  })

  test('over the daily AI limit the page says so before anything is started', async ({ page }) => {
    await setup(page, { overBudget: true })
    await page.goto('/sales/coach')
    await expect(page.getByText('Daily AI limit used up.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start role-play' })).toBeDisabled()
  })
})

test.describe('Sales coach: call prep', () => {
  test('pick a deal, generate, read the brief, regenerate', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/coach')
    await page.getByRole('tab', { name: 'Call prep' }).click()
    await page.getByLabel('Deal', { exact: true }).selectOption(DEAL)
    await page.getByRole('button', { name: 'Generate call prep' }).click()
    expect(calls.preps).toBe(1)
    await expect(page.getByText('Writing your call prep...')).toBeVisible()
    await expect(page.getByText('Proposal sent last week; the buyer has not replied.')).toBeVisible(SLOW)
    await expect(page.getByText('Riders will not trust an app.')).toBeVisible()
    await expect(page.getByText('Agree a pilot start date.')).toBeVisible()
    await expect(page.getByText('Who signs off?')).toBeVisible()
    await page.getByRole('button', { name: 'Regenerate' }).click()
    await expect.poll(() => calls.preps).toBe(2)
  })

  test('the deal link opens the tab with the deal chosen', async ({ page }) => {
    await setup(page)
    await page.goto(`/sales/coach?tab=prep&deal=${DEAL}`)
    await expect(page.getByRole('heading', { name: 'Call prep: Acme fleet payments' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate call prep' })).toBeVisible()
  })

  test('a failed prep over budget is stated plainly', async ({ page }) => {
    await setup(page, { prepFails: true })
    await page.goto(`/sales/coach?tab=prep&deal=${DEAL}`)
    await page.getByRole('button', { name: 'Generate call prep' }).click()
    await expect(page.getByText(/daily AI limit/).first()).toBeVisible(SLOW)
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('with no deals there is an honest empty state', async ({ page }) => {
    await setup(page, { noDeals: true })
    await page.goto('/sales/coach?tab=prep')
    await expect(page.getByText('No deals to prep for yet')).toBeVisible()
  })
})

test.describe('Sales analytics', () => {
  test('shows every widget from the API: funnel with Contacted, donut, leaderboard, revenue', async ({ page }) => {
    await setup(page)
    await page.goto('/sales/analytics')
    await expect(page.getByRole('heading', { name: 'Sales analytics' })).toBeVisible()
    const funnel = page.getByRole('region', { name: 'Funnel by stage' })
    for (const stage of ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won']) {
      await expect(funnel.getByText(stage, { exact: true })).toBeVisible()
    }
    await expect(page.getByText('12 days')).toBeVisible()
    await expect(page.getByText('₦400,000.00').first()).toBeVisible()
    await expect(page.getByRole('region', { name: 'Win and loss reasons' }).getByText('Lost: Price')).toBeVisible()
    await expect(page.getByRole('img', { name: /Closed deals: Won 1 \(50%\)/ })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Activity leaderboard' }).getByText('Ada Founder')).toBeVisible()
    await expect(page.getByRole('img', { name: /Closed-won revenue by month/ })).toBeVisible()
    await expect(page.getByText('This chart does not follow the date range above.')).toBeVisible()
  })

  test('changing the range asks the API for those UTC days; a bad custom range never leaves the page', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/analytics')
    await expect(page.getByRole('heading', { name: 'Sales analytics' })).toBeVisible()
    await page.getByLabel('Date range').selectOption('7')
    await expect.poll(() => calls.analyticsQueries.length).toBeGreaterThan(1)
    expect(calls.analyticsQueries.at(-1)).toMatch(/^\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/)

    await page.getByLabel('Date range').selectOption('custom')
    const before = calls.analyticsQueries.length
    await page.getByLabel('From').fill('2024-01-01')
    await page.getByRole('button', { name: 'Apply range' }).click()
    await expect(page.getByText('Pick a range of at most 366 days.')).toBeVisible()
    expect(calls.analyticsQueries.length).toBe(before)

    await page.getByLabel('From').fill('2026-01-01')
    await page.getByRole('button', { name: 'Apply range' }).click()
    await expect.poll(() => calls.analyticsQueries.at(-1)).toContain('from=2026-01-01')
  })
})

test.describe('Sales coach and analytics: accessibility', () => {
  for (const route of ['/sales/coach', `/sales/coach?tab=prep&deal=${DEAL}`, '/sales/analytics']) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await setup(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      await page.waitForTimeout(500)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations).toEqual([])
    })
  }
})

test.describe('Sales coach and analytics: 375', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const route of ['/sales/coach', `/sales/coach?tab=prep&deal=${DEAL}`, '/sales/analytics']) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await setup(page)
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      await page.waitForTimeout(400)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    })
  }

  test('a live chat fits and can be used at 375', async ({ page }) => {
    await setup(page)
    await page.goto('/sales/coach')
    await page.getByLabel('Describe the call').fill('Cold call to a bakery chain')
    await page.getByLabel('Your opening line (optional)').fill('Hi, thanks for making time.')
    await page.getByRole('button', { name: 'Start role-play' }).click()
    await expect(page.getByText('Mostly cash, kept at home. What happens on withdrawal?')).toBeVisible(SLOW)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  })
})

test.describe('Sales coach and analytics: roles', () => {
  test('a team member has full access', async ({ page }) => {
    await setup(page, { role: 'team_member' })
    await page.goto('/sales/analytics')
    await expect(page.getByRole('heading', { name: 'Sales analytics' })).toBeVisible()
  })

  for (const role of ['mentor', 'business_consultant']) {
    for (const route of ['/sales/coach', '/sales/analytics']) {
      test(`a ${role} is denied ${route}`, async ({ page }) => {
        await setup(page, { role })
        await page.goto(route)
        await expect(page.getByText("You don't have access to this page.")).toBeVisible()
      })
    }
  }
})
