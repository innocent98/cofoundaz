import { test, expect, type Page } from '@playwright/test'

// Documents BE-C FE: template generator, AI draft states, export. The API is mocked with the shapes captured live
// in cofoundaz-api/docs/fe-integration-guide-documents-templates-export.md (the error states that cannot be forced
// on the live stack: budget, partial and failed drafts, 429). IDs and emails are placeholders.

const WS = '48469527-1d83-4ddf-afd0-b4df963e92e1'
const DOC_ID = 'cec804f2-8862-4a3b-b7f0-8f3b576615aa'
const JOB_ID = '0aab2096-3db2-49b5-ace6-15450d26beaf'
const DISCLAIMER =
  'This document is a draft template provided for convenience and is not legal advice. Cofoundaz is not a law firm. Have a qualified lawyer review it before you sign or rely on it.'

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(status >= 400 ? data : { data, meta: null }),
})
const apiError = (code: string, message: string, field_errors: unknown[] = []) => ({ error: { code, message, field_errors } })

const owner = { id: '97ef66ef-8c63-4ebb-a8de-c10d50c71a2f', name: 'Ada Founder' }
const catalog = [
  { key: 'nda', name: 'Non-Disclosure Agreement', description: 'A one-way NDA.', kind: 'nda', category: 'Legal', sections: ['Parties', 'Purpose'], disclaimer: DISCLAIMER },
  { key: 'financial_model', name: 'Financial Model', description: 'A lightweight financial narrative.', kind: 'financial_model', category: 'Financial', sections: ['Assumptions'], disclaimer: null },
  { key: 'business_plan', name: 'Business Plan', description: 'A full business plan.', kind: 'business_plan', category: 'Pitch', sections: ['Executive Summary'], disclaimer: null },
  { key: 'meeting_notes', name: 'Meeting Notes', description: 'Structured meeting notes.', kind: 'meeting_notes', category: 'Operational', sections: ['Agenda'], disclaimer: null },
]
const field = (key: string, label: string, value: string, required: boolean, type = 'text') => ({
  key, label, type, required, value, state: value ? 'filled' : 'empty', source: value ? 'profile' : null, ai_draftable: false,
})
const ndaForm = {
  template_key: 'nda',
  fields: [field('disclosing_party', 'Disclosing party', 'NovaPay', true), field('receiving_party', 'Receiving party', '', true), field('governing_law', 'Governing law', '', true)],
  sections: [{ key: 'parties', heading: 'Parties', value: 'Clause text with [Receiving party]', state: 'filled', source: 'template', ai_draftable: false }],
  unfilled_required: ['receiving_party', 'governing_law'],
  disclaimer: DISCLAIMER,
  ai_available: false,
}
const planForm = {
  template_key: 'business_plan',
  fields: [],
  sections: [
    { key: 'executive_summary', heading: 'Executive Summary', value: '', state: 'empty', source: null, ai_draftable: true },
    { key: 'problem', heading: 'Problem', value: '- Card fraud', state: 'filled', source: 'business_builder', ai_draftable: true },
    { key: 'team', heading: 'Team', value: '', state: 'empty', source: null, ai_draftable: false },
  ],
  unfilled_required: [],
  disclaimer: null,
  ai_available: true,
}
const planDoc = {
  id: DOC_ID, type: 'document', kind: 'business_plan', mime: 'application/vnd.cofoundaz.document+json', title: 'NovaPay business plan',
  status: 'draft', ai_generated: false, folder: null, tags: [], template_key: 'business_plan', disclaimer: null, version: 1, owner,
  share_count: 0, updated_at: '2026-10-25T15:03:54.282168+00:00', trashed_at: null, purges_at: null,
  sections: [
    { id: 's1', heading: 'Executive Summary', body: '' },
    { id: 's2', heading: 'Problem', body: '- Card fraud' },
    { id: 's3', heading: 'Team', body: '' },
  ],
}
const exportFile = {
  id: '0f069faa-155d-40c1-ad14-561390cab32d', filename: 'NovaPay business plan.pdf', content_type: 'application/pdf', mime: 'application/pdf',
  type: 'file', origin: 'export', source_document_id: DOC_ID, source_version: 1, size_bytes: 4444, folder: null, tags: [], owner,
  share_count: 0, scan_status: 'clean', uploaded_at: '2026-10-25T15:03:54.614057+00:00', trashed_at: null, purges_at: null,
}

