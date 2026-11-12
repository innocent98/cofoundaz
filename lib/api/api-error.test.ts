import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { apiErrorInfo } from './api-error'

describe('apiErrorInfo', () => {
  it('reads retry_after_seconds and attempts_remaining from the error body', () => {
    const locked = new ApiError(429, 'x', {
      error: { code: 'ACCOUNT_LOCKED', message: 'Too many attempts. Try again in 15 minutes or reset your password.', field_errors: [], retry_after_seconds: 900 },
    })
    expect(apiErrorInfo(locked, 'f')).toMatchObject({ code: 'ACCOUNT_LOCKED', retryAfterSeconds: 900, attemptsRemaining: null })
    const mfa = new ApiError(401, 'x', { error: { code: 'MFA_INVALID_CODE', message: 'm', field_errors: [], attempts_remaining: 4 } })
    expect(apiErrorInfo(mfa, 'f').attemptsRemaining).toBe(4)
  })
  it('falls back for non-API errors', () => {
    expect(apiErrorInfo(new Error('boom'), 'f')).toMatchObject({ message: 'boom', retryAfterSeconds: null })
  })
})
