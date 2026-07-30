import Link from 'next/link'
import { Button, Field, fieldControlClasses } from '@/ui/primitives'
import { authModes, authShared } from '@/content/auth'

/**
 * Presentational only. Submission is deliberately unwired for this phase.
 * TODO(auth): wire to PRD Module 01 — POST /api/v1/auth/signup and
 * POST /api/v1/auth/login, plus OAuth at /api/v1/auth/oauth/{google|apple}.
 */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const copy = authModes[mode]
  const isSignup = mode === 'signup'

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="font-display text-[28px] font-semibold text-green-900 md:text-[32px]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[15px] text-sage-500">{copy.subtitle}</p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.google}
        </Button>
        <Button variant="secondary" size="md" className="w-full" disabled>
          {authShared.apple}
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[13px] text-sage-500">
        <span className="h-px flex-1 bg-sage-300" />
        {authShared.divider}
        <span className="h-px flex-1 bg-sage-300" />
      </div>

      <div className="flex flex-col gap-4">
        <Field label={authShared.emailLabel} htmlFor="auth-email" help={null}>
          {(describedById) => (
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              className={fieldControlClasses}
              placeholder={authShared.emailPlaceholder}
              aria-describedby={describedById}
            />
          )}
        </Field>

        <Field label={authShared.passwordLabel} htmlFor="auth-password" help={copy.passwordHelp}>
          {(describedById) => (
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className={fieldControlClasses}
              placeholder="••••••••"
              aria-describedby={describedById}
            />
          )}
        </Field>

        {isSignup ? (
          <div className="flex items-start gap-2.5">
            <input
              id="auth-terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-green-600)]"
            />
            <label htmlFor="auth-terms" className="text-[13px] leading-[1.4] text-sage-700">
              {authShared.termsPrefix}{' '}
              <Link href={authShared.termsLink.href} className="text-green-700 underline">
                {authShared.termsLink.label}
              </Link>{' '}
              {authShared.termsJoin}{' '}
              <Link href={authShared.privacyLink.href} className="text-green-700 underline">
                {authShared.privacyLink.label}
              </Link>
            </label>
          </div>
        ) : (
          <div className="-mt-1.5 text-right">
            {/* Route out of scope this phase; rendered as plain text, not a dead link. */}
            <span className="text-[13px] font-semibold text-sage-500">
              {authShared.forgotPassword}
            </span>
          </div>
        )}

        <Button variant="accent" size="md" className="w-full" disabled>
          {copy.cta}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-sage-500">
        {copy.footerText}{' '}
        <Link href={copy.footerLink.href} className="font-semibold text-green-700">
          {copy.footerLink.label}
        </Link>
      </p>
    </div>
  )
}
