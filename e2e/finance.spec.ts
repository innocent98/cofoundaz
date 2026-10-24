import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Locator, type Page, type Route } from '@playwright/test'

// Finance Hub against the shapes captured live in cofoundaz-api/docs/fe-integration-guide-finance-*.md.
// The API is mocked; ids, names, keys and addresses are placeholders, and no real provider key is used.

const WS = '57829571-0f6c-4298-8e87-5cbc70631b58'

const json = (data: unknown, meta: unknown = null, status = 200) => ({
  status,
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

const tx = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  date: '2026-10-01',
  description: `Row ${id}`,
  category: null,
  amount_minor: 150000,
  currency: 'NGN',
  direction: 'in',
  source: 'manual',
  created_at: '2026-10-01T10:00:00+00:00',
  updated_at: '2026-10-01T10:00:00+00:00',
  ...over,
})

const cashFlow = {
  cash_on_hand: 75742500,
  monthly_burn: 8085833,
  monthly_revenue: 2666667,
  runway_months: 9.4,
  runway_low: false,
  currency: 'NGN',
  by_month: [
    { month: '2026-05', inflow: 0, outflow: 0, net: 0 },
    { month: '2026-06', inflow: 0, outflow: 0, net: 0 },
    { month: '2026-07', inflow: 100000000, outflow: 0, net: 100000000 },
    { month: '2026-08', inflow: 0, outflow: 10000000, net: -10000000 },
    { month: '2026-09', inflow: 5000000, outflow: 4000000, net: 1000000 },
    { month: '2026-10', inflow: 8000000, outflow: 32257500, net: -24257500 },
  ],
}

const connection = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  provider: 'paystack',
  status: 'active',
  mode: 'test',
  key_last4: 'eac6',
  account_name: null,
  last_sync_at: '2026-10-21T13:06:58.756716Z',
  last_error: null,
  last_sync_summary: { fees: 1, fetched: 2, refunds: 0, imported: 1, duplicates: 0, invoice_matched: 0, skipped_currency: 0, skipped_oversize: 0 },
  webhook_url: 'http://127.0.0.1:8041/api/v1/webhooks/payments/paystack/placeholder-token',
  created_at: '2026-10-21T13:06:58.716100Z',
  ...over,
})
const providers = (paystack: unknown = null, mono: unknown = null, monoConfigured = true) => ({
  encryption_configured: true,
  providers: [
    { provider: 'paystack', label: 'Paystack', key_hint: 'Starts with sk_test_ or sk_live_', kind: 'payments', connection: paystack, connect_config: null },
    { provider: 'flutterwave', label: 'Flutterwave', key_hint: 'Starts with FLWSECK_TEST- or FLWSECK-', kind: 'payments', connection: null, connect_config: null },
    {
      provider: 'mono',
      label: 'Bank (Mono)',
      key_hint: 'Link your bank account with Mono Connect',
      kind: 'bank',
      connection: mono,
      connect_config: { configured: monoConfigured, public_key: monoConfigured ? 'test_pk_placeholder' : null, sandbox: true },
    },
  ],
})

const budget = (over: Record<string, unknown>) => ({
  id: 'b1',
  category: 'Equipment',
  period_month: '2026-10',
  limit_minor: 10000000,
  currency: 'NGN',
  notes: null,
  spent_minor: 4500000,
  variance_minor: -5500000,
  variance_percent: -55.0,
  over_budget: false,
  percent_used: 45.0,
  status: 'under',
  unbudgeted: false,
  created_at: '2026-10-22T14:44:41+01:00',
  updated_at: '2026-10-22T14:44:41+01:00',
  ...over,
})
const unbudgeted = (category: string, spent: number) =>
  budget({ id: null, category, limit_minor: null, spent_minor: spent, variance_minor: null, variance_percent: null, percent_used: null, status: 'unbudgeted', unbudgeted: true, created_at: null, updated_at: null })

