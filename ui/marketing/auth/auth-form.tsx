'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GoogleButton } from './google-button'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { authCopy, authModes, authShared } from '@/content/auth'
import { passwordStrength } from '@/lib/auth/password-strength'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit?: (data: { email: string; password: string; agreedTerms?: boolean }) => Promise<void>
  error?: string | null
  successMessage?: string | null
  isSubmitting?: boolean
  /** Starts Google sign-in (navigates away on success; rejects on failure, the page shows the message). */
  onGoogle?: () => Promise<void>
  /** Prefills the email (an invite link carries it). */
  initialEmail?: string
  /** Errors shown under their field (from the API's field_errors). */
  fieldErrors?: { email?: string; password?: string; terms?: string }
  /** The sign-up "email already has an account" state: renders the PRD link to log in. */
  emailTaken?: boolean
  /** Login lock: seconds left; the button waits and a reset link is offered. */
  lockSeconds?: number
  /** Invited sign-up: the startup being joined, for the heading. */
  inviteStartup?: string | null
}

function formatWait(sec: number): string {
  const m = Math.floor(sec / 60)
  const r = sec % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function AuthForm({
  mode,
  onSubmit,
  error: externalError,
  successMessage,
  isSubmitting = false,
  onGoogle,
  initialEmail = '',
  fieldErrors,
  emailTaken = false,
  lockSeconds = 0,
  inviteStartup = null,
}: AuthFormProps) {
  const copy = authModes[mode]
  const isSignup = mode === 'signup'

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localFields, setLocalFields] = useState<{ email?: string; password?: string; terms?: string }>({})
  const [googleLoading, setGoogleLoading] = useState(false)

  const activeError = externalError || localError
  const fields = { ...fieldErrors, ...localFields }
  const strength = passwordStrength(password)
  const locked = lockSeconds > 0
  // A field error replaces the banner; the banner is for what belongs to no field.
  const showBanner = !!activeError && !emailTaken && !fieldErrors?.email && !fieldErrors?.password && !fieldErrors?.terms

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLocalError(null)
    setLocalFields({})
    if (locked) return

    const next: { email?: string; password?: string; terms?: string } = {}
    if (!email.trim()) next.email = 'Enter your email address.'
    if (!password) next.password = 'Enter your password.'
    if (isSignup && !agreedTerms) next.terms = authCopy.termsRequired
    if (Object.keys(next).length) {
      setLocalFields(next)
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

  async function handleGoogle() {
    if (!onGoogle) return
    setGoogleLoading(true)
    try {
      await onGoogle()
    } finally {
      // On success the window navigates away; on failure the button comes back.
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="font-display text-[28px] font-semibold text-brand-900 md:text-[32px]">
        {isSignup && inviteStartup ? authModes.signup.inviteTitle.replace('{startup}', inviteStartup) : copy.title}
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500">
        {isSignup && inviteStartup ? authModes.signup.inviteSubtitle : copy.subtitle}
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        <GoogleButton
          label={isSignup ? authShared.googleSignup : authShared.google}
          onClick={handleGoogle}
          disabled={!onGoogle || isSubmitting || googleLoading}
          busy={googleLoading}
        />
      </div>

      <div className="my-5 flex items-center gap-3 text-[13px] text-neutral-500">
        <span className="h-px flex-1 bg-neutral-300" />
        {authShared.divider}
        <span className="h-px flex-1 bg-neutral-300" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {showBanner && (
          <div
            role="alert"
            className="rounded-input border border-danger-200 bg-danger-50 p-3 text-[13px] text-danger-700"
          >
            {activeError}
            {locked && (
              <p className="mt-1.5">
                <Link href="/forgot-password" className="font-semibold underline">
                  {authCopy.lockedReset}
                </Link>
              </p>
            )}
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
              aria-invalid={fields.email || emailTaken ? true : undefined}
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

        {emailTaken && (
          <p role="alert" className="-mt-2 text-[13px] text-danger-700">
            {authCopy.emailTaken}{' '}
            <Link href="/login" className="font-semibold underline">
              {authCopy.emailTakenLink}
            </Link>
          </p>
        )}
        {fields.email && (
          <p role="alert" className="-mt-2 text-[13px] text-danger-700">
            {fields.email}
          </p>
        )}

        <Field label={authShared.passwordLabel} htmlFor="auth-password" help={copy.passwordHelp}>
          {(describedById) => (
            <input
              id="auth-password"
              aria-invalid={fields.password ? true : undefined}
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

        {fields.password && (
          <p role="alert" className="-mt-2 text-[13px] text-danger-700">
            {fields.password}
          </p>
        )}
        {isSignup && password && (
          <div className="-mt-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-pill ${
                    i <= strength.score
                      ? strength.score >= 3
                        ? 'bg-success-500'
                        : 'bg-accent-500'
                      : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[12px] text-neutral-500">Password strength: {strength.label}</p>
          </div>
        )}

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
        {isSignup && fields.terms && (
          <p role="alert" className="-mt-2 text-[13px] text-danger-700">
            {fields.terms}
          </p>
        )}

        <Button
          type="submit"
          variant="accent"
          size="md"
          className="w-full"
          disabled={isSubmitting || locked}
        >
          {isSubmitting ? 'Submitting...' : locked ? `Try again in ${formatWait(lockSeconds)}` : copy.cta}
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