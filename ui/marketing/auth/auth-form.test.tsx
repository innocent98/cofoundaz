import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AuthForm } from './auth-form'
import { authModes } from '@/content/auth'

describe('AuthForm signup mode', () => {
  it('renders the signup heading and CTA', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('heading', { level: 1, name: authModes.signup.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: authModes.signup.cta })).toBeInTheDocument()
  })

  it('shows the password help text and terms checkbox', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByText('8+ characters, one number')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('links terms and privacy', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('offers a link to log in instead', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })
})

describe('AuthForm login mode', () => {
  it('renders the login heading and CTA', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByRole('heading', { level: 1, name: authModes.login.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: authModes.login.cta })).toBeInTheDocument()
  })

  it('omits the terms checkbox and password help', () => {
    render(<AuthForm mode="login" />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('8+ characters, one number')).not.toBeInTheDocument()
  })

  it('offers a link to create a workspace instead', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByRole('link', { name: 'Create your workspace' })).toHaveAttribute('href', '/signup')
  })
})

describe('AuthForm accessibility', () => {
  it('labels the email and password inputs', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('has no accessibility violations in either mode', async () => {
    const signup = render(<AuthForm mode="signup" />)
    expect(await axe(signup.container)).toHaveNoViolations()
    signup.unmount()
    const login = render(<AuthForm mode="login" />)
    expect(await axe(login.container)).toHaveNoViolations()
  })

  it('wires the signup password field to its help text via aria-describedby', () => {
    render(<AuthForm mode="signup" />)
    const password = screen.getByLabelText('Password')
    const describedById = password.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    expect(document.getElementById(describedById as string)).toHaveTextContent(
      '8+ characters, one number'
    )
  })

  it('omits aria-describedby on the login password field, which has no help text', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-describedby')
  })
})