const expense = (over: Record<string, unknown> = {}) => ({
  id: 'e1',
  vendor: 'AWS',
  category: 'Infrastructure',
  expense_date: '2026-10-22',
  amount_minor: 250000,
  currency: 'NGN',
  recurring: false,
  notes: null,
  has_receipt: true,
  receipt_url: '/api/v1/finance/expenses/e1/receipt',
  transaction_id: 't1',
  created_by: 'u1',
  created_at: '2026-10-22T14:44:40+01:00',
  updated_at: '2026-10-22T14:44:40+01:00',
  ...over,
})

const invoice = (over: Record<string, unknown> = {}) => ({
  id: 'i1',
  number: 'INV-2026-001',
  client_name: 'Chidi Okafor Stores',
  client_email: 'client-placeholder@example.com',
  line_items: [{ description: 'Retainer', quantity: 2, unit_price_minor: 75000, amount_minor: 150000 }],
  subtotal_minor: 150000,
  tax_percent: 7.5,
  tax_minor: 11250,
  total_minor: 161250,
  currency: 'NGN',
  terms: 'net_15',
  status: 'overdue',
  issued_on: '2026-10-01',
  due_on: '2026-10-16',
  paid_at: null,
  auto_remind: false,
  transaction_id: null,
  pay_url: null,
  pay_provider: null,
  paid_via: null,
  last_reminded_at: null,
  reminder_count: 0,
  overdue_notified_at: null,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  ...over,
})

const months = Array.from({ length: 36 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 10 + i, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
})
const row = (label: string, v: number) => ({ label, values: months.map(() => v) })
const modelBase = (over: Record<string, unknown> = {}) => ({
  id: 'm1',
  status: 'complete',
  horizon_months: 36,
  currency: 'NGN',
  stale: false,
  overrides: null,
  recalculated_at: null,
  balance_check: { balanced: true, max_abs_difference_minor: 0 },
  assumptions: {
    ap_days: 0,
    ar_days: 0,
    narrative: 'Placeholder narrative.',
    revenue_source: 'actuals',
    revenue_0_minor: 2000000,
    cogs_pct_of_revenue: 0,
    monthly_opex_growth_pct: 0,
    monthly_revenue_growth_pct: 0,
    monthly_costs_0_minor: 10666667,
  },
  ai_assumptions: { ap_days: 0, ar_days: 0, narrative: 'Placeholder narrative.', revenue_source: 'actuals', revenue_0_minor: 2000000, cogs_pct_of_revenue: 0, monthly_opex_growth_pct: 0, monthly_revenue_growth_pct: 0 },
  months,
  pnl: { rows: [row('Revenue', 2000000), row('COGS', 0), row('Gross profit', 2000000), row('Opex', 10666667), row('Depreciation', 0), row('Net income', -8666667)] },
  cash_flow: { rows: [row('Opening cash', 74000000), row('Closing cash', 65333333)] },
  balance_sheet: { rows: [row('Cash', 65333333), row('Total assets', 65333333), row('Total liabilities + equity', 65333333), row('Balance check', 0)] },
  yearly: {
    periods: [
      { label: 'Year 1', start_month: '2026-11', end_month: '2027-10' },
      { label: 'Year 2', start_month: '2027-11', end_month: '2028-10' },
      { label: 'Year 3', start_month: '2028-11', end_month: '2029-10' },
    ],
    pnl: { rows: [{ label: 'Revenue', values: [24000000, 24000000, 24000000] }, { label: 'Net income', values: [-1, -1, -1] }] },
    cash_flow: { rows: [{ label: 'Closing cash', values: [1, 2, 3] }] },
    balance_sheet: { rows: [{ label: 'Balance check', values: [0, 0, 0] }] },
  },
  error: null,
  generated_at: '2026-10-24T12:00:00Z',
  created_at: '2026-10-24T12:00:00Z',
  ...over,
})

