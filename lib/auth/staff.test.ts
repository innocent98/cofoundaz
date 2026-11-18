import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
import { fetchStaffHome, isConsolePath, staffHome } from './staff'
import { completePostLogin, resolveAfterVerify } from './post-login'

vi.mock('@/lib/api/client', () => ({ apiClient: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ setSession: vi.fn(), ensureSession: vi.fn(async () => true) }))
vi.mock('@/lib/auth/pending', () => ({
  forgetInvite: vi.fn(),
  readInvite: vi.fn(() => null),
  rememberPendingEmail: vi.fn(),
}))

const api = vi.mocked(client.apiClient)

function answer(staffRole: string | null) {
  api.mockImplementation(async (path: string) => {
    if (path === '/auth/me')
      return { data: { user: { id: 'u-placeholder', email: 'x@example.com', status: 'active' }, staff_role: staffRole } }
    if (path === '/onboarding/state') return { data: { step: 1, completed: false } }
    throw new Error(`unexpected ${path}`)
  })
}

async function landing(staffRole: string | null, nextPath: string | null = null) {
  answer(staffRole)
  const router = { push: vi.fn() }
  await completePostLogin({ accessToken: 't', router, nextPath })
  return router.push.mock.calls[0][0] as string
}

describe('staff skip founder onboarding (SO4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps a staff role to its console', () => {
    expect(staffHome('admin')).toBe('/admin-portal')
    expect(staffHome('super_admin')).toBe('/super-admin')
    expect(staffHome(null)).toBeNull()
    expect(staffHome(undefined)).toBeNull()
  })

  it('recognises console paths only', () => {
    expect(isConsolePath('/admin-portal')).toBe(true)
    expect(isConsolePath('/super-admin?tab=x')).toBe(true)
    expect(isConsolePath('/admin-portalx')).toBe(false)
    expect(isConsolePath('/dashboard')).toBe(false)
    expect(isConsolePath(null)).toBe(false)
  })

  it('sends an admin to the admin console, never onboarding', async () => {
    expect(await landing('admin')).toBe('/admin-portal')
    expect(api).not.toHaveBeenCalledWith('/onboarding/state', expect.anything())
  })

  it('sends a super admin to the super-admin console', async () => {
    expect(await landing('super_admin')).toBe('/super-admin')
  })

  it('keeps a console deep link for staff but not a founder page', async () => {
    expect(await landing('admin', '/admin-portal?tab=users')).toBe('/admin-portal?tab=users')
    expect(await landing('admin', '/dashboard')).toBe('/admin-portal')
  })

  it('still sends an unfinished founder to onboarding', async () => {
    expect(await landing(null)).toBe('/onboarding')
  })

  it('routes staff to the console after email verification', async () => {
    answer('super_admin')
    expect(await resolveAfterVerify()).toBe('/super-admin')
    answer(null)
    expect(await resolveAfterVerify()).toBe('/onboarding')
  })

  it('answers null when /auth/me cannot be read', async () => {
    api.mockRejectedValue(new Error('down'))
    expect(await fetchStaffHome()).toBeNull()
  })
})
