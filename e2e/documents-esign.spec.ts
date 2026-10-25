import { test, expect, type Page } from '@playwright/test'

// Documents e-sign v2 FE (BE-D). The API is mocked with the shapes captured live in
// cofoundaz-api/docs/fe-integration-guide-documents-esign-v2.md. IDs, tokens and emails are placeholders.

const WS = '48469527-1d83-4ddf-afd0-b4df963e92e1'
const REQ_ID = '2b81176a-edce-4db2-9f1f-bae2a087aa3b'
const FILE_ID = 'b151cc1c-a92e-49d8-9c3e-ac10856bfa9f'
const CAVEAT =
  'These are simple electronic signatures: each signer typed their name to adopt it as their signature. Cofoundaz records the signer\'s email, IP address, browser, the time and the document\'s SHA-256 hash, but does not issue a certificate-based or qualified signature and is not a trust service provider. Whether a typed-name signature is enforceable depends on the document and the jurisdiction; take legal advice for high-stakes agreements.'

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(status >= 400 ? data : { data, meta: null }),
})
const apiError = (code: string, message: string) => ({ error: { code, message, field_errors: [] } })
const owner = { id: '74d8ddad-0d8b-404d-ac03-5f23280cf490', name: 'Ada Founder' }

const signer = (over: Record<string, unknown>) => ({
  id: 's1', email: 'one@example.com', name: 'Ada Investor', position: 0, status: 'pending', notified_at: '2026-10-25T17:18:02.941259+00:00',
  viewed_at: null, signed_at: null, signed_name: null, signed_ip: null, signed_user_agent: null, link_copies: [], ...over,
})
const request = (over: Record<string, unknown> = {}) => ({
  id: REQ_ID, title: 'Founders agreement', status: 'awaiting', file_id: FILE_ID, filename: 'founders-agreement.pdf', signed_count: 0, total: 2,
  sequential: true, message: 'Hi both, please sign before Friday.\nThanks, Ada', sent_at: '2026-10-25T17:18:02.933745+00:00',
  expires_at: '2026-11-08T17:18:02.941259+00:00', completed_at: null, created_at: '2026-10-25T17:18:02.933745+00:00',
  document_hash: 'a1f361e64b738f2c2946da5dadaab49a4d5adb6fc53255ff6bc4c2fac4ecf627', executed: null, legal_caveat: CAVEAT,
  signers: [
    signer({ status: 'viewed', viewed_at: '2026-10-25T17:18:02.996890+00:00', link_copies: [{ at: '2026-10-25T17:18:02.950734+00:00', via: 'created', name: 'Ada Founder', email: 'f@example.com', user_id: 'u1' }, { at: '2026-10-25T17:30:00+00:00', via: 'copied', name: 'Ada Founder', email: 'f@example.com', user_id: 'u1' }] }),
    signer({ id: 's2', email: 'two@example.com', name: 'Bello Legal', position: 1, status: 'waiting', notified_at: null }),
  ],
  ...over,
})
const pdf = (id: string, filename: string, mime = 'application/pdf') => ({
  id, filename, content_type: mime, mime, type: 'file', origin: 'upload', source_document_id: null, source_version: null, size_bytes: 1371, folder: null,
  tags: [], owner, share_count: 0, scan_status: 'clean', uploaded_at: '2026-10-25T17:18:02+00:00', trashed_at: null, purges_at: null,
})

async function setup(page: Page, extra?: (p: Page) => Promise<void>) {
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill(json({
      user: { id: 'u1', email: 'placeholder@example.com' },
      profile: { full_name: 'Ada Founder', role_title: 'Founder', country: null, avatar_url: null },
      memberships: [{ startup_id: WS, name: 'NovaPay', role: 'founder' }],
      active_workspace_id: WS,
    })),
  )
  await page.route('**/api/v1/documents/folders', (route) => route.fulfill(json({ folders: [], uncategorized: 0, trash: 0, total: 0 })))
  await extra?.(page)
}
const alerts = (page: Page) => page.locator('[role=alert]:not(#__next-route-announcer__)')

