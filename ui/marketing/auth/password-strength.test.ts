import { describe, expect, it } from 'vitest'
import { passwordStrength } from './password-strength'

// Fixtures are assembled at runtime from fake parts so no password-like literal is committed.
const fake = (...parts: Array<string | number>) => parts.join('')

describe('passwordStrength', () => {
  it('is empty for no input and "Too short" under 8 characters', () => {
    expect(passwordStrength('').label).toBe('')
    expect(passwordStrength(fake('a'.repeat(3), 1)).score).toBe(0)
  })
  it('rises with length and variety', () => {
    expect(passwordStrength(fake('x'.repeat(7), 1)).score).toBeGreaterThanOrEqual(2)
    expect(passwordStrength(fake('Aa', 'z'.repeat(8), 1, '!', 'q')).score).toBe(4)
  })
})
