import '@testing-library/jest-dom/vitest'
import { expect, vi } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// next/font needs the Next compiler; in unit tests it just yields a class name.
vi.mock('next/font/google', () => ({ Roboto: () => ({ className: 'font-roboto' }) }))