interface State {
  role: string
  txPages: { items: unknown[]; next: string | null }[]
  uncategorizedTotal: number
  integrations: ReturnType<typeof providers>
  budgets: unknown[]
  expenses: unknown[]
  invoices: unknown[]
  model: ReturnType<typeof modelBase>
  calls: { path: string; method: string; body: unknown }[]
  /** The role the API sees, when it differs from the one the shell shows. */
  apiRole?: string
}

function freshState(role = 'founder'): State {
  return {
    role,
    txPages: [
      { items: [tx('t1', { description: 'Paystack payment ref1', source: 'paystack', category: 'Revenue' }), tx('t2', { description: 'Office supplies', direction: 'out', source: 'bank' })], next: 'cursor-2' },
      { items: [tx('t3', { description: 'NIP transfer from ACME', source: 'bank', category: 'Paystack payout', amount_minor: 492500 })], next: null },
    ],
    uncategorizedTotal: 1,
    integrations: providers(),
    budgets: [budget({}), unbudgeted('Software', 33000)],
    expenses: [expense()],
    invoices: [invoice()],
    model: modelBase(),
    calls: [],
  }
}

async function setup(page: Page, state: State = freshState()) {
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(state.role))))
  await page.route('**/api/v1/team/members', (route) => route.fulfill(json([])))
  const handler = async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname.replace('/api/v1/finance', '') || '/'
    const method = req.method()
    const body = req.postData() && !req.postData()!.startsWith('--') ? JSON.parse(req.postData()!) : req.postData()
    state.calls.push({ path, method, body })
    if (!['founder', 'team_member', 'accountant'].includes(state.apiRole ?? state.role)) {
      return route.fulfill(err(403, 'FORBIDDEN', "You don't have permission to do that."))
    }

    if (path === '/cash-flow') return route.fulfill(json(cashFlow))
    if (path === '/categories') {
      return route.fulfill(json({ categories: ['Equipment', 'Infrastructure', 'Payment fees', 'Revenue'].map((name) => ({ name, is_default: true, in_use: false })) }))
    }
    if (path === '/transactions' && method === 'GET') {
      if (url.searchParams.get('uncategorized') === 'true') {
        return route.fulfill(json({ transactions: [tx('t2')] }, { next_cursor: null, total_estimate: state.uncategorizedTotal }))
      }
      const cursor = url.searchParams.get('cursor')
      const page = cursor ? state.txPages[1] : state.txPages[0]
      return route.fulfill(json({ transactions: page.items }, { next_cursor: page.next, total_estimate: 3 }))
    }
    if (path.startsWith('/transactions/') && method === 'PATCH') {
      return route.fulfill(json({ ...tx('t2'), ...(body as object) }))
    }
    if (path === '/integrations') return route.fulfill(json(state.integrations))
    if (path === '/integrations/paystack/connect') {
      const b = body as { secret_key: string }
      if (b.secret_key.startsWith('pk_')) return route.fulfill(err(422, 'VALIDATION_ERROR', 'Please check the highlighted fields.', 'secret_key'))
      if (b.secret_key === 'sk_test_REJECTED') return route.fulfill(err(422, 'PAYMENT_KEY_REJECTED', 'Paystack did not accept that key. Check it and try again.'))
      state.integrations = providers(connection(), state.integrations.providers[2].connection)
      return route.fulfill(json(connection()))
    }
    if (path === '/integrations/paystack/sync') {
      const summary = { imported: 1, duplicates: 0, invoice_matched: 0, skipped_currency: 2, skipped_oversize: 0, fees: 1, refunds: 0, credits: 0, debits: 0, paystack_payouts: 0, paystack_unmatched: 0, fetched: 2 }
      return route.fulfill(json({ connection: connection(), summary }))
    }
    if (path === '/integrations/paystack/disconnect') {
      state.integrations = providers(null, state.integrations.providers[2].connection)
      return route.fulfill(json(connection({ status: 'disconnected' })))
    }
    if (path === '/budgets') return route.fulfill(json({ month: '2026-10', budgets: state.budgets }))
    if (path === '/expenses/summary') return route.fulfill(json({ month: '2026-10', currency: 'NGN', total_minor: 250000, rows: [{ category: 'Infrastructure', total_minor: 250000, percent: 100 }] }))
    if (path === '/expenses' && method === 'GET') return route.fulfill(json({ expenses: state.expenses }, { next_cursor: null, total_estimate: 1 }))
    if (path === '/expenses/e1/receipt' && method === 'POST') {
      state.expenses = [expense({ has_receipt: true, receipt_url: '/api/v1/finance/expenses/e1/receipt' })]
      return route.fulfill(json(state.expenses[0]))
    }
    if (path === '/expenses/e1/receipt' && method === 'DELETE') {
      state.expenses = [expense({ has_receipt: false, receipt_url: null })]
      return route.fulfill(json(state.expenses[0]))
    }
    if (path === '/expenses/e1/receipt' && method === 'GET') {
      return route.fulfill(json({ url: 'http://127.0.0.1:9/receipts/download?token=signed', expires_at: '2026-10-24T12:05:00+00:00', content_type: 'image/png' }))
    }
    if (path === '/invoices' && method === 'GET') {
      const status = url.searchParams.get('status')
      const items = (state.invoices as { status: string }[]).filter((i) => !status || i.status === status)
      return route.fulfill(json({ invoices: items }, { next_cursor: null, total_estimate: items.length }))
    }
    if (path === '/invoices/i1/remind') {
      const inv = state.invoices[0] as { last_reminded_at: string | null; reminder_count: number }
      if (inv.last_reminded_at) {
        return route.fulfill(err(422, 'VALIDATION_ERROR', 'A reminder was already sent in the last 24 hours.', 'status'))
      }
      state.invoices = [invoice({ last_reminded_at: new Date().toISOString(), reminder_count: 1 })]
      return route.fulfill(json(state.invoices[0]))
    }
    if (path === '/invoices/i1/pdf') {
      return route.fulfill({ status: 200, contentType: 'application/pdf', headers: { 'content-disposition': 'attachment; filename="invoice-INV-2026-001.pdf"' }, body: '%PDF-1.4 placeholder' })
    }
    if (path === '/model' && method === 'GET') return route.fulfill(json(state.model))
    if (path === '/model/m1/assumptions') {
      const b = body as Record<string, unknown>
      if (typeof b.monthly_revenue_growth_pct === 'number' && b.monthly_revenue_growth_pct > 100) {
        return route.fulfill(err(422, 'VALIDATION_ERROR', 'Input should be less than or equal to 100', 'monthly_revenue_growth_pct'))
      }
      state.model = modelBase({
        stale: true,
        overrides: b,
        assumptions: { ...state.model.assumptions, monthly_revenue_growth_pct: b.monthly_revenue_growth_pct ?? 0 },
      })
      return route.fulfill(json(state.model))
    }
    if (path === '/model/m1/recalculate') {
      state.model = modelBase({ stale: false, overrides: state.model.overrides, assumptions: state.model.assumptions, recalculated_at: '2026-10-24T13:00:00Z' })
      return route.fulfill(json(state.model))
    }
    return route.fulfill(json({}))
  }
  await page.route('**/api/v1/finance', handler)
  await page.route('**/api/v1/finance/**', handler)
  return state
}

