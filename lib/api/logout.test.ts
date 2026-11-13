import { afterEach, describe, expect, it, vi } from 'vitest'
import { logout } from './profile'
import { clearSession, hasSessionHint, setSession } from '@/lib/auth/session'
import { takeLoginNotice } from '@/lib/auth/pending'

const res = (status: number) => new Response('{}', { status, headers: { 'Content-Type': 'application/json' } })

describe('logout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
    sessionStorage.clear()
  })

  it('clears the session and says nothing when the server confirms', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(200)))
    setSession({ access_token: 'x' })
    await logout()
    expect(hasSessionHint()).toBe(false)
    expect(takeLoginNotice()).toBeNull()
  })

  it('still signs out locally and leaves a notice when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
    setSession({ access_token: 'x' })
    await logout()
    expect(hasSessionHint()).toBe(false)
    expect(takeLoginNotice()).toMatch(/couldn't reach the server/)
  })

  it('a 401 (already signed out there) is not worth a notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401)))
    await logout()
    expect(takeLoginNotice()).toBeNull()
  })
})