test.describe('Documents e-sign v2: request list and detail', () => {
  test('per-signer Awaiting/Viewed/Signed/Waiting with times; waiting signers have no copy button', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) => route.fulfill(json({ requests: [request()] })))
    })
    await page.goto('/documents/signatures')
    const list = page.getByRole('list', { name: 'Signers for Founders agreement' })
    await expect(list).toContainText('Viewed')
    await expect(list).toContainText('Waiting for Ada Investor to sign')
    await expect(page.getByText(/Sent .*2026/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy signing link for Ada Investor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy signing link for Bello Legal' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Show details for Founders agreement' }).click()
    await expect(page.getByText('Hi both, please sign before Friday.')).toBeVisible()
    await expect(page.getByText(/Link copied by Ada Founder, /)).toBeVisible()
    await expect(page.getByText(/take legal advice for high-stakes agreements/)).toBeVisible()
  })

  test('copying a link warns first, records the copy, and explains LINK_NOT_RECOVERABLE', async ({ page }) => {
    let calls = 0
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) => route.fulfill(json({ requests: [request()] })))
      await p.route(`**/api/v1/documents/signature-requests/${REQ_ID}/signers/s1/link`, (route) => {
        calls += 1
        return route.fulfill(json(apiError('LINK_NOT_RECOVERABLE', 'x'), 409))
      })
    })
    await page.goto('/documents/signatures')
    await page.getByRole('button', { name: 'Copy signing link for Ada Investor' }).click()
    await expect(page.getByText(/Anyone with this link can sign as/)).toBeVisible()
    expect(calls).toBe(0)
    await page.getByRole('button', { name: 'Copy link', exact: true }).click()
    await expect(page.getByText(/Send a reminder to give them a new link/)).toBeVisible()
  })

  test('executed copy: ready downloads, pending shows preparing, legacy says there is none', async ({ page }) => {
    const done = (executed: unknown, id: string, title: string) => request({ id, title, status: 'complete', signed_count: 2, completed_at: new Date().toISOString(), executed })
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) =>
        route.fulfill(json({
          requests: [
            done({ state: 'ready', file_id: 'f9', filename: 'founders-agreement - signed.pdf', size_bytes: 4669, sha256: 'abc' }, 'r-ready', 'Ready one'),
            done({ state: 'pending', file_id: null, filename: null, size_bytes: null }, 'r-pending', 'Pending one'),
            done({ state: 'legacy', file_id: null, filename: null, size_bytes: null }, 'r-legacy', 'Legacy one'),
          ],
        })),
      )
    })
    await page.goto('/documents/signatures')
    await expect(page.getByRole('button', { name: 'Download executed PDF' })).toBeVisible()
    await expect(page.getByText('Signed. Preparing the executed copy…')).toBeVisible()
    await expect(page.getByText(/No executed copy exists for this request/)).toBeVisible()
  })

  test('Remind warns that old links stop working; Cancel confirms', async ({ page }) => {
    let reminded = false
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) => route.fulfill(json({ requests: [request()] })))
      await p.route(`**/api/v1/documents/signature-requests/${REQ_ID}/remind`, (route) => {
        reminded = true
        return route.fulfill(json({ reminded: 1 }))
      })
    })
    await page.goto('/documents/signatures')
    await page.getByRole('button', { name: 'Remind' }).click()
    await expect(page.getByText(/Their old link stops working/)).toBeVisible()
    await page.getByRole('button', { name: 'Send reminder' }).click()
    await expect(page.getByText('Reminder sent to 1 signer.')).toBeVisible()
    expect(reminded).toBe(true)
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.getByText(/Signers lose their links straight away/)).toBeVisible()
  })
})