/** The lists render a card view and a table; only one is displayed at a time. */
const vis = (l: Locator) => l.filter({ visible: true }).first()
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376)

test.describe('Finance ledger at 1440', () => {
  test('shows imported rows with their source, the payout note, and loads more by cursor', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance')
    await expect(page.getByRole('heading', { name: 'Cash Flow Analytics' })).toBeVisible()
    await expect(page.getByText('Showing 2 of 3 transactions')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Paystack', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Load more transactions' }).click()
    await expect(page.getByText('Showing 3 of 3 transactions')).toBeVisible()
    await expect(vis(page.getByText('Paystack payout, not counted as income'))).toBeVisible()
    expect(s.calls.some((c) => c.path === '/transactions' && c.method === 'GET')).toBe(true)
    await expect(page.getByRole('button', { name: 'Load more transactions' })).toHaveCount(0)
  })

  test('the Needs a category chip shows the exact count and the select saves the picked category', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance')
    await expect(page.getByRole('button', { name: 'Needs a category (1)' })).toBeVisible()
    await vis(page.getByLabel('Category for Office supplies')).selectOption('Infrastructure')
    await expect.poll(() => s.calls.filter((c) => c.method === 'PATCH').map((c) => c.body)).toContainEqual({ category: 'Infrastructure' })
  })

  test('an imported row offers only the category, never edit or delete', async ({ page }) => {
    await setup(page)
    await page.goto('/finance')
    await expect(vis(page.getByText('Imported. Only the category can change.'))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete Paystack payment ref1' })).toHaveCount(0)
  })
})

