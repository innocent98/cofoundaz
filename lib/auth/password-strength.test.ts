import { describe, expect, it } from 'vitest'
import { passwordStrength } from './password-strength'

describe('passwordStrength', () => {
  it('is empty for no input and "Too short" under 8 characters', () => {
    expect(passwordStrength('').label).toBe('')
    expect(passwordStrength('abc1').score).toBe(0)
  })
  it('rises with length and variety', () => {
    expect(passwordStrength('abcdefg1').score).toBeGreaterThanOrEqual(2)
    expect(passwordStrength('Abcdefghij1!x').score).toBe(4)
  })
})
