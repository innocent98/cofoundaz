import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page, type Route } from '@playwright/test'

// Sales CRM (Pipeline, Leads, Accounts). The API is mocked with the shapes captured live in
// cofoundaz-api/docs/fe-integration-guide-sales-crm.md; ids, names and addresses are placeholders.

const WS = '57829571-0f6c-4298-8e87-5cbc70631b58'
const ST = {
  new: '42bb4376-6516-42e8-afa4-2868b9d57582',
  contacted: '18d4f674-b17f-4e3c-ad92-33288b28bed4',
  won: '86b96932-77b7-4915-983e-00d5da346f36',
  lost: 'bbc20e32-c63a-4ed9-a153-5f269239e62a',
}
const D1 = '6c62e89d-651d-4634-9c3e-3a12319b17be'
const D2 = 'f9c69088-b134-4147-aa03-e424c2fd2320'
const ACC = '6a5e9104-94ee-4f8e-a78e-25bc7bce5292'
const CON = 'a464ba09-10f9-4e0f-afc1-25e9ca7518b2'
const LEAD = '2de2187e-63d9-4c0d-b1ed-838ee910fbe3'

const json = (data: unknown, meta: unknown = null) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data, meta }),
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

const stages = [
  { id: ST.new, name: 'New', position: 0, kind: 'open', win_probability: 10 },
  { id: ST.contacted, name: 'Contacted', position: 1, kind: 'open', win_probability: 20 },
  { id: ST.won, name: 'Closed Won', position: 2, kind: 'won', win_probability: 100 },
  { id: ST.lost, name: 'Closed Lost', position: 3, kind: 'lost', win_probability: 0 },
]
// Four columns keep every column inside one 1440 viewport, so a real mouse drag can reach them all.

function deal(over: Record<string, unknown> = {}) {
  return {
    id: D2,
    name: 'Acme fleet rollout',
    account_id: ACC,
    account_name: 'Acme Logistics',
    contact_id: CON,
    contact_name: 'Tunde Okafor',
    value_minor: 250000000,
    currency: 'NGN',
    stage_id: ST.new,
    next_step: 'Send proposal',
    next_step_due: '2026-10-24',
    closed_reason: null,
    closed_note: null,
    closed_at: null,
    owner_id: null,
    last_activity_at: '2026-10-21T11:58:05.379020Z',
    is_stalled: false,
    days_inactive: 0,
    created_at: '2026-10-21T11:58:05.374886Z',
    ...over,
  }
}

const lead = (over: Record<string, unknown> = {}) => ({
  id: LEAD,
  name: 'Chidi Eze',
  company: 'Zenith Foods',
  email: 'chidi@zenith.example',
  source: 'referral',
  status: 'new',
  owner_id: null,
  converted_deal_id: null,
  converted_contact_id: null,
  converted_account_id: null,
  created_at: '2026-10-21T11:58:05.245348Z',
  ...over,
})

const account = {
  id: ACC,
  name: 'Acme Logistics',
  website: 'https://acme.example',
  industry: 'Logistics',
  description: null,
  owner_id: null,
  created_at: '2026-10-21T11:58:05.201333Z',
}
const contact = {
  id: CON,
  account_id: ACC,
  first_name: 'Tunde',
  last_name: 'Okafor',
  email: 'tunde@acme.example',
  phone: null,
  title: 'Head of Ops',
  created_at: '2026-10-21T11:58:05.220176Z',
}

const activity = {
  id: '87d5a240-6492-4cee-a17b-14b5a4d46d2b',
  kind: 'note',
  body: 'Account prefers WhatsApp',
  occurred_at: '2026-10-21T11:58:05.649594Z',
  author_id: null,
  account_id: ACC,
  contact_id: CON,
  deal_id: null,
  created_at: '2026-10-21T11:58:05.644856Z',
}