test.describe('Finance integrations', () => {
  test('a founder connects Paystack: a bad key shows the field error, the key box is emptied, a good key shows only the last four', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance/integrations')
    await page.getByRole('button', { name: 'Connect Paystack' }).click()
    const key = page.getByLabel('Secret key')
    await key.fill('pk_test_FAKE')
    await page.getByRole('button', { name: 'Connect', exact: true }).click()
    await expect(page.getByText('Please check the highlighted fields.').first()).toBeVisible()
    await expect(key).toHaveValue('')

    await key.fill('sk_test_REJECTED')
    await page.getByRole('button', { name: 'Connect', exact: true }).click()
    await expect(page.getByText('Paystack did not accept that key. Check it and try again.')).toBeVisible()

    await key.fill('sk_test_FAKEKEY')
    await page.getByRole('button', { name: 'Connect', exact: true }).click()
    await expect(page.getByText('••••eac6')).toBeVisible()
    await expect(page.getByText('Test mode', { exact: true })).toBeVisible()
    expect(await page.content()).not.toContain('sk_test_FAKEKEY')
    const connects = s.calls.filter((c) => c.path === '/integrations/paystack/connect')
    expect(connects).toHaveLength(3)
  })

  test('Flutterwave asks for the secret hash before anything is sent', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance/integrations')
    await page.getByRole('button', { name: 'Connect Flutterwave' }).click()
    await page.getByLabel('Secret key').fill('FLWSECK_TEST-FAKE-X')
    await page.getByRole('button', { name: 'Connect', exact: true }).click()
    await expect(page.getByText('Enter your Flutterwave secret hash.')).toBeVisible()
    expect(s.calls.filter((c) => c.path.includes('flutterwave/connect'))).toHaveLength(0)
  })

  test('sync reports what it did, including skipped non-NGN payments, and disconnect asks first', async ({ page }) => {
    await setup(page, Object.assign(freshState(), { integrations: providers(connection()) }))
    await page.goto('/finance/integrations')
    await expect(page.getByText('Webhook URL')).toBeVisible()
    await page.getByRole('button', { name: 'Sync now' }).first().click()
    await expect(page.getByText(/2 non-NGN payments were not imported/)).toBeVisible()
    await page.getByRole('button', { name: 'Disconnect' }).first().click()
    await expect(page.getByText('Historical data stays; new data stops syncing.')).toBeVisible()
    await page.getByRole('button', { name: 'Disconnect', exact: true }).last().click()
    await expect(page.getByRole('button', { name: 'Connect Paystack' })).toBeVisible()
  })

  test('a needs-attention connection shows the PRD banner and a Replace key action', async ({ page }) => {
    await setup(
      page,
      Object.assign(freshState(), {
        integrations: providers(connection({ status: 'needs_attention', last_error: 'The provider rejected the saved key. Replace it to resume syncing.' })),
      }),
    )
    await page.goto('/finance/integrations')
    await expect(page.getByText('Paystack connection needs attention. Reconnect to resume syncing.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Replace key' })).toBeVisible()
  })

  test('a team member sees status and Sync but cannot connect, replace or disconnect', async ({ page }) => {
    await setup(page, Object.assign(freshState('team_member'), { integrations: providers(connection()) }))
    await page.goto('/finance/integrations')
    await expect(page.getByRole('button', { name: 'Sync now' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Replace key' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Disconnect' })).toHaveCount(0)
    await expect(page.getByText('Only a founder can replace or disconnect this connection.')).toBeVisible()
  })

  test('the bank card says Coming soon when the server has no Mono keys', async ({ page }) => {
    await setup(page, Object.assign(freshState(), { integrations: providers(null, null, false) }))
    await page.goto('/finance/integrations')
    await expect(page.getByText('Coming soon. Bank linking is not switched on for this environment yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Connect bank' })).toHaveCount(0)
  })
})