test.describe('Documents e-sign v2: send flow', () => {
  test('only PDFs are selectable; order, message and expiry go to the API; the links dialog shows waiting signers', async ({ page }) => {
    let body: Record<string, unknown> = {}
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) => route.fulfill(json({ requests: [] })))
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) =>
        route.fulfill(json({ files: [pdf(FILE_ID, 'founders-agreement.pdf'), pdf('d1', 'plan.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')] })),
      )
      await p.route(`**/api/v1/documents/files/${FILE_ID}/signature-requests`, async (route) => {
        body = route.request().postDataJSON()
        await route.fulfill(json({ ...request(), signer_links: ['http://localhost:3000/sign/REDACTED_TOKEN', null] }, 201))
      })
    })
    await page.goto('/documents/signatures')
    await page.getByRole('button', { name: 'New request' }).first().click()
    await expect(page.getByRole('option', { name: /plan.docx \(export to PDF first\)/ })).toBeDisabled()
    await page.getByLabel('Signer 1 email').fill('one@example.com')
    await page.getByRole('button', { name: '+ Add signer' }).click()
    await page.getByLabel('Signer 2 email').fill('two@example.com')
    await page.getByLabel('Signers sign one after another').check()
    await expect(page.getByRole('button', { name: 'Move signer 2 up' })).toBeVisible()
    await page.getByLabel(/Message to the signers/).fill('Hi both, please sign before Friday.')
    await page.getByLabel('Link expires after').selectOption('never')
    await page.getByRole('button', { name: 'Send request' }).click()
    expect(body).toMatchObject({ sequential: true, message: 'Hi both, please sign before Friday.', expires_in_days: null, signers: [{ email: 'one@example.com' }, { email: 'two@example.com' }] })
    await expect(page.getByLabel('Signer link 1')).toHaveValue(/\/sign\/REDACTED_TOKEN/)
    await expect(page.getByText(/Waits for Ada Investor to sign/)).toBeVisible()
  })

  test('PDF_REQUIRED and a bad signer email show real copy', async ({ page }) => {
    let n = 0
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) => route.fulfill(json({ requests: [] })))
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [pdf(FILE_ID, 'founders-agreement.pdf')] })))
      await p.route(`**/api/v1/documents/files/${FILE_ID}/signature-requests`, (route) => {
        n += 1
        if (n === 1) return route.fulfill(json(apiError('PDF_UNREADABLE', "This PDF can't be signed: it is encrypted, damaged or too long. Upload a plain PDF."), 422))
        return route.fulfill(json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: 'signers.0.email', message: 'Value error, Enter a valid email address.' }] } }, 422))
      })
    })
    await page.goto('/documents/signatures?file=' + FILE_ID)
    await page.getByLabel('Signer 1 email').fill('one@example.com')
    await page.getByRole('button', { name: 'Send request' }).click()
    await expect(alerts(page).first()).toContainText("This PDF can't be signed")
    await page.getByRole('button', { name: 'Send request' }).click()
    await expect(page.getByText('Signer 1: Enter a valid email address.')).toBeVisible()
  })
})

test.describe('Documents e-sign v2: public sign page', () => {
  const view = {
    request: { title: 'Founders agreement', status: 'awaiting', message: 'Hi both, please sign before Friday.\nThanks, Ada', sent_by: 'Ada Founder', sequential: true, expires_at: '2026-11-08T17:18:02.941259+00:00' },
    file: { filename: 'founders-agreement.pdf', content_type: 'application/pdf', size_bytes: 1371, download_url: 'http://127.0.0.1:8610/api/v1/sign/TOKEN/file' },
    signer: { email: 'one@example.com', name: 'Ada Investor' },
    legal_caveat: CAVEAT,
  }

  test('shows the sender message and the legal caveat, signs, then downloads the executed copy once it is ready', async ({ page }) => {
    let polls = 0
    await page.route('**/api/v1/sign/TOKEN', async (route) => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toEqual({ typed_name: 'Ada Investor' })
        return route.fulfill(json({ id: REQ_ID, title: 'Founders agreement', status: 'complete', signed_count: 2, total: 2, completed_at: '2026-10-25T17:30:00+00:00', executed_url: 'http://127.0.0.1:8610/api/v1/sign/TOKEN/executed' }))
      }
      return route.fulfill(json(view))
    })
    await page.route('**/api/v1/sign/TOKEN/executed', (route) => {
      polls += 1
      if (polls === 1) return route.fulfill(json(apiError('EXECUTED_NOT_READY', "The executed copy isn't ready yet. Try again shortly."), 409))
      return route.fulfill({ status: 200, contentType: 'application/pdf', headers: { 'content-disposition': 'attachment; filename="x - signed.pdf"' }, body: '%PDF-1.4' })
    })
    await page.goto('/sign/TOKEN')
    await expect(page.getByText('Hi both, please sign before Friday.')).toBeVisible()
    await expect(page.getByText(/take legal advice for high-stakes agreements/)).toBeVisible()
    await page.getByLabel(/I agree that typing my name/).check()
    await page.getByRole('button', { name: 'Sign document' }).click()
    await expect(page.getByText('Signed, thank you')).toBeVisible()
    await expect(page.getByText('Preparing the signed copy…')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download the signed PDF' })).toBeVisible({ timeout: 10_000 })
  })

  test('every dead token is the same page', async ({ page }) => {
    await page.route('**/api/v1/sign/TOKEN', (route) => route.fulfill(json(apiError('NOT_FOUND', 'Not found.'), 404)))
    await page.goto('/sign/TOKEN')
    await expect(page.getByRole('heading', { name: 'This link is no longer valid' })).toBeVisible()
  })
})