interface Calls {
  moves: Record<string, unknown>[]
  leadsCreated: Record<string, unknown>[]
  dealsCreated: Record<string, unknown>[]
  imports: Record<string, unknown>[]
  activities: Record<string, unknown>[]
  stagesSaved: Record<string, unknown>[]
}
type Opts = { role?: string; deals?: unknown[]; moveError?: boolean }

async function setup(page: Page, o: Opts = {}) {
  const role = o.role ?? 'founder'
  const calls: Calls = { moves: [], leadsCreated: [], dealsCreated: [], imports: [], activities: [], stagesSaved: [] }
  const deals = (o.deals ?? [deal()]) as ReturnType<typeof deal>[]
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
    const body = req.postData() && !req.postData()!.startsWith('--') ? JSON.parse(req.postData()!) : {}
    if (role !== 'founder' && role !== 'team_member') return route.fulfill(err(403, 'FORBIDDEN', "You don't have permission to do that."))

    if (path === '/' && method === 'GET') {
      return route.fulfill(
        json({
          total_pipeline_minor: deals.reduce((s, d) => s + (d.stage_id === ST.new ? d.value_minor : 0), 0),
          weighted_forecast_minor: 25000000,
          win_rate: null,
          currency: 'NGN',
          stages: stages.map((s) => ({
            stage_id: s.id,
            name: s.name,
            kind: s.kind,
            deal_count: deals.filter((d) => d.stage_id === s.id).length,
            value_minor: 0,
          })),
        })
      )
    }
    if (path === '/stages' && method === 'GET') return route.fulfill(json(stages))
    if (path === '/stages' && method === 'PUT') {
      calls.stagesSaved.push(body)
      return route.fulfill(json(stages))
    }
    if (path === '/deals' && method === 'GET') return route.fulfill(json({ items: deals, total: deals.length, limit: 200, offset: 0 }))
    if (path === '/deals' && method === 'POST') {
      calls.dealsCreated.push(body)
      return route.fulfill(json(deal({ id: 'd3000000-0000-4000-8000-000000000003', ...body })))
    }
    const stageMove = path.match(/^\/deals\/([^/]+)\/stage$/)
    if (stageMove && method === 'POST') {
      calls.moves.push({ id: stageMove[1], ...body })
      if (o.moveError) return route.fulfill(err(422, 'VALIDATION_ERROR', 'Stage not found.', 'stage_id'))
      const target = stages.find((s) => s.id === body.stage_id)
      return route.fulfill(
        json({
          ...deal({ id: stageMove[1], stage_id: body.stage_id, closed_reason: body.closed_reason ?? null, closed_note: body.closed_note ?? null }),
          stage_history: [{ id: 'h1', from_stage_id: null, from_stage_name: null, to_stage_id: body.stage_id, to_stage_name: target?.name, changed_by: null, changed_at: '2026-10-21T12:00:00Z' }],
        })
      )
    }
    const dealGet = path.match(/^\/deals\/([^/]+)$/)
    if (dealGet && method === 'GET') {
      const d = deals.find((x) => x.id === dealGet[1])
      if (!d) return route.fulfill(err(404, 'NOT_FOUND', 'Not found.'))
      return route.fulfill(
        json({
          ...d,
          stage_history: [{ id: 'h0', from_stage_id: null, from_stage_name: null, to_stage_id: d.stage_id, to_stage_name: 'New', changed_by: null, changed_at: d.created_at }],
        })
      )
    }
    if (path === '/activities' && method === 'GET') return route.fulfill(json({ items: [activity], total: 1, limit: 100, offset: 0 }))
    if (path === '/activities' && method === 'POST') {
      calls.activities.push(body)
      return route.fulfill(json({ ...activity, ...body }))
    }
    if (path === '/leads' && method === 'GET') return route.fulfill(json({ items: [lead()], total: 1, limit: 25, offset: 0 }))
    if (path === '/leads' && method === 'POST') {
      calls.leadsCreated.push(body)
      return route.fulfill(json(lead({ ...body, id: 'l3000000-0000-4000-8000-000000000003' })))
    }
    if (path === '/leads/import/preview') {
      return route.fulfill(
        json({
          upload_id: '27b641a23ced46e2aafbbbecf69d2c58',
          headers: ['Full Name', 'Company', 'E-mail', 'Source'],
          sample_rows: [['Kemi Bello', 'Bello Print', 'kemi@bello.example', 'event'], ['', '', 'orphan@nowhere.example', 'manual']],
          suggested_mapping: { name: 'Full Name', company: 'Company', email: 'E-mail', source: 'Source' },
          row_count: 5,
        })
      )
    }
    if (path === '/leads/import' && method === 'POST') {
      calls.imports.push(body)
      return route.fulfill(
        json({ added: 2, duplicates_skipped: 1, invalid_rows: [{ row: 4, error: 'Email is not valid.' }, { row: 5, error: 'A name or company is required.' }], invalid_total: 2 })
      )
    }
    if (path === `/leads/${LEAD}/convert`) {
      return route.fulfill(json({ deal: deal({ id: D1, name: 'Zenith Foods' }), account, contact }))
    }
    if (path === '/accounts' && method === 'GET') return route.fulfill(json({ items: [account], total: 1, limit: 25, offset: 0 }))
    if (path === `/accounts/${ACC}`) {
      return route.fulfill(json({ account, contacts: [contact], open_deals: [deal({ is_stalled: true, days_inactive: 20 })], lifetime_won_minor: 300000000 }))
    }
    if (path === '/contacts' && method === 'GET') return route.fulfill(json({ items: [contact], total: 1, limit: 200, offset: 0 }))
    if (path === `/contacts/${CON}`) return route.fulfill(json(contact))
    return route.fulfill(json({}))
  }
  // `**/sales/**` does not match the bare overview URL, so register both.
  await page.route('**/api/v1/sales', handler)
  await page.route('**/api/v1/sales/**', handler)
  return calls
}