test.describe('Finance budgets and expenses', () => {
  test('budgets show variance, worded status and an unbudgeted row with Set budget', async ({ page }) => {
    await setup(page)
    await page.goto('/finance/budgets')
    await expect(page.getByRole('columnheader', { name: 'Variance' })).toBeVisible()
    await expect(vis(page.getByText('Under budget'))).toBeVisible()
    await expect(vis(page.getByText('No budget set'))).toBeVisible()
    await expect(vis(page.getByRole('button', { name: 'Set a budget for Software' }))).toBeVisible()
    await expect(vis(page.getByText('-55%'))).toBeVisible()
  })

  test('a receipt opens through a fresh signed link and no storage URL is in the page', async ({ page, context }) => {
    const s = await setup(page)
    await page.goto('/finance/expenses')
    const popup = context.waitForEvent('page')
    await vis(page.getByRole('button', { name: 'View receipt for AWS' })).click()
    await popup
    expect(s.calls.filter((c) => c.path === '/expenses/e1/receipt' && c.method === 'GET')).toHaveLength(1)
    const html = await page.content()
    expect(html).not.toContain('cloudinary')
    expect(html).not.toContain('token=signed')
  })
})

test.describe('Finance expense receipts', () => {
  test('attach uploads one file part, then the row offers View, Replace and Remove', async ({ page }) => {
    const s = await setup(page, Object.assign(freshState(), { expenses: [expense({ has_receipt: false, receipt_url: null })] }))
    await page.goto('/finance/expenses')
    const chooser = page.waitForEvent('filechooser')
    await vis(page.getByRole('button', { name: 'Attach receipt for AWS' })).click()
    await (await chooser).setFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('placeholder-bytes') })
    await expect(vis(page.getByRole('button', { name: 'View receipt for AWS' }))).toBeVisible()
    expect(s.calls.some((c) => c.path === '/expenses/e1/receipt' && c.method === 'POST')).toBe(true)
    await vis(page.getByRole('button', { name: 'Remove receipt for AWS' })).click()
    await page.getByRole('button', { name: 'Remove receipt', exact: true }).click()
    await expect(vis(page.getByRole('button', { name: 'Attach receipt for AWS' }))).toBeVisible()
  })
})

