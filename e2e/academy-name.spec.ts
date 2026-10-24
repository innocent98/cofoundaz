import { test, expect, type Page } from '@playwright/test'

// Academy re-walk D2: a member with no profile name is asked for one before the
// last lesson completes. The API is mocked with the shapes in
// fe-integration-guide-profile.md and fe-integration-guide-academy.md
// (placeholder ids and names).

const WS = '11ba2aa0-8c8d-4035-adb8-62530988ed44'
const json = (data: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify({ data, meta: null }) })

const meWith = (name: string | null) => ({
  user: { id: '6087acf5-f674-447f-88a2-cd46baffe39a', email: 'placeholder@example.com', status: 'active' },
  profile: { full_name: name, role_title: null, country: null, avatar_url: null },
  memberships: [{ startup_id: WS, name: 'NovaPay', role: 'team_member' }],
  active_workspace_id: WS,
})

const course = {
  id: 'idea-shape-the-problem', title: 'Shape the problem', summary: 'Placeholder summary.', level: 'beginner', stage_tags: ['idea'],
  lesson_count: 2, duration_min: 20, review_status: 'draft', enrolled: true, progress: 50, completed: false,
  last_lesson_id: 'idea-shape-the-problem-1', next_lesson_id: 'idea-shape-the-problem-2', position_s: 0,
  description: 'Placeholder description.', outcomes: ['One'],
  lessons: [
    { id: 'idea-shape-the-problem-1', title: 'First', order: 1, duration_min: 10, video: null, transcript: 'Body one.', completed: true, position_s: 0 },
    { id: 'idea-shape-the-problem-2', title: 'Last', order: 2, duration_min: 10, video: null, transcript: 'Body two.', completed: false, position_s: 0 },
  ],
}

async function setup(page: Page, name: string | null) {
  const calls: string[] = []
  await page.addInitScript((ws) => {
    localStorage.setItem('cf_token', 'placeholder-token')
    localStorage.setItem('cf_workspace_id', ws)
  }, WS)
  await page.route('**/api/v1/**', (route) => route.fulfill(json([])))
  await page.route('**/api/v1/auth/me', async (route) => {
    const req = route.request()
    if (req.method() === 'PATCH') {
      const body = req.postDataJSON() as { full_name: string }
      calls.push(`PATCH /auth/me ${JSON.stringify(body)}`)
      const trimmed = body.full_name.trim().replace(/\s+/g, ' ')
      if (!trimmed) {
        return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', field_errors: [{ field: 'full_name', message: 'Tell us your name.' }] } }) })
      }
      return route.fulfill(json(meWith(trimmed)))
    }
    return route.fulfill(json(meWith(name)))
  })
  await page.route('**/api/v1/learning/courses/idea-shape-the-problem', (route) => route.fulfill(json(course)))
  await page.route('**/api/v1/learning/lessons/*/notes', (route) => route.fulfill(json({ lesson_id: 'x', body: '', updated_at: null })))
  await page.route('**/api/v1/learning/lessons/idea-shape-the-problem-2/progress', (route) => {
    calls.push('PATCH progress')
    return route.fulfill(json({
      lesson_id: 'idea-shape-the-problem-2', course_id: course.id, progress: 100, completed_at: '2026-10-24T10:00:00+00:00', position_s: null,
      certificate: { id: 'c1', course_id: course.id, course_title: course.title, holder_name: 'Rewalk Teammate', credential_id: 'CFZ-AAAA-BBBB-CCCC', issuer: 'Cofoundaz', issued_at: '2026-10-24T10:00:00+00:00', verify_url: 'http://localhost:3000/verify/CFZ-AAAA-BBBB-CCCC', pdf_ready: false, pdf_url: null, linkedin_url: 'https://www.linkedin.com/profile/add' },
    }))
  })
  return calls
}

const LESSON = '/academy/courses/idea-shape-the-problem/lessons/idea-shape-the-problem-2'

for (const width of [1440, 375]) {
  test.describe(`Academy name prompt at ${width}`, () => {
    test.use({ viewport: { width, height: 812 } })

    test('asks for a name, shows the 422, saves, then completes the lesson', async ({ page }) => {
      const calls = await setup(page, null)
      await page.goto(LESSON)
      await page.getByRole('button', { name: 'Mark complete' }).click()
      await expect(page.getByText('Add your name before you finish')).toBeVisible()
      await expect(page.getByText(/prints this name for good/)).toBeVisible()
      expect(calls).not.toContain('PATCH progress')

      await page.getByRole('button', { name: 'Save name and finish course' }).click()
      await expect(page.getByText('Tell us your name.')).toBeVisible()
      expect(calls).not.toContain('PATCH progress')

      await page.getByLabel('Full name').fill('  Rewalk   Teammate  ')
      await page.getByRole('button', { name: 'Save name and finish course' }).click()
      await expect(page.getByText('Course complete')).toBeVisible()
      expect(calls).toContain('PATCH progress')
      expect(calls.some((c) => c.includes('Rewalk   Teammate'))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    })

    test('does not ask when the profile already has a name', async ({ page }) => {
      const calls = await setup(page, 'Ada Founder')
      await page.goto(LESSON)
      await page.getByRole('button', { name: 'Mark complete' }).click()
      await expect(page.getByText('Course complete')).toBeVisible()
      await expect(page.getByText('Add your name before you finish')).toHaveCount(0)
      expect(calls.filter((c) => c.startsWith('PATCH /auth/me'))).toHaveLength(0)
    })
  })
}