async function dragCard(page: Page, dealName: string, stageName: string) {
  const card = page.getByRole('button', { name: `Open deal ${dealName}` }).locator('xpath=ancestor::div[@draggable="true"]')
  const target = page.getByRole('region', { name: `${stageName} stage` })
  const cb = (await card.boundingBox())!
  const tb = (await target.boundingBox())!
  await page.mouse.move(cb.x + cb.width / 2, cb.y + 20)
  await page.mouse.down()
  await page.mouse.move(cb.x + cb.width / 2 + 20, cb.y + 40, { steps: 4 })
  await page.mouse.move(tb.x + tb.width / 2, tb.y + 80, { steps: 12 })
  await page.mouse.up()
}

test.describe('Sales: pipeline at 1440', () => {
  test('header, columns from the API, stall badge and overdue next step', async ({ page }) => {
    await setup(page, { deals: [deal({ is_stalled: true, days_inactive: 20, next_step_due: '2020-01-01' })] })
    await page.goto('/sales')
    await expect(page.getByRole('heading', { name: 'Pipeline', level: 1 })).toBeVisible()
    await expect(page.getByText('₦2,500,000.00').first()).toBeVisible()
    await expect(page.getByText('No closed deals yet')).toBeVisible()
    for (const s of ['New', 'Contacted', 'Closed Won', 'Closed Lost']) {
      await expect(page.getByRole('region', { name: `${s} stage` })).toBeAttached()
    }
    await expect(page.getByText(/Stalled/)).toBeVisible()
    await expect(page.getByText(/Send proposal · /)).toBeVisible()
  })

  test('dragging to Closed Lost asks why and posts the reason', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales')
    await dragCard(page, 'Acme fleet rollout', 'Closed Lost')
    const modal = page.getByRole('dialog', { name: 'Why was this deal lost?' })
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Mark as lost' })).toBeDisabled()
    await modal.getByRole('radio', { name: 'Price' }).click()
    await modal.getByLabel('Note (optional)').fill('Budget frozen')
    await modal.getByRole('button', { name: 'Mark as lost' }).click()
    await expect.poll(() => calls.moves.length).toBe(1)
    expect(calls.moves[0]).toMatchObject({ id: D2, stage_id: ST.lost, closed_reason: 'price', closed_note: 'Budget frozen' })
  })

  test('dragging to Closed Won posts the move and celebrates', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales')
    await dragCard(page, 'Acme fleet rollout', 'Closed Won')
    await expect.poll(() => calls.moves.length).toBe(1)
    expect(calls.moves[0]).toMatchObject({ id: D2, stage_id: ST.won })
    await expect(page.getByText('Closed won: Acme fleet rollout, ₦2,500,000.00')).toBeAttached()
  })

  test('a refused move rolls the card back and shows the API message', async ({ page }) => {
    await setup(page, { moveError: true })
    await page.goto('/sales')
    await dragCard(page, 'Acme fleet rollout', 'Contacted')
    await expect(page.getByText('Stage not found.')).toBeVisible()
    await expect(page.getByRole('region', { name: 'New stage' }).getByRole('button', { name: 'Open deal Acme fleet rollout' })).toBeVisible()
  })

  test('?deal= opens the drawer with the timeline; closing drops the param', async ({ page }) => {
    await setup(page)
    await page.goto(`/sales?deal=${D2}`)
    const d = page.getByRole('dialog', { name: 'Acme fleet rollout' })
    await expect(d).toBeVisible()
    await expect(d.getByText('Account prefers WhatsApp')).toBeVisible()
    await d.getByRole('button', { name: 'Close' }).click()
    await expect(page).toHaveURL(/\/sales$/)
  })

  test('+ Add deal posts kobo, and Edit stages is reachable', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales')
    await page.getByRole('button', { name: '+ Add deal' }).click()
    const d = page.getByRole('dialog', { name: 'Add deal' })
    await d.getByLabel('Deal name').fill('Walk test deal')
    await d.getByLabel('Value (₦)').fill('1,500.50')
    await d.getByRole('button', { name: 'Add deal' }).click()
    await expect.poll(() => calls.dealsCreated.length).toBe(1)
    expect(calls.dealsCreated[0]).toMatchObject({ name: 'Walk test deal', value_minor: 150050, stage_id: ST.new })

    await page.getByRole('button', { name: 'Edit stages' }).click()
    const e = page.getByRole('dialog', { name: 'Edit stages' })
    await expect(e.getByRole('button', { name: 'Delete Closed Won' })).toBeDisabled()
    await expect(e.getByRole('button', { name: 'Delete New' })).toBeDisabled() // has a deal
    await expect(e.getByRole('button', { name: 'Delete Contacted' })).toBeEnabled()
    await e.getByRole('button', { name: 'Save stages' }).click()
    await expect.poll(() => calls.stagesSaved.length).toBe(1)
  })
})

