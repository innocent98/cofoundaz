import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accessTokenForRequest, clearSession, ensureSession, getAccessToken, hasSessionHint, isLoggedIn, refreshSession, setSession } from './session'

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
})
