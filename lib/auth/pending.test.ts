import { beforeEach, describe, expect, it, vi } from 'vitest'
import { forgetInvite, readInvite, rememberInvite } from './pending'

const TOKEN = ['invite', 'token', 'fake', 12345].join('-')

describe('invite hand-off', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.useRealTimers()
  })

  it('reads back what was remembered', () => {
    rememberInvite(TOKEN)
    expect(readInvite()).toBe(TOKEN)
  })

  it('falls back to the localStorage copy (new tab) and ignores it after 24 hours', () => {
    vi.useFakeTimers()
    rememberInvite(TOKEN)
    sessionStorage.clear()
    expect(readInvite()).toBe(TOKEN)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000)
    expect(readInvite()).toBeNull()
    expect(localStorage.getItem('cf_invite_token')).toBeNull()
  })

  it('rejects a token that is not URL-safe, and forget clears both stores', () => {
    sessionStorage.setItem('cf_invite_token', '../../admin')
    expect(readInvite()).toBeNull()
    rememberInvite(TOKEN)
    forgetInvite()
    expect(readInvite()).toBeNull()
  })
})