test.describe('Sales: leads and accounts', () => {
  test('leads: columns, quick-add sends the email, Make it a deal links to the deal', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/leads')
    for (const c of ['Name', 'Company', 'Source', 'Status', 'Owner', 'Created']) {
      await expect(page.getByRole('columnheader', { name: c })).toBeVisible()
    }
    const form = page.getByRole('form', { name: 'Add a lead' })
    await form.getByLabel('Lead name').fill('Walk test lead')
    await form.getByLabel('Email').fill('walk@example.com')
    await form.getByRole('button', { name: '+ Add lead' }).click()
    await expect.poll(() => calls.leadsCreated.length).toBe(1)
    expect(calls.leadsCreated[0]).toMatchObject({ name: 'Walk test lead', email: 'walk@example.com', source: 'manual' })

    await page.getByRole('row', { name: /Chidi Eze/ }).getByRole('button', { name: 'Make Chidi Eze a deal' }).click()
    await expect(page.getByRole('link', { name: 'Open the deal' })).toHaveAttribute('href', `/sales?deal=${D1}`)
  })

  test('leads: CSV upload, mapping, commit, toast and invalid rows', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/leads')
    await page.getByRole('button', { name: 'Import CSV' }).click()
    const d = page.getByRole('dialog', { name: 'Import leads from CSV' })
    await d.getByLabel('CSV file').setInputFiles({ name: 'leads.csv', mimeType: 'text/csv', buffer: Buffer.from('Full Name,Company,E-mail,Source\nKemi,Bello,kemi@bello.example,event\n') })
    await expect(d.getByLabel('Name')).toHaveValue('Full Name')
    await d.getByLabel('Company').selectOption('')
    await d.getByRole('button', { name: /^Import 5 rows/ }).click()
    await expect(page.getByText('2 added, 1 duplicate skipped, 2 invalid').first()).toBeVisible()
    await expect(d.getByText('Row 4: Email is not valid.')).toBeVisible()
    expect(calls.imports[0]).toEqual({ upload_id: '27b641a23ced46e2aafbbbecf69d2c58', mapping: { name: 'Full Name', email: 'E-mail' } })
  })

  test('accounts: list opens the account page with contacts, open deals and activity; contact drawer logs activity', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales/accounts')
    await page.getByRole('link', { name: /Acme Logistics/ }).click()
    await expect(page).toHaveURL(new RegExp(`/sales/accounts/${ACC}$`))
    await expect(page.getByRole('heading', { name: 'Acme Logistics', level: 1 })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Open deals' }).getByText(/Stalled/)).toBeVisible()
    await expect(page.getByText('₦3,000,000.00')).toBeVisible()
    await page.getByRole('button', { name: /Tunde Okafor/ }).click()
    const d = page.getByRole('dialog', { name: 'Tunde Okafor' })
    await d.getByLabel('Activity type').selectOption('call')
    await d.getByLabel('What happened').fill('Intro call')
    await d.getByRole('button', { name: 'Log activity' }).click()
    await expect.poll(() => calls.activities.length).toBe(1)
    expect(calls.activities[0]).toMatchObject({ kind: 'call', body: 'Intro call', contact_id: CON, account_id: ACC })
  })

  test('search deep link /sales/contacts?contact= lands on the account with the drawer open', async ({ page }) => {
    await setup(page)
    await page.goto(`/sales/contacts?contact=${CON}`)
    await expect(page).toHaveURL(new RegExp(`/sales/accounts/${ACC}`))
    await expect(page.getByRole('dialog', { name: 'Tunde Okafor' })).toBeVisible()
  })
})

