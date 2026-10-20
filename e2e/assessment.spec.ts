import { test, expect, type Page } from '@playwright/test'

// Assessment PRD (Module 07) rows 1-4, 7, 9-13. The API is mocked with the shapes
// captured live in cofoundaz-api/docs/fe-integration-guide-assessment-prd.md.

const WS = '48469527-1d83-4ddf-afd0-b4df963e92e1'
const A1 = '7e7286ef-d15f-4dc4-a76d-df4bbf35721d'
const A2 = '49e9139f-3b63-4efc-bdff-5e347e0a263d'

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

const row = (over: Record<string, unknown>) => ({
  id: A1,
  type: 'initial',
  status: 'completed',
  started_at: '2026-07-01T10:00:00+00:00',
  completed_at: '2026-07-02T10:00:00+00:00',
  overall_provisional: 80,
  stage_at_time: 'build',
  progress: null,
  ...over,
})

const question = {
  key: 'product_stage',
  dimension: 'product',
  section: 'Product',
  qtype: 'single_choice',
  prompt: 'How far along is your product?',
  options: [
    { value: 'idea', label: 'Just an idea' },
    { value: 'live', label: 'Live with users' },
  ],
  helper: null,
}

type Opts = { role?: string; list?: unknown[]; quarterlyDue?: boolean; health?: unknown }

async function setup(page: Page, o: Opts = {}) {
  const role = o.role ?? 'founder'
  let healthScore = 88
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  await page.route('**/api/v1/health-score', (route) =>
    route.fulfill(json({ status: 'ok', score: healthScore, band: 'healthy', delta_7d: 0, summary: 's', dimensions: [], top_recommendations: [] }))
  )
  await page.route('**/api/v1/assessments?**', (route) =>
    route.fulfill(json(o.list ?? [], { next_cursor: null, total_estimate: null, quarterly_due: o.quarterlyDue ?? false }))
  )
  await page.route('**/api/v1/assessments', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ ...json({ assessment_id: A2, type: 'quarterly', status: 'in_progress', next_question: question, progress: { answered: 0, remaining: 8, pct: 0 } }), status: 201 })
    }
    return route.fulfill(json(o.list ?? [], { next_cursor: null, total_estimate: null, quarterly_due: o.quarterlyDue ?? false }))
  })
  await page.route(`**/api/v1/assessments/${A2}/next-question`, (route) =>
    route.fulfill(json({ next_question: null, progress: { answered: 8, remaining: 0, pct: 100 } }))
  )
  await page.route(`**/api/v1/assessments/${A2}/complete`, (route) => {
    healthScore = 95
    return route.fulfill(
      json(
        o.health ?? {
          assessment_id: A2,
          status: 'completed',
          dimension_scores: { product: 50, market: 50, money: 50, legal: 50, team: 50 },
          overall_provisional: 50,
          narrative: '',
          health: null,
        }
      )
    )
  })
}

test.describe('Assessment: founder', () => {
  test('first run: top bar, "Let\'s calibrate {startup}", Begin', async ({ page }) => {
    await setup(page)
    await page.goto('/assessment')
    await expect(page.getByRole('heading', { name: "Let's calibrate NovaPay" })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Invite' })).toBeVisible()
    await page.getByRole('button', { name: '+ Invite' }).click()
    await expect(page.getByText('Invite to NovaPay')).toBeVisible()
  })

  test('in-progress card reads "You\'re {pct}% through"', async ({ page }) => {
    await setup(page, {
      list: [row({ status: 'in_progress', completed_at: null, overall_provisional: null, stage_at_time: null, progress: { answered: 4, remaining: 4, pct: 50 } })],
    })
    await page.goto('/assessment')
    await expect(page.getByText("You're 50% through. Pick up where you left off.")).toBeVisible()
  })

  test('quarterly banner starts a re-assessment', async ({ page }) => {
    await setup(page, { list: [row({})], quarterlyDue: true })
    await page.goto('/assessment')
    const banner = page.getByRole('region', { name: 'Quarterly re-assessment due' })
    await banner.getByRole('button', { name: 'Start re-assessment' }).click()
    await expect(page).toHaveURL(new RegExp(`/assessment/run/${A2}`))
  })

  test('completion shows the new Health Score, per-dimension change and refreshes the header', async ({ page }) => {
    const dims = ['product', 'market', 'money', 'legal', 'team']
    await setup(page, {
      health: {
        assessment_id: A2,
        status: 'completed',
        dimension_scores: { product: 78, market: 75, money: 71, legal: 100, team: 75 },
        overall_provisional: 80,
        narrative: 'Your strongest area is legal (100). Focus next on money (71).',
        health: {
          score: 95,
          previous_score: 88,
          delta: 7,
          dimensions: dims.map((key, i) => ({ key, score: 70 + i, previous: 60 + i, delta: i === 1 ? -3 : 10 })),
        },
      },
    })
    await page.goto(`/assessment/run/${A2}`)
    await expect(page.getByRole('heading', { name: 'Your Health Score is now 95.' })).toBeVisible()
    await expect(page.getByText("Here's what changed.")).toBeVisible()
    await expect(page.getByLabel('Market change -3')).toBeVisible()
    await expect(page.getByRole('button', { name: 'See my dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Health score 95' })).toBeVisible()
  })

  test('results: stage at time, "not recorded", answers with changed_from', async ({ page }) => {
    await setup(page, { list: [row({ id: A2, type: 'quarterly' }), row({ stage_at_time: null, completed_at: '2026-04-02T10:00:00+00:00' })] })
    await page.route(`**/api/v1/assessments/${A2}`, (route) =>
      route.fulfill(
        json({
          id: A2,
          type: 'quarterly',
          status: 'completed',
          stage_at_time: 'build',
          answers_by_dimension: {},
          answers: [
            {
              dimension: 'product',
              questions: [
                { question_key: 'product_stage', prompt: 'How far along is your product?', qtype: 'single_choice', value: 'idea', answer_label: 'Just an idea', changed: true, changed_from: 'Live with users' },
              ],
            },
          ],
          result: { dimension_scores: { product: 25, market: 38, money: 43, legal: 0, team: 50 }, overall_provisional: 31, narrative: 'n' },
        })
      )
    )
    await page.goto('/assessment/results')
    await expect(page.getByText('Stage at time: Build')).toBeVisible()
    await expect(page.getByText('Stage at time: not recorded')).toBeVisible()
    await page.getByRole('button', { name: /Quarterly check-in/ }).click()
    await expect(page.getByText('Changed from: Live with users')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Product answers' })).toBeVisible()
  })
})

test.describe('Assessment: team member (read-only)', () => {
  test('sees results and compare, never start, resume or in-progress', async ({ page }) => {
    await setup(page, {
      role: 'team_member',
      list: [row({ status: 'in_progress', completed_at: null, progress: { answered: 4, remaining: 4, pct: 50 } }), row({ id: A2 })],
      quarterlyDue: true,
    })
    await page.goto('/assessment')
    await expect(page.getByText(/Only founders can take the assessment/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'View past results' })).toBeVisible()
    for (const name of ['Begin', 'Start a check-in', 'Resume', 'Start re-assessment', 'In progress', '+ Invite']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
    }
    await expect(page.getByText(/through\. Pick up/)).toHaveCount(0)
  })
})
