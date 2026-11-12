import { test, expect, type Page } from '@playwright/test'

// Documents FE (docs/checklist/documents-prd-gaps.md). The API is mocked with the shapes captured live in
// cofoundaz-api/docs/fe-integration-guide-documents-library.md. IDs and emails are placeholders.

const WS = '48469527-1d83-4ddf-afd0-b4df963e92e1'
const DOC_ID = 'c1f3192a-aca9-4bcf-88ff-27e8ca511ed6'

const json = (data: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(status >= 400 ? data : { data, meta: null }),
})

const me = (role: string) => ({
  user: { id: 'u1', email: 'placeholder@example.com' },
  profile: { full_name: 'Placeholder Person', role_title: 'Founder', country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role }],
  active_workspace_id: WS,
})

const owner = { id: '1694eaad-0851-40a7-8c58-576c80cced79', name: 'Ada Founder' }
const doc = {
  id: DOC_ID,
  kind: 'custom',
  mime: 'application/vnd.cofoundaz.document+json',
  title: 'Seed pitch narrative',
  status: 'draft',
  ai_generated: false,
  folder: 'Fundraising/Seed',
  tags: ['Pitch', 'seed'],
  template_key: null,
  version: 4,
  owner,
  share_count: 2,
  updated_at: '2026-10-25T11:02:18.285772+00:00',
  trashed_at: null,
  purges_at: null,
}
const file = {
  id: '199e1cb9-db1a-4762-b437-aaf02127834b',
  filename: 'Term sheet (signed).pdf',
  content_type: 'application/pdf',
  mime: 'application/pdf',
  size_bytes: 19,
  folder: 'Contracts',
  tags: ['legal'],
  owner,
  share_count: 0,
  scan_status: 'clean',
  uploaded_at: '2026-10-25T11:02:18.441478+00:00',
  trashed_at: null,
  purges_at: null,
}
const folder = (name: string, path: string, parent: string | null, total: number) => ({
  id: `f-${path}`, name, path, parent_id: parent, document_count: total, file_count: 0, total_count: total,
})
const tree = {
  folders: [folder('Fundraising', 'Fundraising', null, 1), folder('Seed', 'Fundraising/Seed', 'f-Fundraising', 1)],
  uncategorized: 1,
  trash: 1,
  total: 2,
}
const forbidden = { error: { code: 'FORBIDDEN', message: "You don't have permission to do that.", field_errors: [] } }

async function setup(page: Page, role: string, extra?: (p: Page) => Promise<void>) {
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(json(me(role))))
  if (role === 'founder' || role === 'team_member') {
    await page.route('**/api/v1/documents/folders', (route) => route.fulfill(json(tree)))
    await page.route(/\/api\/v1\/documents(\?.*)?$/, (route) => route.fulfill(json({ documents: [doc] })))
    await page.route(/\/api\/v1\/documents\/files(\?.*)?$/, (route) => route.fulfill(json({ files: [file] })))
    await page.route('**/api/v1/documents/trash', (route) =>
      route.fulfill(json({ documents: [{ ...doc, title: 'Old plan', trashed_at: '2026-10-25T11:02:19+00:00', purges_at: '2026-11-24T11:02:19+00:00' }], files: [] })),
    )
  } else {
    await page.route(/\/api\/v1\/documents(\/(?!shared-with-me).*)?(\?.*)?$/, (route) => route.fulfill(json(forbidden, 403)))
  }
  await extra?.(page)
}

