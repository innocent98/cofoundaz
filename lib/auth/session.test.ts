import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withStorageLock, accessTokenForRequest, clearSession, ensureSession, getAccessToken, hasSessionHint, isLoggedIn, refreshSession, setSession } from './session'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
// Fake token values, assembled so no secret-looking literal is committed.
const TOK = ['fake', 'access', 1].join('-')

describe('session seam', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    clearSession()
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('keeps the token in memory only; storage holds just a non-secret hint', () => {
    setSession({ access_token: TOK, expires_in: 900 })
    expect(getAccessToken()).toBe(TOK)
    expect(isLoggedIn()).toBe(true)
    expect(hasSessionHint()).toBe(true)
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(TOK)
  })

  it('clearSession drops the token and the hint', () => {
    setSession({ access_token: TOK })
    clearSession()
    expect(isLoggedIn()).toBe(false)
    expect(hasSessionHint()).toBe(false)
  })

  it('ensureSession is false without a hint and makes no request', async () => {
    expect(await ensureSession()).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shares one refresh between concurrent callers (single flight) and sends the cookie-mode call', async () => {
    localStorage.setItem('cf_session', '1')
    fetchMock.mockResolvedValue(ok({ data: { access_token: TOK, refresh_token: null, expires_in: 900 } }))
    const [a, b, c] = await Promise.all([refreshSession(), refreshSession(), accessTokenForRequest()])
    expect([a, b, c]).toEqual([TOK, TOK, TOK])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/auth/refresh')
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', headers: { 'X-Auth-Mode': 'cookie' } })
    expect(init.body).toBeUndefined()
  })

  it('a 401 from refresh means signed out: hint cleared, no token', async () => {
    localStorage.setItem('cf_session', '1')
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
    expect(await ensureSession()).toBe(false)
    expect(hasSessionHint()).toBe(false)
  })

  it('a transient failure keeps the hint so the next call retries', async () => {
    localStorage.setItem('cf_session', '1')
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    expect(await refreshSession()).toBeNull()
    expect(hasSessionHint()).toBe(true)
  })

  it('deletes tokens an older version left in localStorage', () => {
    localStorage.setItem('cf_token', 'old')
    localStorage.setItem('cf_refresh_token', 'old')
    hasSessionHint()
    expect(localStorage.getItem('cf_token')).toBeNull()
    expect(localStorage.getItem('cf_refresh_token')).toBeNull()
  })

  describe('storage mutex (no Web Locks)', () => {
    it('runs two contenders one after the other, never overlapping', async () => {
      const log: string[] = []
      const job = (name: string) => async () => {
        log.push(`${name}:start`)
        await new Promise((r) => setTimeout(r, 40))
        log.push(`${name}:end`)
      }
      await Promise.all([withStorageLock(job('a'), { pollMs: 5, settleMs: 5 }), withStorageLock(job('b'), { pollMs: 5, settleMs: 5 })])
      expect(log).toHaveLength(4)
      expect(log[0].endsWith(':start') && log[1].endsWith(':end') && log[0].split(':')[0] === log[1].split(':')[0]).toBe(true)
      expect(localStorage.getItem('cf_refresh_lock')).toBeNull()
    })

    it('takes over a lock whose TTL has passed (a tab that died mid-refresh)', async () => {
      localStorage.setItem('cf_refresh_lock', JSON.stringify({ owner: 'dead-tab', expiresAt: Date.now() - 1 }))
      const ran = vi.fn().mockResolvedValue('ok')
      await expect(withStorageLock(ran, { pollMs: 5, settleMs: 5 })).resolves.toBe('ok')
      expect(ran).toHaveBeenCalledTimes(1)
    })

    it('waits while a live lock is held, then runs', async () => {
      localStorage.setItem('cf_refresh_lock', JSON.stringify({ owner: 'other-tab', expiresAt: Date.now() + 60 }))
      const t0 = Date.now()
      await withStorageLock(async () => undefined, { pollMs: 10, settleMs: 5 })
      expect(Date.now() - t0).toBeGreaterThanOrEqual(40)
    })

    it('does not delete a lock it no longer owns when it finishes', async () => {
      await withStorageLock(async () => {
        localStorage.setItem('cf_refresh_lock', JSON.stringify({ owner: 'someone-else', expiresAt: Date.now() + 5000 }))
      }, { pollMs: 5, settleMs: 5 })
      expect(JSON.parse(localStorage.getItem('cf_refresh_lock') ?? '{}').owner).toBe('someone-else')
    })

    it('a refresh that waited and finds the hint cleared by another tab (logout) makes no request', async () => {
      localStorage.setItem('cf_session', '1')
      localStorage.setItem('cf_refresh_lock', JSON.stringify({ owner: 'other-tab', expiresAt: Date.now() + 80 }))
      const pending = refreshSession()
      localStorage.removeItem('cf_session') // the other tab signed out while we waited
      expect(await pending).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('after waiting behind another tab it still refreshes once itself with the shared cookie', async () => {
      localStorage.setItem('cf_session', '1')
      localStorage.setItem('cf_refresh_lock', JSON.stringify({ owner: 'other-tab', expiresAt: Date.now() + 60 }))
      fetchMock.mockResolvedValue(ok({ data: { access_token: TOK, refresh_token: null, expires_in: 900 } }))
      expect(await refreshSession()).toBe(TOK)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
