import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'

vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))

import { AuthForm } from './auth-form'

describe('Google button branding', () => {
  it('says Continue with Google on login and signup, with no Apple', () => {
    const { unmount } = render(<AuthForm mode="login" onGoogle={async () => {}} />)
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(screen.queryByText(/Apple/)).toBeNull()
    unmount()
    render(<AuthForm mode="signup" onGoogle={async () => {}} />)
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
  })

  it('uses Google colours, hides the G from assistive tech, and calls onGoogle', async () => {
    const onGoogle = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<AuthForm mode="login" onGoogle={onGoogle} />)
    const btn = screen.getByRole('button', { name: 'Continue with Google' })
    expect(btn.className).toContain('border-[#747775]')
    expect(btn.className).toContain('text-[#1F1F1F]')
    expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect([...btn.querySelectorAll('path')].map((p) => p.getAttribute('fill'))).toEqual(['#EA4335', '#4285F4', '#FBBC05', '#34A853'])
    fireEvent.click(btn)
    expect(onGoogle).toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
  })
})