test.describe('Documents: founder library', () => {
  test('rows carry owner, tags, share chip and a real actions menu (rows 22, 23)', async ({ page }) => {
    await setup(page, 'founder')
    await page.goto('/documents')
    await expect(page.getByRole('link', { name: /Seed pitch narrative/ })).toBeVisible()
    await expect(page.getByText(/Ada Founder · .* · Shared · 2/)).toBeVisible()
    await expect(page.getByText('seed', { exact: true })).toBeVisible()
    await expect(page.getByText('Term sheet (signed).pdf')).toBeVisible()
    await page.getByRole('button', { name: 'Actions for Seed pitch narrative' }).click()
    await expect(page.getByRole('menuitem')).toHaveText(['Open', 'Rename', 'Move to folder', 'Edit tags', 'Share', 'Export as PDF or Word', 'Ask AI', 'Move to Trash'])
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Grid' }).click()
    await expect(page.getByRole('button', { name: 'Actions for Term sheet (signed).pdf' })).toBeVisible()
  })

  test('upload states the 15 MB limit and the scan, and bad files fail with a reason (rows 24, 25)', async ({ page }) => {
    await setup(page, 'founder')
    await page.goto('/documents')
    await expect(page.getByText(/up to 15 MB each/)).toBeVisible()
    await page.locator('input[type=file]').setInputFiles({ name: 'malware.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') })
    await expect(page.getByRole('region', { name: 'Uploads' })).toContainText('isn’t allowed')
  })

  test('Trash lists items with days left and offers Restore and Delete forever (row 8)', async ({ page }) => {
    await setup(page, 'founder')
    await page.goto('/documents')
    await page.getByRole('navigation', { name: 'Folders' }).getByRole('button', { name: /^Trash/ }).click()
    await expect(page.getByText('Old plan')).toBeVisible()
    await expect(page.getByText(/days left/)).toBeVisible()
    await page.getByRole('button', { name: 'Actions for Old plan' }).click()
    await expect(page.getByRole('menuitem')).toHaveText(['Restore', 'Delete forever'])
  })

  test('a failed load says so and offers Try again (row 34)', async ({ page }) => {
    await setup(page, 'founder', async (p) => {
      await p.route(/\/api\/v1\/documents(\?.*)?$/, (route) =>
        route.fulfill(json({ error: { code: 'INTERNAL', message: 'Something went wrong.', field_errors: [] } }, 500)),
      )
    })
    await page.goto('/documents')
    await expect(page.getByRole('alert').filter({ hasText: 'Something went wrong.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(page.getByText('No documents yet')).toHaveCount(0)
  })

  test('375px: nothing overflows and the library controls are 44px high (rows 29, 32)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setup(page, 'founder')
    await page.goto('/documents')
    await expect(page.getByRole('link', { name: /Seed pitch narrative/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false)
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main main button, main main a[href], main main select, main main input:not([type=file])'))
        .filter((el) => !el.closest('.sr-only') && (el as HTMLElement).offsetParent !== null)
        .map((el) => ({ n: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), h: el.getBoundingClientRect().height }))
        .filter((x) => x.h < 43.5),
    )
    expect(small).toEqual([])
  })
})

test.describe('Documents: mentor sees only Shared with me (rows 14, 27)', () => {
  const shared = {
    id: DOC_ID,
    title: 'Seed pitch narrative v2',
    kind: 'custom',
    status: 'final',
    version: 4,
    updated_at: '2026-10-25T11:02:18.285772+00:00',
    permission: 'comment',
    workspace: { id: WS, name: 'LibraryCo' },
    shared_by: { id: owner.id, name: 'Ada Founder' },
    shared_at: '2026-10-25T11:02:18.500602+00:00',
  }

  test('/documents lands on Shared with me, the library routes are never called', async ({ page }) => {
    const owned: string[] = []
    await setup(page, 'mentor', async (p) => {
      await p.route('**/api/v1/documents/shared-with-me', (route) => route.fulfill(json({ documents: [shared] })))
      p.on('request', (r) => {
        if (/\/api\/v1\/documents(\/files|\/folders|\/trash)?(\?|$)/.test(r.url())) owned.push(r.url())
      })
    })
    await page.goto('/documents')
    await expect(page).toHaveURL(/\/documents\/shared-with-me$/)
    await expect(page.getByRole('navigation', { name: 'Documents sections' }).getByRole('link')).toHaveText(['Shared with me'])
    await expect(page.getByText('Seed pitch narrative v2')).toBeVisible()
    await expect(page.getByText('Can comment')).toBeVisible()
    expect(owned).toEqual([])
    for (const path of ['/documents/templates', '/documents/signatures', '/documents/shared']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/documents\/shared-with-me$/)
    }
  })

  test('a document link from the bell opens the shared view; view-only has no comment box', async ({ page }) => {
    await setup(page, 'mentor', async (p) => {
      await p.route(`**/api/v1/documents/shared-with-me/${DOC_ID}`, (route) =>
        route.fulfill(json({ ...shared, permission: 'view', sections: [{ id: 's1', heading: 'Problem', body: 'Founders lose track of paperwork' }] })),
      )
      await p.route(`**/api/v1/documents/shared-with-me/${DOC_ID}/comments`, (route) => route.fulfill(json({ comments: [] })))
    })
    await page.goto(`/documents/${DOC_ID}`)
    await expect(page).toHaveURL(new RegExp(`/documents/shared-with-me/${DOC_ID}$`))
    await expect(page.getByText('Founders lose track of paperwork')).toBeVisible()
    await expect(page.getByLabel('Add a comment')).toHaveCount(0)
    await expect(page.getByText(/can’t comment on it/)).toBeVisible()
  })

  test('nothing shared yet explains itself instead of showing a broken page', async ({ page }) => {
    await setup(page, 'investor', async (p) => {
      await p.route('**/api/v1/documents/shared-with-me', (route) => route.fulfill(json({ documents: [] })))
    })
    await page.goto('/documents')
    await expect(page.getByText('Nothing has been shared with you yet')).toBeVisible()
  })

  test('a revoked document is a clear "no longer shared" state', async ({ page }) => {
    await setup(page, 'mentor', async (p) => {
      await p.route(`**/api/v1/documents/shared-with-me/${DOC_ID}`, (route) =>
        route.fulfill(json({ error: { code: 'NOT_FOUND', message: 'Not found.', field_errors: [] } }, 404)),
      )
      await p.route(`**/api/v1/documents/shared-with-me/${DOC_ID}/comments`, (route) =>
        route.fulfill(json({ error: { code: 'NOT_FOUND', message: 'Not found.', field_errors: [] } }, 404)),
      )
    })
    await page.goto(`/documents/shared-with-me/${DOC_ID}`)
    await expect(page.getByText(/no longer shared with you/)).toBeVisible()
  })
})