// Next's route announcer is also role=alert, so scope to the page's own alerts.
const alerts = (page: Page) => page.locator('[role=alert]:not(#__next-route-announcer__)')

async function setup(page: Page, extra?: (p: Page) => Promise<void>) {
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill(json({
      user: { id: 'u1', email: 'placeholder@example.com' },
      profile: { full_name: 'Placeholder Person', role_title: 'Founder', country: null, avatar_url: null },
      memberships: [{ startup_id: WS, name: 'NovaPay', role: 'founder' }],
      active_workspace_id: WS,
    })),
  )
  await page.route('**/api/v1/documents/folders', (route) => route.fulfill(json({ folders: [], uncategorized: 0, trash: 0, total: 0 })))
  await page.route('**/api/v1/document-templates', (route) => route.fulfill(json({ templates: catalog })))
  await page.route('**/api/v1/document-templates/nda', (route) => route.fulfill(json({ ...catalog[0], form: ndaForm })))
  await page.route('**/api/v1/document-templates/business_plan', (route) => route.fulfill(json({ ...catalog[2], form: planForm })))
  await extra?.(page)
}

test.describe('Documents: template generator', () => {
  test('the catalog is grouped Legal, Financial, Pitch, Operational and labels legal drafts', async ({ page }) => {
    await setup(page)
    await page.goto('/documents/templates')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Legal', 'Financial', 'Pitch', 'Operational'])
    await expect(page.getByText('Draft, not legal advice')).toBeVisible()
    await page.getByRole('link', { name: 'Use the Non-Disclosure Agreement template' }).click()
    await expect(page).toHaveURL(/\/documents\/templates\/nda$/)
  })

  test('legal form shows the API disclaimer, blocks Create until required fields are filled, and maps a 422 to its field', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/templates/nda/instantiate', (route) =>
        route.fulfill(json(apiError('VALIDATION_ERROR', "That isn't a field on this template.", [{ field: 'values.governing_law', message: 'Use a place, for example Lagos State.' }]), 422)),
      )
    })
    await page.goto('/documents/templates/nda')
    await expect(page.getByRole('note', { name: 'Not legal advice' })).toContainText(DISCLAIMER)
    await expect(page.getByText('From your profile')).toBeVisible()
    const create = page.getByRole('button', { name: 'Create document' })
    await expect(create).toBeDisabled()
    await expect(page.getByRole('status')).toContainText('receiving party, governing law')
    await page.getByLabel('Receiving party').fill('Bright Ventures Ltd')
    await page.getByLabel('Governing law').fill('x')
    await expect(create).toBeEnabled()
    await create.click()
    await expect(alerts(page).first()).toContainText('Use a place, for example Lagos State.')
  })

  test('AI choices: empty draftable sections are offered, others say only you know them; the request carries ai_sections', async ({ page }) => {
    let body: Record<string, unknown> = {}
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/templates/business_plan/instantiate', async (route) => {
        body = route.request().postDataJSON()
        await route.fulfill(json({ document: planDoc, form: planForm, ai: { status: 'over_budget', job_id: null, sections: [] } }, 201))
      })
      await p.route(`**/api/v1/documents/${DOC_ID}`, (route) => route.fulfill(json(planDoc)))
    })
    await page.goto('/documents/templates/business_plan')
    await expect(page.getByText('Only you know this one')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Let AI draft this section/ })).toBeChecked()
    await page.getByRole('button', { name: 'Create and draft with AI' }).click()
    expect(body).toEqual({ ai_draft: true })
    // over_budget on create: the document still exists and the page says why there is no AI text
    await expect(page).toHaveURL(new RegExp(`/documents/${DOC_ID}$`))
    await expect(page.getByText('AI drafting is not available right now.')).toBeVisible()
    await expect(page.getByText(/used up today’s AI allowance/)).toBeVisible()
  })
})