test.describe('Sales: accessibility', () => {
  for (const route of ['/sales', '/sales/leads', '/sales/accounts', `/sales/accounts/${ACC}`, `/sales?deal=${D2}`]) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await setup(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await expect(page.locator('h1, [role="dialog"]').first()).toBeVisible()
      await page.waitForTimeout(400)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations).toEqual([])
    })
  }
})

test.describe('Sales: 375', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const route of ['/sales', '/sales/leads', '/sales/accounts', `/sales/accounts/${ACC}`]) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await setup(page)
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(overflow).toBe(false)
    })
  }

  test('a card can be moved with its stage select (no drag needed on touch)', async ({ page }) => {
    const calls = await setup(page)
    await page.goto('/sales')
    await page.getByLabel('Move Acme fleet rollout to stage').selectOption({ label: 'Contacted' })
    await expect.poll(() => calls.moves.length).toBe(1)
    expect(calls.moves[0]).toMatchObject({ stage_id: ST.contacted })
  })
})

test.describe('Sales: roles', () => {
  test('a team member keeps full access (D-SAL-2)', async ({ page }) => {
    await setup(page, { role: 'team_member' })
    await page.goto('/sales')
    await expect(page.getByRole('button', { name: '+ Add deal' })).toBeVisible()
  })

  for (const role of ['mentor', 'business_consultant']) {
    test(`a ${role} gets a clean denial and no Sales in the sidebar`, async ({ page }) => {
      await setup(page, { role })
      await page.goto('/sales/leads')
      await expect(page.getByText("You don't have access to this page.")).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sales Hub' })).toHaveCount(0)
    })
  }
})