test.describe('Documents e-sign v2: link shares for files', () => {
  const share = (over: Record<string, unknown> = {}) => ({
    id: '130bc553-b54e-44ae-8807-efe8b49ef592', kind: 'file', email: null, anyone_with_link: true, access_level: 'view', expires_at: '2026-11-04T17:18:02+00:00',
    revoked_at: null, last_viewed_at: null, created_at: '2026-10-25T17:18:02.670085+00:00', status: 'active', link: 'http://localhost:3000/shared/REDACTED_TOKEN', ...over,
  })

  test('create "anyone with the link", copy again, change expiry, revoke', async ({ page }) => {
    const bodies: Record<string, unknown>[] = []
    let shares = [share()]
    await setup(page, async (p) => {
      await p.route(/\/api\/v1\/documents(\?.*)?$/, (route) => route.fulfill(json({ documents: [] })))
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [pdf(FILE_ID, 'founders-agreement.pdf')] })))
      await p.route('**/api/v1/documents/trash', (route) => route.fulfill(json({ documents: [], files: [] })))
      await p.route(`**/api/v1/documents/files/${FILE_ID}/shares`, async (route) => {
        if (route.request().method() === 'POST') {
          bodies.push(route.request().postDataJSON())
          return route.fulfill(json(share({ id: 'new' }), 201))
        }
        return route.fulfill(json({ shares }))
      })
      await p.route(`**/api/v1/documents/files/${FILE_ID}/shares/*`, async (route) => {
        if (route.request().method() === 'PATCH') {
          bodies.push(route.request().postDataJSON())
          return route.fulfill(json(share({ expires_at: null })))
        }
        shares = []
        return route.fulfill(json({ revoked: true }))
      })
    })
    await page.goto('/documents')
    await page.getByRole('button', { name: 'Actions for founders-agreement.pdf' }).click()
    await expect(page.getByRole('menuitem')).toContainText(['Share by link', 'Send for signature'])
    await page.getByRole('menuitem', { name: 'Share by link' }).click()
    await expect(page.getByText('Anyone with the link').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Copy link for/ })).toBeVisible()
    await page.getByLabel('Link expiry').selectOption('7')
    await page.getByRole('button', { name: 'Create link for anyone' }).click()
    expect(bodies[0]).toEqual({ access_level: 'view', expires_in_days: 7 })
    await page.getByRole('button', { name: 'Change expiry' }).first().click()
    await page.getByRole('button', { name: 'Never expires' }).click()
    expect(bodies[1]).toEqual({ expires_at: null })
    await page.getByRole('button', { name: /Revoke link for/ }).first().click()
    await expect(page.getByText('No active links.')).toBeVisible()
  })
})