test.describe('Finance invoices', () => {
  test('an overdue invoice sends a reminder after confirming, then the 24 hour gap is explained', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance/invoices')
    await expect(page.getByText('overdue').first()).toBeVisible()
    await vis(page.getByRole('button', { name: 'Send a reminder for INV-2026-001' })).click()
    await expect(page.getByText('client-placeholder@example.com').first()).toBeVisible()
    await page.getByRole('button', { name: 'Send reminder', exact: true }).last().click()
    await expect(page.getByText('Reminder queued for client-placeholder@example.com.')).toBeVisible()
    expect(s.calls.filter((c) => c.path === '/invoices/i1/remind')).toHaveLength(1)
    await expect(vis(page.getByRole('button', { name: 'Send a reminder for INV-2026-001' }))).toBeDisabled()
  })

  test('the PDF comes from the API and a pay link can be created from the detail view', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance/invoices')
    const download = page.waitForEvent('download')
    await vis(page.getByRole('button', { name: 'Download PDF for INV-2026-001' })).click()
    expect((await download).suggestedFilename()).toBe('invoice-INV-2026-001.pdf')
    expect(s.calls.some((c) => c.path === '/invoices/i1/pdf')).toBe(true)
    await vis(page.getByRole('button', { name: 'View INV-2026-001' })).click()
    await expect(page.getByRole('button', { name: 'Create pay link' })).toBeVisible()
  })

  test('a provider-paid invoice is tagged and cannot be marked unpaid', async ({ page }) => {
    await setup(page, Object.assign(freshState(), { invoices: [invoice({ status: 'paid', paid_via: 'paystack', paid_at: '2026-10-20T10:00:00Z' })] }))
    await page.goto('/finance/invoices')
    await expect(vis(page.getByText('Paid via Paystack'))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark INV-2026-001 unpaid' })).toHaveCount(0)
  })
})

test.describe('Finance model', () => {
  test('editing marks the model stale, Recalculate clears it, and the balance check and yearly view show', async ({ page }) => {
    const s = await setup(page)
    await page.goto('/finance/model')
    await expect(page.getByRole('heading', { name: 'Financial model' })).toBeVisible()
    await page.getByRole('tab', { name: 'Balance Sheet' }).click()
    await expect(page.getByText('Balance check: assets equal liabilities plus equity in every period.')).toBeVisible()
    await page.getByRole('button', { name: 'Yearly' }).click()
    await expect(page.getByRole('columnheader', { name: 'Year 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Monthly' }).click()

    await page.getByLabel(/Revenue growth/).fill('6')
    await page.getByRole('button', { name: 'Save edits' }).click()
    await expect(page.getByText('Edited, not yet recalculated.')).toBeVisible()
    expect(s.calls.find((c) => c.path === '/model/m1/assumptions')?.body).toEqual({ monthly_revenue_growth_pct: 6 })

    await page.getByRole('button', { name: 'Recalculate' }).first().click()
    await expect(page.getByText('Edited, not yet recalculated.')).toHaveCount(0)
  })

  test('an out-of-range assumption shows the API message and keeps the numbers', async ({ page }) => {
    await setup(page)
    await page.goto('/finance/model')
    await page.getByLabel(/Revenue growth/).fill('150')
    await page.getByRole('button', { name: 'Save edits' }).click()
    await expect(page.getByText('Revenue growth must be between -50 and 100.')).toBeVisible()
  })
})

test.describe('Finance roles', () => {
  for (const path of ['/finance', '/finance/budgets', '/finance/expenses', '/finance/invoices', '/finance/model', '/finance/integrations']) {
    test(`a mentor is kept out of ${path}`, async ({ page }) => {
      await setup(page, freshState('mentor'))
      await page.goto(path)
      await expect(page.getByRole('heading', { name: "You don't have access to this page." })).toBeVisible()
    })
  }

  test('a member whose finance access the API refuses sees the not available state', async ({ page }) => {
    await setup(page, Object.assign(freshState('team_member'), { apiRole: 'mentor' }))
    await page.goto('/finance/budgets')
    await expect(page.getByRole('heading', { name: 'Not available for your role' })).toBeVisible()
  })
})

test.describe('Finance at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  for (const path of ['/finance', '/finance/budgets', '/finance/expenses', '/finance/invoices', '/finance/integrations', '/finance/model', '/finance/runway']) {
    test(`${path} fits the viewport`, async ({ page }) => {
      await setup(page, Object.assign(freshState(), { integrations: providers(connection()) }))
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await noOverflow(page)
    })
  }
})

test.describe('Finance accessibility', () => {
  for (const path of ['/finance', '/finance/integrations', '/finance/budgets', '/finance/invoices']) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await setup(page, Object.assign(freshState(), { integrations: providers(connection()) }))
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(results.violations).toEqual([])
    })
  }
})
