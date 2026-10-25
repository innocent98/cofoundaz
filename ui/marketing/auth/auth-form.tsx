'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { authModes, authShared } from '@/content/auth'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit?: (data: { email: string; password: string; agreedTerms?: boolean }) => Promise<void>
  error?: string | null
  successMessage?: string | null
  isSubmitting?: boolean
  /** Prefills the email (an invite link carries it). */
  initialEmail?: string
}

export function AuthForm({
  mode,
  onSubmit,
  error: externalError,
  successMessage,
  isSubmitting = false,
  initialEmail = '',
}: AuthFormProps) {
  const copy = authModes[mode]
  const isSignup = mode === 'signup'

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const activeError = externalError || localError

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLocalError(null)

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.')
      return
    }

    if (isSignup && !agreedTerms) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    if (onSubmit) {
      await onSubmit({
        email: email.trim(),
        password,
        agreedTerms,
      })
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="font-display text-[28px] font-semibold text-brand-900 md:text-[32px]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500">{copy.subtitle}</p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.google}
        </Button>
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.apple}
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[13px] text-neutral-500">
        <span className="h-px flex-1 bg-neutral-300" />
        {authShared.divider}
        <span className="h-px flex-1 bg-neutral-300" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {activeError && (
          <div
            role="alert"
            className="rounded-input border border-danger-200 bg-danger-50 p-3 text-[13px] text-danger-700"
          >
            {activeError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-input border border-brand-200 bg-brand-50 p-3 text-[13px] text-brand-800"
          >
            {successMessage}
          </div>
        )}

        <Field label={authShared.emailLabel} htmlFor="auth-email" help={null}>
          {(describedById) => (
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={fieldControlClasses}
              placeholder={authShared.emailPlaceholder}
              {...(describedById ? { 'aria-describedby': describedById } : {})}
              required
            />
          )}
        </Field>

        <Field label={authShared.passwordLabel} htmlFor="auth-password" help={copy.passwordHelp}>
          {(describedById) => (
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className={fieldControlClasses}
              placeholder="••••••••"
              {...(describedById ? { 'aria-describedby': describedById } : {})}
              required
            />
          )}
        </Field>

        {isSignup ? (
          <div className="flex items-start gap-2.5">
            <input
              id="auth-terms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-600"
            />
            <label htmlFor="auth-terms" className="text-[13px] leading-[1.4] text-neutral-700">
              {authShared.termsPrefix}{' '}
              <Link href={authShared.termsLink.href} className="text-brand-700 underline">
                {authShared.termsLink.label}
              </Link>{' '}
              {authShared.termsJoin}{' '}
              <Link href={authShared.privacyLink.href} className="text-brand-700 underline">
                {authShared.privacyLink.label}
              </Link>
            </label>
          </div>
        ) : (
          <div className="-mt-1.5 text-right">
            <Link href="/forgot-password" className="text-[13px] font-semibold text-brand-700 hover:text-brand-800 hover:underline transition-colors">{authShared.forgotPassword}</Link>
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          size="md"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : copy.cta}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        {copy.footerText}{' '}
        <Link href={copy.footerLink.href} className="font-semibold text-brand-700">
          {copy.footerLink.label}
        </Link>
      </p>
    </div>
  )
}