test.describe('Documents e-sign v2: walk fixes', () => {
  test('a cancelled request does not call its unsigned signer Awaiting, and offers no Copy link', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) =>
        route.fulfill(json({ requests: [request({ status: 'cancelled', signers: [signer({ status: 'pending' })], total: 1 })] })),
      )
    })
    await page.goto('/documents/signatures')
    const list = page.getByRole('list', { name: 'Signers for Founders agreement' })
    await expect(list).toContainText('Not signed')
    await expect(list).toContainText('The request was cancelled')
    await expect(page.getByRole('button', { name: /Copy signing link/ })).toHaveCount(0)
  })

  test('a blocked clipboard does not turn a created link into an error', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Document is not focused')) } })
    })
    const made = { id: 'n1', kind: 'file', email: null, anyone_with_link: true, access_level: 'view', expires_at: '2026-11-04T17:18:02+00:00', revoked_at: null, last_viewed_at: null, created_at: '2026-10-25T17:18:02+00:00', status: 'active', link: 'http://localhost:3000/shared/REDACTED_TOKEN' }
    let created = false
    await setup(page, async (p) => {
      await p.route(/\/api\/v1\/documents(\?.*)?$/, (route) => route.fulfill(json({ documents: [] })))
      await p.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [pdf(FILE_ID, 'founders-agreement.pdf')] })))
      await p.route('**/api/v1/documents/trash', (route) => route.fulfill(json({ documents: [], files: [] })))
      await p.route(`**/api/v1/documents/files/${FILE_ID}/shares`, (route) => {
        if (route.request().method() === 'POST') {
          created = true
          return route.fulfill(json(made, 201))
        }
        return route.fulfill(json({ shares: created ? [made] : [] }))
      })
    })
    await page.goto('/documents')
    await page.getByRole('button', { name: 'Actions for founders-agreement.pdf' }).click()
    await page.getByRole('menuitem', { name: 'Share by link' }).click()
    await page.getByRole('button', { name: 'Create link for anyone' }).click()
    await expect(page.getByText('Link created. Copy it from the field below.')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Active links' })).toContainText('Anyone with the link')
    // D1: the link itself is shown in a read-only field to copy by hand
    await expect(page.locator('input[aria-label="Link for anyone"]')).toHaveValue('http://localhost:3000/shared/REDACTED_TOKEN')
  })

  test('the public document page shows the legal notice; a public file page offers Download', async ({ page }) => {
    await page.route('**/api/v1/shared/DOCTOKEN', (route) =>
      route.fulfill(json({ kind: 'document', document: { title: 'NDA', status: 'draft', version: 1, updated_at: '2026-10-25T17:00:00+00:00', disclaimer: 'Not legal advice.', sections: [{ id: 's', heading: 'Parties', body: 'Text' }] }, access_level: 'view', expires_at: null })),
    )
    await page.goto('/shared/DOCTOKEN')
    await expect(page.getByRole('note', { name: 'Not legal advice' })).toContainText('Not legal advice.')
    await page.route('**/api/v1/shared/FILETOKEN', (route) =>
      route.fulfill(json({ kind: 'file', file: { filename: 'founders-agreement.pdf', content_type: 'application/pdf', size_bytes: 1371, viewer: 'pdf', download_url: 'http://127.0.0.1:8610/api/v1/shared/FILETOKEN/file' }, access_level: 'view', expires_at: '2026-11-04T17:18:02+00:00' })),
    )
    await page.goto('/shared/FILETOKEN')
    await expect(page.getByRole('heading', { name: 'founders-agreement.pdf' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download' })).toHaveAttribute('href', /\/shared\/FILETOKEN\/file$/)
  })
})

test.describe('Documents re-walk fixes', () => {
  test('D2: an old completed request still pending shows plain copy, no spinner, and Check again', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) =>
        route.fulfill(json({
          requests: [request({
            status: 'complete', signed_count: 2, completed_at: '2026-10-20T10:00:00+00:00',
            executed: { state: 'pending', file_id: null, filename: null, size_bytes: null },
          })],
        })),
      )
    })
    await page.goto('/documents/signatures')
    const note = page.getByRole('status').filter({ hasText: 'taking longer than usual' })
    await expect(note).toContainText('Check back later.')
    await expect(page.getByText('Preparing the executed copy')).toHaveCount(0)
    await expect(page.locator('.animate-spin')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Check again' })).toBeVisible()
  })

  test('D2: an executed copy the API reports as failed says it could not be made', async ({ page }) => {
    await setup(page, async (p) => {
      await p.route('**/api/v1/documents/signature-requests', (route) =>
        route.fulfill(json({
          requests: [request({
            status: 'complete', signed_count: 2, completed_at: '2026-10-25T17:30:00+00:00',
            executed: { state: 'failed', file_id: null, filename: null, size_bytes: null },
          })],
        })),
      )
    })
    await page.goto('/documents/signatures')
    await expect(page.getByText(/The executed copy could not be made/)).toBeVisible()
  })

  test('D3: Add section moves focus to the new section heading', async ({ page }) => {
    const docId = 'cec804f2-8862-4a3b-b7f0-8f3b576615aa'
    await setup(page, async (p) => {
      await p.route(`**/api/v1/documents/${docId}`, (route) =>
        route.fulfill(json({
          id: docId, type: 'document', kind: 'custom', mime: 'application/vnd.cofoundaz.document+json', title: 'Blank doc', status: 'draft', ai_generated: false,
          folder: null, tags: [], template_key: null, disclaimer: null, version: 1, owner, share_count: 0, updated_at: '2026-10-25T15:03:54+00:00',
          trashed_at: null, purges_at: null, sections: [{ id: 's1', heading: 'First', body: '' }],
        })),
      )
    })
    await page.goto(`/documents/${docId}`)
    await page.getByRole('button', { name: 'Add section' }).click()
    await page.keyboard.type('Risks')
    await expect(page.getByLabel('Document title')).toHaveValue('Blank doc')
    await expect(page.getByLabel('Section heading').nth(1)).toHaveValue('Risks')
  })

  test('D4: the signup email is prefilled from an invite link and the terms box takes a click', async ({ page }) => {
    await page.goto('/signup?next=%2Finvite%2Fabc&email=invitee%40example.com')
    await expect(page.getByLabel(/work email/i)).toHaveValue('invitee@example.com')
    await page.getByRole('checkbox').click()
    await expect(page.getByRole('checkbox')).toBeChecked()
  })
})