test.describe('Documents: AI draft result states', () => {
  const result = (status: string, extra: Record<string, unknown> = {}) => ({
    id: JOB_ID, type: 'ai.documents.template_draft', status: 'succeeded', error: null,
    result: { status, reason: null, drafted: [], skipped: [], failed: [], document_version: null, ...extra },
  })

  async function openWithJob(page: Page, job: unknown, retry?: (p: Page) => Promise<void>) {
    await setup(page, async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}`, (route) => route.fulfill(json(planDoc)))
      await p.route(`**/api/v1/jobs/${JOB_ID}`, (route) => route.fulfill(json(job)))
      await retry?.(p)
    })
    await page.addInitScript(
      ([id, jobId]) => sessionStorage.setItem(`cf_doc_ai_${id}`, JSON.stringify({ status: 'queued', job_id: jobId, sections: ['executive_summary'] })),
      [DOC_ID, JOB_ID],
    )
    await page.goto(`/documents/${DOC_ID}`)
    await expect(page.getByText('AI is drafting Executive summary.')).toBeVisible()
  }

  test('partial: says what failed and offers Try again; a 429 from the retry shows the API message', async ({ page }) => {
    await openWithJob(page, result('partial', { drafted: ['go_to_market'], failed: ['executive_summary'], document_version: 2 }), async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}/ai-draft`, (route) =>
        route.fulfill(json(apiError('AI_BUDGET_EXHAUSTED', "Today's AI allowance for this workspace is used up. Try again tomorrow."), 429)),
      )
    })
    await expect(page.getByText(/could not be drafted: Executive summary/)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(alerts(page)).toContainText("Today's AI allowance for this workspace is used up. Try again tomorrow.")
  })

  test('failed: plain message and Try again; over_budget: no retry button', async ({ page }) => {
    await openWithJob(page, result('failed', { reason: 'generation_failed' }))
    await expect(page.getByText('AI could not draft this document.')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('over_budget result tells the person to try tomorrow and offers no retry', async ({ page }) => {
    await openWithJob(page, result('over_budget', { reason: 'over_budget' }))
    await expect(page.getByText('AI drafting is not available right now.')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Try again tomorrow/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  })
})

test.describe('Documents: export', () => {
  async function openEditor(page: Page, exportRoute: (p: Page) => Promise<void>) {
    await setup(page, async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}`, (route) => route.fulfill(json(planDoc)))
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [] })))
      await exportRoute(p)
    })
    await page.goto(`/documents/${DOC_ID}`)
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByText(/Exports the saved version/)).toBeVisible()
  }

  test('new export (201) then the same file again (200 says Already exported); shows the scan state', async ({ page }) => {
    let calls = 0
    await openEditor(page, async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}/export`, (route) => {
        calls += 1
        return route.fulfill(json(exportFile, calls === 1 ? 201 : 200))
      })
    })
    await page.getByRole('button', { name: 'Export as PDF' }).click()
    await expect(page.getByRole('status')).toHaveText('Exported.')
    await expect(page.getByText('Scan clean')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled()
    await page.getByRole('button', { name: 'Export another format' }).click()
    await page.getByRole('button', { name: 'Export as PDF' }).click()
    await expect(page.getByRole('status')).toContainText('Already exported')
  })

  test('export errors use real copy (429, 404, 422)', async ({ page }) => {
    const codes = [429, 404, 422]
    let n = 0
    await openEditor(page, async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}/export`, (route) => {
        const c = codes[n++]
        if (c === 429) return route.fulfill(json({ error: { code: 'RATE_LIMITED', message: 'Too many requests', field_errors: [] } }, 429))
        if (c === 404) return route.fulfill(json(apiError('NOT_FOUND', 'Not found.'), 404))
        return route.fulfill(json(apiError('VALIDATION_ERROR', 'This document is too large to export.'), 422))
      })
    })
    const go = page.getByRole('button', { name: 'Export as PDF' })
    await go.click()
    await expect(alerts(page)).toContainText('exported a lot in a short time')
    await go.click()
    await expect(alerts(page)).toContainText('in the Trash or no longer exists')
    await go.click()
    await expect(alerts(page)).toContainText('This document is too large to export.')
  })

  test('bracketed gaps and unsaved edits are flagged before export', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route(`**/api/v1/documents/${DOC_ID}`, (route) =>
        route.fulfill(json({ ...planDoc, sections: [{ id: 's1', heading: 'Parties', body: 'between NovaPay and [Receiving party]' }] })),
      )
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [] })))
    })
    await page.goto(`/documents/${DOC_ID}`)
    await page.getByLabel('Document title').fill('Edited title')
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByText(/empty gaps in square brackets: \[Receiving party\]/)).toBeVisible()
    await expect(page.getByText(/You have unsaved changes/)).toBeVisible()
  })
})
